/**
 * Hero scene: a 3D printer builds a product layer by layer, shows it off, dissolves it, repeats.
 * Framework-free: no Vue imports. `three` is imported dynamically so it never reaches the main bundle
 * or the server render.
 */
import type * as ThreeTypes from 'three'

import { LOGO_SHAPE } from '../utils/logoShape'

type Three = typeof ThreeTypes

export interface PrintSceneOptions {
  container: HTMLElement
  /** Coarse pointer / small screen: lower pixel ratio, no antialias, no parallax. */
  isMobile: boolean
  /** Render a single frame of the finished model and never loop. */
  reducedMotion: boolean
  onFirstFrame?: () => void
  /** Called once if the device cannot hold ~20 fps; the caller should dispose and show the poster. */
  onSlow?: () => void
  /** Dev only: start the loop this many seconds in (to inspect a phase). */
  startAt?: number
}

export interface PrintScene {
  pause: () => void
  resume: () => void
  dispose: () => void
}

// Timeline (seconds)
const PRINT = 6
const LIFT = 0.8
const SPIN = 4
const DISSOLVE = 1.6
const LAYER = 0.12 // head raster layer height (world units)
const BED = 5.2
const FRAME = BED / 2 + 0.15 // frame post offset from centre
const MODEL_SCALE = 1.3

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1)
const smooth = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const tri = (x: number) => Math.abs((x - Math.floor(x)) * 2 - 1) * 2 - 1

/** The logo artwork, painted onto the printed logo. Resolves to null if it fails to load (the model then prints in plain blue). */
function loadLogoImage(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = '/images/logo-print.webp'
  })
}

export async function createPrintScene(opts: PrintSceneOptions): Promise<PrintScene> {
  const logoImage = loadLogoImage() // fetched in parallel with three.js
  const THREE = (await import('three')) as Three
  const { RoundedBoxGeometry } = await import('three/examples/jsm/geometries/RoundedBoxGeometry.js')
  const { container, isMobile, reducedMotion } = opts

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: !isMobile,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.localClippingEnabled = true
  const canvas = renderer.domElement
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y;'
  canvas.setAttribute('aria-hidden', 'true')
  container.appendChild(canvas)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
  const target = new THREE.Vector3(0, 1.5, 0)

  // ---- lights ------------------------------------------------------------
  scene.add(new THREE.HemisphereLight(0xbcd4ff, 0x20150a, 1.1))
  const key = new THREE.DirectionalLight(0xffffff, 2.4)
  key.position.set(4, 8, 5)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0x6675f7, 2.2)
  rim.position.set(-5, 3, -5)
  scene.add(rim)

  // ---- helpers -----------------------------------------------------------
  function radialTexture(stops: [number, string][], size = 256) {
    const c = document.createElement('canvas')
    c.width = c.height = size
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    for (const [o, color] of stops) grad.addColorStop(o, color)
    g.fillStyle = grad
    g.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }

  function roundedRect(w: number, h: number, r: number) {
    const s = new THREE.Shape()
    const x = -w / 2
    const y = -h / 2
    s.moveTo(x + r, y)
    s.lineTo(x + w - r, y)
    s.quadraticCurveTo(x + w, y, x + w, y + r)
    s.lineTo(x + w, y + h - r)
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    s.lineTo(x + r, y + h)
    s.quadraticCurveTo(x, y + h, x, y + h - r)
    s.lineTo(x, y + r)
    s.quadraticCurveTo(x, y, x + r, y)
    return s
  }

  // ---- print bed ---------------------------------------------------------
  const bed = new THREE.Group()
  const plateGeo = new THREE.ExtrudeGeometry(roundedRect(BED, BED, 0.55), { depth: 0.25, bevelEnabled: false })
  plateGeo.rotateX(-Math.PI / 2)
  plateGeo.translate(0, -0.25, 0)
  bed.add(new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ color: 0x161a20, roughness: 0.65, metalness: 0.35 })))

  // fine grid on the plate
  const gridCanvas = document.createElement('canvas')
  gridCanvas.width = gridCanvas.height = 512
  const gctx = gridCanvas.getContext('2d')!
  gctx.strokeStyle = 'rgba(255,255,255,0.09)'
  gctx.lineWidth = 1
  for (let i = 0; i <= 16; i++) {
    const p = (i / 16) * 512
    gctx.beginPath(); gctx.moveTo(p, 0); gctx.lineTo(p, 512); gctx.stroke()
    gctx.beginPath(); gctx.moveTo(0, p); gctx.lineTo(512, p); gctx.stroke()
  }
  const gridTex = new THREE.CanvasTexture(gridCanvas)
  gridTex.colorSpace = THREE.SRGBColorSpace
  gridTex.anisotropy = 4
  const grid = new THREE.Mesh(
    new THREE.PlaneGeometry(BED - 0.5, BED - 0.5),
    new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, depthWrite: false }),
  )
  grid.rotation.x = -Math.PI / 2
  grid.position.y = 0.002
  bed.add(grid)

  // faint indigo edge
  const edgePts = roundedRect(BED - 0.12, BED - 0.12, 0.5).getPoints(12).map(p => new THREE.Vector3(p.x, 0.004, -p.y))
  const edge = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(edgePts),
    new THREE.LineBasicMaterial({ color: 0x6675f7, transparent: true, opacity: 0.75 }),
  )
  bed.add(edge)

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(BED + 3.5, BED + 3.5),
    new THREE.MeshBasicMaterial({
      map: radialTexture([[0, 'rgba(255,122,26,0.55)'], [0.55, 'rgba(255,122,26,0.12)'], [1, 'rgba(255,122,26,0)']]),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  glow.rotation.x = -Math.PI / 2
  glow.position.y = -0.3
  bed.add(glow)

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 3.8),
    new THREE.MeshBasicMaterial({
      map: radialTexture([[0, 'rgba(0,0,0,0.65)'], [0.6, 'rgba(0,0,0,0.25)'], [1, 'rgba(0,0,0,0)']]),
      transparent: true,
      depthWrite: false,
    }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.003
  bed.add(shadow)
  scene.add(bed)

  // ---- printer frame (context only) -------------------------------------
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x232830, roughness: 0.5, metalness: 0.6 })
  const frame = new THREE.Group()
  for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.7, 0.18), frameMat)
    post.position.set(sx * FRAME, 2.35, -FRAME)
    frame.add(post)
  }
  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(BED + 0.5, 0.18, 0.18), frameMat)
  topBeam.position.set(0, 4.7, -FRAME)
  frame.add(topBeam)
  scene.add(frame)

  // moving X rail + arm + head
  const rail = new THREE.Mesh(new THREE.BoxGeometry(BED + 0.3, 0.1, 0.14), frameMat)
  scene.add(rail)
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1), frameMat)
  scene.add(arm)

  const head = new THREE.Group() // origin = nozzle tip
  const headMetal = new THREE.MeshStandardMaterial({ color: 0x3a414c, roughness: 0.4, metalness: 0.8 })
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 20), headMetal)
  body.position.y = 0.62
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.16, 0.26),
    new THREE.MeshStandardMaterial({ color: 0x6675f7, roughness: 0.4, metalness: 0.5, emissive: 0x3533cd, emissiveIntensity: 0.35 }),
  )
  block.position.y = 0.32
  const nozzleGeo = new THREE.ConeGeometry(0.09, 0.22, 16)
  nozzleGeo.rotateX(Math.PI)
  const nozzle = new THREE.Mesh(nozzleGeo, new THREE.MeshStandardMaterial({ color: 0xd9b36a, roughness: 0.3, metalness: 0.9 }))
  nozzle.position.y = 0.11
  const nozzleLight = new THREE.PointLight(0xff8a2a, 2.2, 3.2, 1.6)
  nozzleLight.position.y = 0.08
  head.add(body, block, nozzle, nozzleLight)
  scene.add(head)

  // ---- models (procedural placeholders; bottom sits on y = 0) --------------
  const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)
  const uniforms = {
    uCut: { value: 0 },
    uBand: { value: 0.14 },
    uGlow: { value: new THREE.Color(0x6675f7) },
    uK: { value: 2.2 },
    uLayer: { value: 0.085 },
  }

  function makeMaterial(color: number, map?: ThreeTypes.Texture) {
    const m = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.55,
      metalness: 0.05,
      side: THREE.DoubleSide,
      clippingPlanes: [clipPlane],
    })
    if (map) {
      // keep the artwork's colours vivid under the scene lights
      m.map = map
      m.emissive = new THREE.Color(0xffffff)
      m.emissiveMap = map
      m.emissiveIntensity = 0.22
    }
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vWY;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWY = (modelMatrix * vec4(transformed, 1.0)).y;')
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vWY;\nuniform float uCut;\nuniform float uBand;\nuniform vec3 uGlow;\nuniform float uK;\nuniform float uLayer;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float lf = fract(vWY / uLayer);
          diffuseColor.rgb *= 0.84 + 0.16 * smoothstep(0.0, 0.3, lf) * (1.0 - smoothstep(0.7, 1.0, lf));`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          float hot = 1.0 - smoothstep(0.0, uBand, abs(vWY - uCut));
          totalEmissiveRadiance += uGlow * hot * hot * uK;`)
    }
    m.customProgramCacheKey = () => 'b3d-print-v1'
    return m
  }

  /** Move an object so its bbox bottom sits on y = 0 and it is centred on x/z. */
  function grounded(obj: ThreeTypes.Object3D) {
    const box = new THREE.Box3().setFromObject(obj)
    const c = box.getCenter(new THREE.Vector3())
    obj.position.set(-c.x, -box.min.y, -c.z)
    const holder = new THREE.Group()
    holder.add(obj)
    holder.scale.setScalar(MODEL_SCALE)
    return holder
  }

  const logoReady = await logoImage

  /** The Byte3D logo: its traced silhouette extruded into a chunky plaque, painted with the logo artwork. ~3 tall. */
  function logo() {
    const H = 3.0
    const W = H * LOGO_SHAPE.aspect
    const depth = 0.55
    const toWorld = ([x, y]: [number, number]) => new THREE.Vector2((x - 0.5) * W, y * H)
    const shape = new THREE.Shape(LOGO_SHAPE.outer.map(toWorld))
    for (const hole of LOGO_SHAPE.holes) shape.holes.push(new THREE.Path(hole.map(toWorld)))
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSize: 0.035,
      bevelOffset: -0.035,
      bevelThickness: 0.05,
      bevelSegments: 2,
    })
    // UVs straight from the outline, so the front face shows the artwork exactly and the walls take the edge colours
    const pos = geo.getAttribute('position')
    const uv = geo.getAttribute('uv')
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / W + 0.5, pos.getY(i) / H)

    let texture: ThreeTypes.Texture | undefined
    if (logoReady) {
      texture = new THREE.Texture(logoReady)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = 4
      texture.needsUpdate = true
    }
    const g = new THREE.Group()
    g.add(new THREE.Mesh(geo, texture ? makeMaterial(0xffffff, texture) : makeMaterial(0x2f7cf6)))
    g.rotation.y = 0.55 // turned toward the camera while it prints
    return grounded(g)
  }

  /** Mini robot: rounded torso and head, capsule arms, antenna. ~2.7 tall, bottom on y = 0. */
  function robot() {
    const body = makeMaterial(0x6675f7)
    const trim = makeMaterial(0xf2f4f7)
    const glow = makeMaterial(0x68dbf2)
    const g = new THREE.Group()
    const put = (geo: ThreeTypes.BufferGeometry, mat: ThreeTypes.Material, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(geo, mat)
      m.position.set(x, y, z)
      g.add(m)
      return m
    }
    const rbox = (w: number, h: number, d: number, r: number) => new RoundedBoxGeometry(w, h, d, 3, r)
    const zCyl = (r: number, len: number) => {
      const c = new THREE.CylinderGeometry(r, r, len, 24)
      c.rotateX(Math.PI / 2) // axis along z, so it sticks out of the front
      return c
    }
    const xCyl = (r: number, len: number) => {
      const c = new THREE.CylinderGeometry(r, r, len, 20)
      c.rotateZ(Math.PI / 2) // axis along x, so it sticks out of the sides
      return c
    }

    for (const sx of [-1, 1]) {
      put(rbox(0.52, 0.3, 0.72, 0.09), body, sx * 0.42, 0.15, 0.05) // foot
      put(new THREE.CylinderGeometry(0.14, 0.16, 0.34, 20), trim, sx * 0.42, 0.45, 0) // leg
      put(new THREE.SphereGeometry(0.19, 20, 16), body, sx * 0.88, 1.42, 0) // shoulder
      put(new THREE.CapsuleGeometry(0.15, 0.58, 6, 16), trim, sx * 1.0, 1.02, 0) // arm
      put(new THREE.SphereGeometry(0.19, 20, 16), body, sx * 1.0, 0.56, 0) // hand
    }

    put(rbox(1.5, 1.0, 0.95, 0.16), body, 0, 1.1, 0) // torso
    put(rbox(0.82, 0.48, 0.06, 0.04), trim, 0, 1.2, 0.5) // chest panel
    put(zCyl(0.1, 0.06), glow, 0, 1.2, 0.54) // chest button
    for (const sx of [-1, 1]) put(zCyl(0.045, 0.05), body, sx * 0.25, 0.86, 0.5) // rivets

    put(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 20), trim, 0, 1.67, 0) // neck
    put(rbox(1.25, 0.7, 0.85, 0.18), body, 0, 2.07, 0) // head
    for (const sx of [-1, 1]) {
      put(zCyl(0.1, 0.07), glow, sx * 0.3, 2.12, 0.44) // eyes
      put(xCyl(0.1, 0.1), trim, sx * 0.66, 2.07, 0) // ear bolts
    }
    put(rbox(0.4, 0.07, 0.05, 0.02), trim, 0, 1.9, 0.44) // mouth grille
    put(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 12), trim, 0, 2.52, 0) // antenna
    put(new THREE.SphereGeometry(0.085, 18, 14), glow, 0, 2.66, 0) // antenna tip

    return grounded(g)
  }

  /** Mini house: plinth, walls, gable roof, chimney, door and windows. ~2.7 tall, front faces +z. */
  function house() {
    const wall = makeMaterial(0xf2f4f7)
    const roofMat = makeMaterial(0x6675f7)
    const brick = makeMaterial(0xc25410)
    const glass = makeMaterial(0x68dbf2)
    const g = new THREE.Group()
    const put = (geo: ThreeTypes.BufferGeometry, mat: ThreeTypes.Material, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(geo, mat)
      m.position.set(x, y, z)
      g.add(m)
      return m
    }
    const rbox = (w: number, h: number, d: number, r: number) => new RoundedBoxGeometry(w, h, d, 2, r)

    put(rbox(2.7, 0.14, 2.1, 0.04), wall, 0, 0.07, 0) // plinth
    put(rbox(2.0, 1.15, 1.5, 0.04), wall, 0, 0.715, 0) // walls (0.14 .. 1.29)

    // gable roof: triangle (width along z, ridge along x), slightly overhanging
    const tri = new THREE.Shape()
    tri.moveTo(-1.0, 0)
    tri.lineTo(1.0, 0)
    tri.lineTo(0, 0.9)
    tri.closePath()
    const roofGeo = new THREE.ExtrudeGeometry(tri, { depth: 2.3, bevelEnabled: false })
    roofGeo.translate(0, 0, -1.15)
    roofGeo.rotateY(Math.PI / 2) // length along x
    put(roofGeo, roofMat, 0, 1.29, 0)

    put(rbox(0.3, 0.8, 0.3, 0.03), brick, 0.62, 1.9, -0.4) // chimney
    put(rbox(0.38, 0.07, 0.38, 0.02), wall, 0.62, 2.33, -0.4) // chimney cap

    // front: door, step, knob, two windows
    put(rbox(0.46, 0.8, 0.06, 0.03), glass, 0, 0.54, 0.77)
    put(new THREE.SphereGeometry(0.035, 12, 10), wall, 0.13, 0.52, 0.81)
    put(rbox(0.74, 0.07, 0.3, 0.02), wall, 0, 0.175, 0.9)
    for (const sx of [-1, 1]) {
      put(rbox(0.46, 0.46, 0.05, 0.02), wall, sx * 0.65, 0.88, 0.76) // frame
      put(rbox(0.32, 0.32, 0.07, 0.02), glass, sx * 0.65, 0.88, 0.77) // glass
      put(rbox(0.05, 0.38, 0.38, 0.02), glass, sx * 1.02, 0.85, 0) // side windows
      const round = new THREE.CylinderGeometry(0.13, 0.13, 0.05, 24)
      round.rotateZ(Math.PI / 2)
      put(round, glass, sx * 1.16, 1.29 + 0.3, 0) // gable round window
    }

    g.scale.setScalar(1.15)
    return grounded(g)
  }

  function keychain() {
    const s = roundedRect(3.1, 1.9, 0.42)
    const hole = new THREE.Path()
    hole.absarc(-1.0, 0.45, 0.2, 0, Math.PI * 2, true)
    s.holes.push(hole)
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.42, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2, curveSegments: 20 })
    const mesh = new THREE.Mesh(geo, makeMaterial(0x68dbf2))
    // emboss: three raised bars standing in for text
    const barMat = makeMaterial(0xf2f4f7)
    const bars = new THREE.Group()
    ;[[0.45, 1.5], [0.0, 1.1], [-0.45, 1.3]].forEach(([y, w]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w!, 0.16, 0.16), barMat)
      b.position.set(0.35, y!, 0.42 + 0.05 + 0.08)
      bars.add(b)
    })
    const g = new THREE.Group()
    g.add(mesh, bars)
    g.rotation.y = 0
    return grounded(g)
  }

  function spinner() {
    const mat = makeMaterial(0xa855f7)
    const g = new THREE.Group()
    const ring = (outer: number, inner: number, x: number, z: number) => {
      const s = new THREE.Shape(); s.absarc(0, 0, outer, 0, Math.PI * 2, false)
      const h = new THREE.Path(); h.absarc(0, 0, inner, 0, Math.PI * 2, true); s.holes.push(h)
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.7, bevelEnabled: false, curveSegments: 40 })
      geo.rotateX(-Math.PI / 2)
      const m = new THREE.Mesh(geo, mat)
      m.position.set(x, 0, z)
      g.add(m)
    }
    ring(0.62, 0.32, 0, 0)
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2
      const x = Math.cos(a) * 1.3
      const z = Math.sin(a) * 1.3
      ring(0.66, 0.34, x, z)
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 0.42), mat)
      arm.position.set(x / 2, 0.35, z / 2)
      arm.rotation.y = -a
      g.add(arm)
    }
    return grounded(g)
  }

  const models = [logo(), robot(), house(), keychain(), spinner()]
  const modelBox = models.map((m) => {
    const b = new THREE.Box3().setFromObject(m)
    return { box: b, height: b.max.y }
  })
  models.forEach((m) => { m.visible = false; scene.add(m) })

  // ---- camera / parallax -------------------------------------------------
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
  const allowParallax = !isMobile && window.matchMedia('(pointer: fine)').matches && !reducedMotion
  function onPointer(e: PointerEvent) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
  }
  if (allowParallax) window.addEventListener('pointermove', onPointer, { passive: true })

  let aspect = 1
  function placeCamera() {
    const yaw = THREE.MathUtils.degToRad(40 + pointer.sx * 3)
    const pitch = THREE.MathUtils.degToRad(24 + pointer.sy * -1.5)
    const fit = aspect >= 1.15 ? 1 : Math.min(1.15 / aspect, 1.9)
    const dist = 17.5 * fit
    camera.position.set(
      target.x + dist * Math.cos(pitch) * Math.sin(yaw),
      target.y + dist * Math.sin(pitch),
      target.z + dist * Math.cos(pitch) * Math.cos(yaw),
    )
    camera.lookAt(target)
  }

  function resize() {
    const w = Math.max(container.clientWidth, 1)
    const h = Math.max(container.clientHeight, 1)
    renderer.setSize(w, h, false)
    aspect = w / h
    camera.aspect = aspect
    camera.updateProjectionMatrix()
    placeCamera()
    if (!running) renderFrame()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)

  // ---- state machine -----------------------------------------------------
  let modelIndex = 0
  let phaseStart = 0
  let elapsed = opts.startAt ?? 0
  let firstFrameDone = false
  let running = false
  let raf = 0
  let visible = true
  let last = 0

  const FINISH_SPIN = 0.55

  function setHead(show: boolean, x = 0, y = 0, z = 0) {
    head.visible = show
    rail.visible = show
    arm.visible = show
    if (!show) return
    head.position.set(x, y, z)
    rail.position.set(0, y + 0.62, -FRAME)
    arm.position.set(x, y + 0.62, (z - FRAME) / 2)
    arm.scale.z = Math.max(Math.abs(z + FRAME), 0.01)
  }

  function showModel(i: number) {
    models.forEach((m, idx) => { m.visible = idx === i })
  }

  function update(now: number) {
    const idx = modelIndex % models.length
    const info = modelBox[idx]!
    const H = info.height
    const model = models[idx]!
    const t = now - phaseStart
    showModel(idx)

    if (t < PRINT) {
      const p = clamp01(t / PRINT)
      const e = 0.8 * p + 0.2 * smooth(p)
      const h = Math.max(H * e, 0.001)
      clipPlane.constant = h
      uniforms.uCut.value = h
      uniforms.uK.value = 2.2
      uniforms.uGlow.value.setHex(0x6675f7)
      model.rotation.y = 0
      const rx = (info.box.max.x - info.box.min.x) / 2 * 0.9
      const rz = (info.box.max.z - info.box.min.z) / 2 * 0.9
      const layerFrac = (h / LAYER) % 1
      const x = tri(t * 1.9) * rx
      const z = (layerFrac * 2 - 1) * rz
      setHead(true, x, h, z)
      nozzleLight.intensity = 2.0 + Math.sin(now * 40) * 0.35 + Math.sin(now * 17) * 0.2
    } else if (t < PRINT + LIFT) {
      const p = smooth(clamp01((t - PRINT) / LIFT))
      clipPlane.constant = H + 1
      uniforms.uCut.value = H
      uniforms.uK.value = lerp(2.2, 0, p)
      setHead(true, lerp(0, 2.6, p), H + p * 0.5, 0)
      nozzleLight.intensity = lerp(2, 0, p)
    } else if (t < PRINT + LIFT + SPIN) {
      const p = clamp01((t - PRINT - LIFT) / SPIN)
      clipPlane.constant = H + 1
      setHead(false)
      model.rotation.y = smooth(p) * Math.PI * 2
      // soft highlight sweep climbing the finished model
      const sweep = clamp01(p / 0.55)
      uniforms.uCut.value = lerp(-0.2, H + 0.3, sweep)
      uniforms.uGlow.value.setHex(0xbff3ff)
      uniforms.uK.value = sweep > 0 && sweep < 1 ? 0.55 : 0
    } else if (t < PRINT + LIFT + SPIN + DISSOLVE) {
      const p = clamp01((t - PRINT - LIFT - SPIN) / DISSOLVE)
      const h = H * (1 - smooth(p))
      clipPlane.constant = h
      uniforms.uCut.value = h
      uniforms.uGlow.value.setHex(0x6675f7)
      uniforms.uK.value = 1.6
      model.rotation.y = 0
      setHead(false)
    } else {
      modelIndex++
      phaseStart = now
    }
  }

  function renderStill() {
    showModel(0)
    models[0]!.rotation.y = FINISH_SPIN
    clipPlane.constant = modelBox[0]!.height + 1
    uniforms.uK.value = 0
    setHead(false)
    renderFrame()
  }

  function renderFrame() {
    if (allowParallax) {
      pointer.sx = lerp(pointer.sx, pointer.x, 0.06)
      pointer.sy = lerp(pointer.sy, pointer.y, 0.06)
    }
    placeCamera()
    renderer.render(scene, camera)
    if (!firstFrameDone) {
      firstFrameDone = true
      opts.onFirstFrame?.()
    }
  }

  // Frame-time guard: sample ~60 frames after a short warm-up; bail out on slow devices.
  const samples: number[] = []
  let frames = 0
  let slowReported = false
  function guard(rawDt: number) {
    if (slowReported || rawDt <= 0 || rawDt > 1) return // ignore first frame and tab-switch gaps
    frames++
    if (frames <= 10) return // warm-up (shader compile, texture upload)
    samples.push(rawDt)
    if (samples.length === 60) {
      const median = [...samples].sort((a, b) => a - b)[30]!
      if (median > 0.05) { // < 20 fps
        slowReported = true
        opts.onSlow?.()
      }
    }
  }

  function tick(ts: number) {
    raf = 0
    if (!running) return
    const rawDt = last ? (ts - last) / 1000 : 0
    guard(rawDt)
    if (slowReported) return
    const dt = Math.min(rawDt, 0.1)
    last = ts
    elapsed += dt
    update(elapsed)
    renderFrame()
    raf = requestAnimationFrame(tick)
  }

  function shouldRun() {
    return !reducedMotion && visible && !document.hidden && userRunning
  }
  let userRunning = true
  function sync() {
    const want = shouldRun()
    if (want && !running) {
      running = true
      last = 0
      raf = requestAnimationFrame(tick)
    } else if (!want && running) {
      running = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }
  }

  const io = new IntersectionObserver((entries) => {
    visible = entries.some(e => e.isIntersecting)
    sync()
  }, { threshold: 0.05 })
  io.observe(container)
  const onVisibility = () => sync()
  document.addEventListener('visibilitychange', onVisibility)

  resize()
  if (reducedMotion) renderStill()
  else sync()

  return {
    pause() { userRunning = false; sync() },
    resume() { userRunning = true; sync() },
    dispose() {
      running = false
      userRunning = false
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onPointer)
      scene.traverse((obj) => {
        const mesh = obj as ThreeTypes.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const mats = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : []
        for (const m of mats) {
          const map = (m as ThreeTypes.MeshBasicMaterial).map
          if (map) map.dispose()
          m.dispose()
        }
      })
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
