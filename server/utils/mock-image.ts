// Generated placeholder art for the mock API. Never real product photos.

type Kind = 'figurine' | 'keychain' | 'nfc' | 'fidget' | 'gift' | 'robot' | 'laser'

function shape(kind: Kind, c: string, c2: string): string {
  switch (kind) {
    case 'keychain':
      return `
        <circle cx="-130" cy="-170" r="68" fill="none" stroke="${c2}" stroke-width="22"/>
        <rect x="-240" y="-120" width="480" height="240" rx="64" fill="${c}"/>
        <circle cx="-170" cy="-60" r="22" fill="#0b0d10"/>
        <rect x="-110" y="-44" width="300" height="24" rx="12" fill="rgb(0 0 0 / .35)"/>
        <rect x="-110" y="2" width="210" height="24" rx="12" fill="rgb(0 0 0 / .25)"/>
        <rect x="-110" y="48" width="260" height="24" rx="12" fill="rgb(0 0 0 / .2)"/>`
    case 'figurine':
      return `
        <ellipse cx="0" cy="200" rx="180" ry="42" fill="${c2}"/>
        <path d="M-96 196 L-62 -10 Q0 -52 62 -10 L96 196 Z" fill="${c}"/>
        <circle cx="0" cy="-104" r="64" fill="${c}"/>
        <path d="M-52 -150 L-82 -230 L-18 -166 Z M52 -150 L82 -230 L18 -166 Z" fill="${c2}"/>
        <circle cx="-22" cy="-110" r="9" fill="#0b0d10"/><circle cx="22" cy="-110" r="9" fill="#0b0d10"/>`
    case 'nfc':
      return `
        <rect x="-180" y="-180" width="360" height="360" rx="76" fill="${c}"/>
        <path d="M-60 -64 a 90 90 0 0 1 0 128 M-14 -104 a 150 150 0 0 1 0 208 M32 -144 a 210 210 0 0 1 0 288" fill="none" stroke="rgb(0 0 0 / .45)" stroke-width="22" stroke-linecap="round"/>
        <circle cx="-86" cy="0" r="24" fill="rgb(0 0 0 / .45)"/>`
    case 'fidget':
      return `
        <g fill="${c}">
          <circle cx="0" cy="-130" r="84"/><circle cx="113" cy="65" r="84"/><circle cx="-113" cy="65" r="84"/>
        </g>
        <circle cx="0" cy="0" r="86" fill="${c2}"/>
        <g fill="#0b0d10"><circle cx="0" cy="-130" r="36"/><circle cx="113" cy="65" r="36"/><circle cx="-113" cy="65" r="36"/><circle cx="0" cy="0" r="30"/></g>`
    case 'gift':
      return `
        <rect x="-180" y="-50" width="360" height="240" rx="20" fill="${c}"/>
        <rect x="-204" y="-110" width="408" height="76" rx="20" fill="${c2}"/>
        <rect x="-24" y="-110" width="48" height="300" fill="rgb(255 255 255 / .85)"/>
        <path d="M0 -112 C -90 -200 -150 -130 -60 -112 Z M0 -112 C 90 -200 150 -130 60 -112 Z" fill="rgb(255 255 255 / .85)"/>`
    case 'robot': {
      const teeth = Array.from({ length: 12 }, (_, i) =>
        `<rect x="-26" y="-190" width="52" height="64" rx="10" fill="${c2}" transform="rotate(${i * 30})"/>`).join('')
      return `${teeth}<circle r="150" fill="${c}"/><circle r="62" fill="#0b0d10"/>
        <circle r="110" fill="none" stroke="rgb(0 0 0 / .25)" stroke-width="10" stroke-dasharray="26 18"/>`
    }
    case 'laser':
      return `
        <rect x="-230" y="-150" width="460" height="300" rx="34" fill="${c}"/>
        <circle cx="-180" cy="-100" r="18" fill="#0b0d10"/>
        <polygon points="0,-90 26,-28 94,-24 42,18 60,84 0,48 -60,84 -42,18 -94,-24 -26,-28" fill="rgb(0 0 0 / .4)"/>
        <rect x="-150" y="104" width="300" height="12" rx="6" fill="rgb(0 0 0 / .28)"/>`
  }
}

export const MOCK_IMAGE_KINDS: Kind[] = ['figurine', 'keychain', 'nfc', 'fidget', 'gift', 'robot', 'laser']

/** `variant` 0..3 changes angle and zoom so gallery images look different. */
export function mockImageSvg(kind: string, hue: number, variant: number): string {
  const k = (MOCK_IMAGE_KINDS.includes(kind as Kind) ? kind : 'gift') as Kind
  const c = `hsl(${hue} 92% 56%)`
  const c2 = `hsl(${hue} 80% 38%)`
  const rotations = [0, -14, 10, 0]
  const scales = [1, 1.08, 0.92, 1.4]
  const rot = rotations[variant % 4]
  const scale = scales[variant % 4]
  const lines = Array.from({ length: 80 }, (_, i) => `<rect y="${i * 10}" width="800" height="1.5" fill="#fff" opacity=".035"/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="70%">
      <stop offset="0" stop-color="hsl(${hue} 45% 20%)"/><stop offset="1" stop-color="#0b0d10"/>
    </radialGradient>
    <radialGradient id="sh"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>${lines}
  <ellipse cx="400" cy="640" rx="250" ry="44" fill="url(#sh)"/>
  <g transform="translate(400 390) rotate(${rot}) scale(${scale})">${shape(k, c, c2)}</g>
</svg>`
}
