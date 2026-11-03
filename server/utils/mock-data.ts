// Mock catalog that mirrors the API contract in ../../CLAUDE.md. Delete once the Laravel API is live.
import type {
  ApiImage, Category, CustomizationField, ProductBadge, ProductCard, ProductDetail, ProductVariant,
} from '~~/app/types/api'

type ProductType = 'standard' | 'customizable' | 'made_to_order'

interface CategoryDef {
  id: number
  slug: string
  name: string
  description: string
  kind: string
  hue: number
  featured: boolean
}

export const CATEGORY_DEFS: CategoryDef[] = [
  { id: 1, slug: 'figurines-miniatures', name: 'Figurines & Miniatures', description: 'Detailed 3D printed figurines, miniatures and collectibles for desks, shelves and tabletop games.', kind: 'figurine', hue: 24, featured: true },
  { id: 2, slug: 'custom-keychains', name: 'Custom Keychains', description: 'Keychains with your name, initial or logo — 3D printed in the colour you choose.', kind: 'keychain', hue: 190, featured: true },
  { id: 3, slug: 'nfc-keychains', name: 'NFC Keychains', description: 'Tap-to-share keychains that open your profile, menu or review page on any phone.', kind: 'nfc', hue: 160, featured: true },
  { id: 4, slug: 'fidget-toys', name: 'Fidget Toys', description: 'Spinners, cubes and flexi toys that feel as good as they look.', kind: 'fidget', hue: 280, featured: true },
  { id: 5, slug: 'gifts-3d-goodies', name: 'Gifts & 3D Goodies', description: 'Personalised gifts and useful little things for the people you care about.', kind: 'gift', hue: 340, featured: true },
  { id: 6, slug: 'prototypes-robotics-parts', name: 'Prototypes & Robotics Parts', description: 'Brackets, cases and gears for makers, students and engineers.', kind: 'robot', hue: 45, featured: true },
  { id: 7, slug: 'laser-engraved-products', name: 'Laser Engraved Products', description: 'Wood and acrylic pieces engraved with your design on our laser engraver.', kind: 'laser', hue: 10, featured: false },
]

const COLORS: Record<string, string> = {
  Black: '#111111', White: '#F2F2F2', Orange: '#FF7A1A', Cyan: '#22D3EE', Red: '#EF4444',
  Green: '#22C55E', Purple: '#A855F7', Gray: '#9CA3AF', Natural: '#C9A27A', Dark: '#4B3426', Clear: '#CFE8EE',
}

/** [material, color, size, price, stock (null = made to order), compareAt?] */
type VDef = [string, string, string | null, number, number | null, number?]

interface ProductDef {
  id: number
  slug: string
  name: string
  cat: number
  type: ProductType
  featured?: number
  isNew?: boolean
  short: string
  desc: string[]
  variants: VDef[]
  schema?: CustomizationField[]
  dims?: string
  days: [number, number]
}

const text = (key: string, label: string, max: number, required: boolean, extra = 0): CustomizationField =>
  ({ key, type: 'text', label, max, required, extra_price: extra })
const image = (key: string, label: string, required: boolean, extra = 0): CustomizationField =>
  ({ key, type: 'image', label, required, extra_price: extra })
const url = (key: string, label: string): CustomizationField =>
  ({ key, type: 'url', label, required: true, extra_price: 0 })

const PRODUCT_DEFS: ProductDef[] = [
  { id: 1, slug: 'dragon-miniature', name: 'Dragon Miniature', cat: 1, type: 'standard', featured: 3, isNew: true,
    short: 'A fierce little dragon with sharp scales and spread wings.',
    desc: ['Printed layer by layer with fine detail, then hand-cleaned. Perfect for desks, shelves or tabletop games.', 'Available in PLA, PETG and high-detail resin.'],
    variants: [['PLA', 'Orange', 'Small', 45000, 12, 55000], ['PLA', 'Black', 'Small', 45000, 8, 55000], ['PETG', 'Gray', 'Medium', 65000, 5], ['Resin', 'Gray', 'Medium', 95000, 3]],
    dims: '80 × 60 × 70 mm', days: [2, 4] },
  { id: 2, slug: 'astronaut-figurine', name: 'Astronaut Figurine', cat: 1, type: 'standard', featured: 7, isNew: true,
    short: 'A tiny explorer for your desk, ready for lift-off.',
    desc: ['A clean, glossy-looking figurine with a visor you will want to touch. Great as a gift for space lovers.'],
    variants: [['PLA', 'White', 'Small', 32000, 20], ['PLA', 'Orange', 'Medium', 48000, 10]],
    dims: '60 × 40 × 90 mm', days: [2, 3] },
  { id: 3, slug: 'tabletop-dungeon-set', name: 'Tabletop Dungeon Set', cat: 1, type: 'standard',
    short: '12 pieces of modular dungeon terrain for tabletop games.',
    desc: ['Walls, doors, pillars and a staircase that snap onto a standard 25 mm grid.'],
    variants: [['PLA', 'Gray', 'Set of 12', 120000, 6], ['PETG', 'Gray', 'Set of 12', 145000, null]],
    dims: 'Grid-based, 25 mm tiles', days: [4, 6] },
  { id: 4, slug: 'custom-pet-figurine', name: 'Custom Pet Figurine', cat: 1, type: 'made_to_order',
    short: 'Send us your pet’s photo and get a hand-finished figurine.',
    desc: ['We sculpt your pet from photos and print it in high-detail resin. Include a name for the base plate.', 'Every piece is made to order, so allow a little extra time.'],
    variants: [['Resin', 'Natural', 'Small', 150000, null], ['Resin', 'Natural', 'Medium', 220000, null]],
    schema: [image('photo', 'Photo of your pet', true), text('pet_name', 'Name on the base', 14, false, 3000)],
    dims: '60–100 mm tall', days: [5, 9] },

  { id: 5, slug: 'custom-name-keychain', name: 'Custom Name Keychain', cat: 2, type: 'customizable', featured: 1,
    short: 'Your name, printed in bold raised letters on a sturdy keychain.',
    desc: ['Type the name you want and pick a colour. We print it and ship it, usually within 2–4 days.', 'Add your own logo for a small extra charge.'],
    variants: [['PLA', 'Black', 'Small', 25000, 14, 35000], ['PLA', 'Orange', 'Small', 25000, 30, 35000], ['PETG', 'White', 'Small', 28000, 11], ['PLA', 'Cyan', 'Large', 40000, 7]],
    schema: [text('name_text', 'Name on keychain', 12, true), image('logo', 'Logo for engraving', false, 5000)],
    dims: '50 × 20 × 4 mm', days: [2, 4] },
  { id: 6, slug: 'initial-letter-keychain', name: 'Initial Letter Keychain', cat: 2, type: 'customizable', featured: 6,
    short: 'One bold letter. Zero fuss.',
    desc: ['A chunky single-letter keychain — a quick, personal gift.'],
    variants: [['PLA', 'Black', null, 18000, 40], ['PLA', 'Orange', null, 18000, 22], ['PLA', 'Purple', null, 20000, 10]],
    schema: [text('initial', 'Letter', 1, true)],
    dims: '35 × 35 × 5 mm', days: [1, 3] },
  { id: 7, slug: 'mini-gamepad-keychain', name: 'Mini Gamepad Keychain', cat: 2, type: 'standard',
    short: 'A pocket-sized retro controller for your keys.',
    desc: ['Printed in two colours with tiny raised buttons.'],
    variants: [['PLA', 'Black', null, 15000, 50], ['PLA', 'Red', null, 15000, 25]],
    dims: '45 × 25 × 6 mm', days: [1, 2] },
  { id: 8, slug: 'couple-heart-keychain-set', name: 'Couple Heart Keychain Set', cat: 2, type: 'standard',
    short: 'Two halves of a heart, one for each of you.',
    desc: ['Matching keychains that click together. Currently sold out — restock coming soon.'],
    variants: [['PLA', 'Red', 'Set of 2', 38000, 0, 45000], ['PLA', 'Black', 'Set of 2', 38000, 0, 45000]],
    dims: '40 × 40 × 5 mm each', days: [2, 3] },

  { id: 9, slug: 'nfc-business-card-keychain', name: 'NFC Business Card Keychain', cat: 3, type: 'customizable', featured: 2, isNew: true,
    short: 'Tap it on any phone and your profile opens instantly.',
    desc: ['A keychain with a built-in NFC chip. We program it with the link you give us — your Facebook page, portfolio, menu or WhatsApp.', 'Works with every modern Android and iPhone, no app needed.'],
    variants: [['PLA', 'Black', null, 55000, 18], ['PLA', 'White', null, 55000, 9], ['PETG', 'Orange', null, 60000, 4]],
    schema: [url('nfc_url', 'Link for NFC chip')],
    dims: '55 × 35 × 4 mm', days: [2, 4] },
  { id: 10, slug: 'round-nfc-tag-keychain', name: 'Round NFC Tag Keychain', cat: 3, type: 'customizable', featured: 11,
    short: 'A compact round tag that shares your link with a tap.',
    desc: ['Small, light and tough. Program it with any link we can encode.'],
    variants: [['PLA', 'Black', null, 42000, 25], ['PLA', 'Cyan', null, 42000, 16]],
    schema: [url('nfc_url', 'Link for NFC chip')],
    dims: '35 mm diameter, 4 mm thick', days: [2, 4] },
  { id: 11, slug: 'nfc-review-stand', name: 'NFC Review Stand', cat: 3, type: 'customizable',
    short: 'A counter stand that sends customers straight to your review page.',
    desc: ['Perfect for shops and cafés — customers tap the stand to leave a review.'],
    variants: [['PLA', 'Black', null, 85000, 12], ['PLA', 'White', null, 85000, 6]],
    schema: [url('nfc_url', 'Review page link')],
    dims: '90 × 60 × 70 mm', days: [3, 5] },

  { id: 12, slug: 'tri-fidget-spinner', name: 'Tri Fidget Spinner', cat: 4, type: 'standard', featured: 4,
    short: 'A smooth, quiet spinner with a satisfying long spin.',
    desc: ['Printed with a precision bearing seat. Fits comfortably in a pocket.'],
    variants: [['PLA', 'Orange', null, 28000, 35], ['PLA', 'Cyan', null, 28000, 20], ['PLA', 'Purple', null, 30000, 12]],
    dims: '75 × 75 × 12 mm', days: [1, 3] },
  { id: 13, slug: 'infinity-cube', name: 'Infinity Cube', cat: 4, type: 'standard', featured: 8,
    short: 'Fold it, flip it, never reach the end.',
    desc: ['A print-in-place cube made of eight linked blocks — oddly calming.'],
    variants: [['PLA', 'Black', null, 35000, 22, 42000], ['PLA', 'White', null, 35000, 14, 42000]],
    dims: '45 × 45 × 45 mm', days: [2, 3] },
  { id: 14, slug: 'articulated-flexi-dragon', name: 'Articulated Flexi Dragon', cat: 4, type: 'standard', isNew: true,
    short: 'A bendy dragon with over 60 moving joints.',
    desc: ['Printed in one piece, fully articulated. The bigger the dragon, the more it wiggles.'],
    variants: [['PLA', 'Purple', 'Small', 48000, 15], ['PLA', 'Orange', 'Medium', 68000, 9], ['PLA', 'Cyan', 'Large', 98000, 3]],
    dims: '150–400 mm long', days: [2, 4] },
  { id: 15, slug: 'click-slider-fidget', name: 'Click Slider Fidget', cat: 4, type: 'standard',
    short: 'Slide, click, repeat.',
    desc: ['A magnetic-feel slider with a crisp tactile click.'],
    variants: [['PLA', 'Black', null, 22000, 40], ['PLA', 'Orange', null, 22000, 28]],
    dims: '60 × 30 × 15 mm', days: [1, 3] },

  { id: 16, slug: 'custom-name-desk-plate', name: 'Custom Name Desk Plate', cat: 5, type: 'customizable', featured: 5,
    short: 'A neat desk plate with your name and a short tagline.',
    desc: ['A great gift for a new job or a new desk. Pick the colour and enter the text.'],
    variants: [['PLA', 'Black', 'Small', 65000, 10], ['PLA', 'White', 'Small', 65000, 8], ['PETG', 'Orange', 'Large', 95000, null]],
    schema: [text('name_text', 'Name', 20, true), text('tagline', 'Tagline', 30, false)],
    dims: '150 × 40 × 30 mm', days: [3, 5] },
  { id: 17, slug: 'photo-lithophane-lamp', name: 'Photo Lithophane Lamp', cat: 5, type: 'made_to_order', featured: 9, isNew: true,
    short: 'Your favourite photo, glowing in 3D light.',
    desc: ['A lithophane turns your photo into a layered print that comes alive when lit from behind. Includes a warm LED base.'],
    variants: [['PLA', 'White', 'Medium', 180000, null]],
    schema: [image('photo', 'Your photo', true), text('caption', 'Caption', 24, false, 5000)],
    dims: '150 × 150 × 90 mm', days: [5, 8] },
  { id: 18, slug: 'foldable-phone-stand', name: 'Foldable Phone Stand', cat: 5, type: 'standard',
    short: 'Folds flat, fits in a wallet.',
    desc: ['A sturdy two-part stand for any phone up to 7 inches.'],
    variants: [['PLA', 'Black', null, 24000, 30], ['PLA', 'Orange', null, 24000, 18], ['PLA', 'White', null, 26000, 12]],
    dims: '80 × 60 × 8 mm folded', days: [1, 2] },
  { id: 19, slug: 'geometric-planter', name: 'Geometric Planter', cat: 5, type: 'standard',
    short: 'A faceted planter for small succulents.',
    desc: ['Drain-hole included. Printed with a matte finish.'],
    variants: [['PLA', 'White', null, 32000, 16, 38000], ['PLA', 'Green', null, 32000, 9, 38000]],
    dims: '90 × 90 × 80 mm', days: [2, 4] },

  { id: 20, slug: 'servo-bracket-set', name: 'Servo Bracket Set', cat: 6, type: 'standard', featured: 10,
    short: 'Four sturdy brackets for SG90 and MG90 servos.',
    desc: ['Designed for robot arms and pan-tilt rigs. Printed in tough PETG.'],
    variants: [['PETG', 'Black', 'Set of 4', 48000, 20], ['PETG', 'Gray', 'Set of 4', 48000, 15]],
    dims: '40 × 25 × 20 mm each', days: [2, 4] },
  { id: 21, slug: 'arduino-uno-case', name: 'Arduino Uno Case', cat: 6, type: 'standard',
    short: 'A snug case with cable cut-outs and vents.',
    desc: ['Protects your board on the bench or in a project box.'],
    variants: [['PLA', 'Black', null, 38000, 25], ['PETG', 'Cyan', null, 42000, 10]],
    dims: '75 × 58 × 25 mm', days: [2, 3] },
  { id: 22, slug: 'custom-gear-set', name: 'Custom Gear Set', cat: 6, type: 'made_to_order',
    short: 'Gears printed to your tooth count and module.',
    desc: ['Tell us the specs and we will print a matching set. For complex parts, use the custom order form for a quote.'],
    variants: [['PETG', 'Gray', null, 90000, null]],
    dims: 'Made to spec', days: [4, 7] },

  { id: 23, slug: 'laser-engraved-wooden-keychain', name: 'Laser Engraved Wooden Keychain', cat: 7, type: 'customizable', featured: 12,
    short: 'Your logo or drawing, engraved on real wood.',
    desc: ['Upload a simple black-and-white design and we engrave it with our laser. Add a name below the design if you like.'],
    variants: [['Wood', 'Natural', 'Small', 20000, 60], ['Wood', 'Dark', 'Small', 22000, 40]],
    schema: [image('logo', 'Design to engrave', true), text('name_text', 'Name (optional)', 14, false)],
    dims: '60 × 30 × 3 mm', days: [2, 4] },
  { id: 24, slug: 'engraved-acrylic-name-plate', name: 'Engraved Acrylic Name Plate', cat: 7, type: 'customizable',
    short: 'A crisp acrylic plate with your name engraved.',
    desc: ['Clean and modern — perfect for doors, desks and gifts.'],
    variants: [['Acrylic', 'Clear', 'Small', 45000, 15], ['Acrylic', 'Black', 'Small', 52000, 11]],
    schema: [text('name_text', 'Name', 18, true)],
    dims: '120 × 30 × 3 mm', days: [2, 4] },
]

export const NEW_PRODUCT_IDS = new Set(PRODUCT_DEFS.filter(p => p.isNew).map(p => p.id))

const img = (kind: string, hue: number, v: number, alt: string): ApiImage =>
  ({ url: `/mock-api/img/${kind}?h=${hue}&v=${v}`, alt, width: 800, height: 800 })

const catById = (id: number) => CATEGORY_DEFS.find(c => c.id === id)!

function buildVariants(def: ProductDef): ProductVariant[] {
  const prefix = def.slug.split('-').map(w => w[0]).join('').toUpperCase()
  return def.variants.map(([material, color, size, price, stock, compare], i) => ({
    id: def.id * 10 + i + 1,
    sku: `${prefix}-${material.slice(0, 3).toUpperCase()}-${color.slice(0, 3).toUpperCase()}-${i + 1}`,
    name: [material, color, size].filter(Boolean).join(' / '),
    material,
    color,
    color_hex: COLORS[color] ?? null,
    size,
    price,
    compare_at_price: compare ?? null,
    in_stock: stock === null || stock > 0,
    stock,
    is_default: i === 0,
  }))
}

export function buildCard(def: ProductDef): ProductCard {
  const cat = catById(def.cat)
  const variants = buildVariants(def)
  const base = variants.find(v => v.is_default)!
  const prices = variants.map(v => v.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const isCustomizable = (def.schema?.length ?? 0) > 0
  const badges: ProductBadge[] = []
  if (def.isNew) badges.push('new')
  if (isCustomizable) badges.push('customizable')
  if (base.compare_at_price && base.compare_at_price > base.price) badges.push('sale')
  return {
    id: def.id,
    slug: def.slug,
    name: def.name,
    category: { slug: cat.slug, name: cat.name },
    price: base.price,
    compare_at_price: base.compare_at_price,
    price_range: min === max ? null : { min, max },
    thumbnail: img(cat.kind, cat.hue + (def.id % 5) * 6, 0, def.name),
    hover_image: img(cat.kind, cat.hue + (def.id % 5) * 6, 1, `${def.name} — alternate view`),
    badges,
    is_customizable: isCustomizable,
    in_stock: variants.some(v => v.in_stock),
  }
}

export function buildDetail(def: ProductDef): ProductDetail {
  const cat = catById(def.cat)
  const hue = cat.hue + (def.id % 5) * 6
  const related = PRODUCT_DEFS.filter(p => p.cat === def.cat && p.id !== def.id).slice(0, 4)
  // top up from other categories so the grid is never empty
  if (related.length < 4) {
    related.push(...PRODUCT_DEFS.filter(p => p.cat !== def.cat && p.featured).slice(0, 4 - related.length))
  }
  return {
    ...buildCard(def),
    short_description: def.short,
    description_html: def.desc.map(p => `<p>${p}</p>`).join(''),
    images: [0, 1, 2, 3].map(v => img(cat.kind, hue, v, `${def.name} — view ${v + 1}`)),
    model_3d_url: null,
    variants: buildVariants(def),
    customization_schema: def.schema ?? [],
    dimensions: def.dims ?? null,
    production_days: { min: def.days[0], max: def.days[1] },
    related: related.map(buildCard),
    seo: { title: `${def.name} | Byte3D`, description: def.short },
  }
}

export function buildCategory(def: CategoryDef): Category {
  return {
    id: def.id,
    slug: def.slug,
    name: def.name,
    description: def.description,
    image: img(def.kind, def.hue, 2, def.name),
    product_count: PRODUCT_DEFS.filter(p => p.cat === def.id).length,
  }
}

export const allProductDefs = () => PRODUCT_DEFS
export const findProductDef = (slug: string) => PRODUCT_DEFS.find(p => p.slug === slug)
export const defaultVariantOf = (def: ProductDef) => buildVariants(def).find(v => v.is_default)!
export const variantsOf = buildVariants
export type { ProductDef }

export const HERO = {
  headline: 'We bring your ideas to life',
  subheadline: 'Custom 3D printing, personalized gifts, prototypes and unique 3D products.',
  primary_cta: { label: 'Shop Now', href: '/shop' },
  secondary_cta: { label: 'Custom Order', href: '/custom-order' },
}

export const SETTINGS = {
  site_name: 'Byte3D',
  contact: { phone: '+880 1812-209019', email: 'hello@byte3d.store' },
  socials: { facebook: 'https://facebook.com/Byte3D', instagram: null, tiktok: null },
  shipping: { inside_dhaka: 7000, outside_dhaka: 13000 },
  payment_methods: ['cod'],
}
