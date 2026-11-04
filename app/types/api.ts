// Mirrors the API contract in ../../CLAUDE.md exactly. Money is integer paisa.

export interface ApiImage {
  url: string
  alt: string
  width: number
  height: number
}

export interface Category {
  id: number
  slug: string
  name: string
  description: string
  image: ApiImage
  product_count: number
}

export type ProductBadge = 'new' | 'customizable' | 'sale'

export interface ProductCard {
  id: number
  slug: string
  name: string
  category: { slug: string, name: string }
  price: number
  compare_at_price: number | null
  price_range: { min: number, max: number } | null
  thumbnail: ApiImage
  hover_image: ApiImage | null
  badges: ProductBadge[]
  is_customizable: boolean
  in_stock: boolean
}

export interface ProductVariant {
  id: number
  sku: string
  name: string
  material: string | null
  color: string | null
  color_hex: string | null
  size: string | null
  price: number
  compare_at_price: number | null
  in_stock: boolean
  /** `null` = made-to-order (always available) */
  stock: number | null
  is_default: boolean
}

export interface CustomizationField {
  key: string
  type: 'text' | 'image' | 'url'
  label: string
  max?: number
  required: boolean
  extra_price: number
}

export interface ProductDetail extends ProductCard {
  short_description: string
  description_html: string
  images: ApiImage[]
  model_3d_url: string | null
  variants: ProductVariant[]
  customization_schema: CustomizationField[]
  dimensions: string | null
  production_days: { min: number, max: number } | null
  related: ProductCard[]
  seo: { title: string, description: string }
}

export interface Cta {
  label: string
  href: string
}

export interface HomeData {
  hero: {
    headline: string
    subheadline: string
    primary_cta: Cta
    secondary_cta: Cta
  }
  categories: Category[]
  featured_products: ProductCard[]
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface Paginated<T> {
  data: T[]
  links: { first: string | null, last: string | null, prev: string | null, next: string | null }
  meta: PaginationMeta
}

export interface ProductFilters {
  categories: { slug: string, name: string, count: number }[]
  materials: { value: string, count: number }[]
  colors: { name: string, hex: string, count: number }[]
  price: { min: number, max: number }
}

export interface PublicSettings {
  site_name: string
  contact: { phone: string, email: string }
  socials: { facebook: string | null, instagram: string | null, tiktok: string | null }
  shipping: { inside_dhaka: number, outside_dhaka: number }
  payment_methods: string[]
}

export interface ApiErrorBody {
  message: string
  errors?: Record<string, string[]>
}

export type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'popular'

/** Query params for GET /products (also the shop page URL query). */
export interface ProductQuery {
  category?: string
  q?: string
  min_price?: string
  max_price?: string
  material?: string
  color?: string
  in_stock?: string
  customizable?: string
  featured?: string
  sort?: SortKey
  page?: string
  per_page?: string
}

// ---------------------------------------------------------------------------
// Phase 3: cart, checkout, orders, customer account. See backend/CLAUDE.md
// ("Phase 3 API details") for the parts the root contract does not spell out.
// ---------------------------------------------------------------------------

export type ShippingZone = 'inside_dhaka' | 'outside_dhaka'
export type PaymentMethod = 'cod' | 'sslcommerz' | 'bkash'

export type CartMessageType
  = | 'unavailable'
    | 'out_of_stock'
    | 'insufficient_stock'
    | 'invalid_customization'
    | 'price_changed'
    | 'invalid_coupon'

export interface CartMessage {
  type: CartMessageType
  message: string
  variant_id?: number
  field?: string
}

/** One cart line as priced by the server. */
export interface PricedLine {
  variant_id: number
  product: { slug: string, name: string } | null
  variant_name: string | null
  sku: string | null
  thumbnail: ApiImage | null
  quantity: number
  unit_price: number
  line_total: number
  available: boolean
  /** `null` = made-to-order */
  stock: number | null
  customization: Record<string, string>
}

/** Response of POST /cart/validate (`data`). */
export interface PricedCart {
  lines: PricedLine[]
  subtotal: number
  discount: number
  shipping_fee: number
  total: number
  shipping_zone: ShippingZone | null
  coupon: { code: string, discount: number } | null
  messages: CartMessage[]
}

export interface CartItemPayload {
  variant_id: number
  quantity: number
  customization: Record<string, string>
  /** Only used by the server to say "the price changed"; it never prices anything. */
  unit_price?: number
}

export interface CheckoutPayload {
  customer: { name: string, phone: string, email?: string }
  address: { district: string, area: string, address_line: string }
  shipping_zone: ShippingZone
  payment_method: PaymentMethod
  items: CartItemPayload[]
  coupon?: string
  note?: string
}

export interface CheckoutResult {
  order_number: string
  total: number
  payment: { method: PaymentMethod, redirect_url: string | null }
}

export type OrderStatus
  = | 'pending'
    | 'confirmed'
    | 'in_production'
    | 'ready_to_ship'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'returned'

export interface Order {
  order_number: string
  status: OrderStatus
  status_label: string
  payment_method: PaymentMethod
  payment_status: 'unpaid' | 'paid' | 'failed' | 'refunded'
  shipping_zone: ShippingZone
  placed_at: string
  items: {
    product_name: string
    variant_name: string
    quantity: number
    unit_price: number
    line_total: number
    customization: Record<string, string>
  }[]
  subtotal: number
  discount: number
  shipping_fee: number
  total: number
  timeline: { status: OrderStatus, label: string, at: string }[]
}

export interface AccountUser {
  id: number
  name: string
  phone: string | null
  email: string | null
}

/** `POST /uploads/customization` → the token is the value of an `image` customization field. */
export interface CustomizationUpload {
  upload_token: string
  name: string
  size: number
  expires_at: string
}
