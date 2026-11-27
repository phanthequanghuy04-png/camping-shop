/**
 * Client gọi API backend Camping Shop (server/ — Node + Express, cổng 3001).
 *
 * NGUYÊN TẮC FALLBACK (ghi rõ): mọi hàm ở đây đều ném lỗi khi API không
 * chạy được / fetch lỗi; nơi gọi (CartContext, các page) PHẢI bắt lỗi và
 * dùng dữ liệu local (products.ts / localStorage) như trước. App không
 * bao giờ vỡ chỉ vì backend chưa chạy — xem `isApiAvailable()`.
 *
 * - Base URL: `import.meta.env.VITE_API_URL`, mặc định http://localhost:3001.
 * - Ảnh: DB chỉ lưu tên file (vd 'leu-trai-2-nguoi.jpg'); `withLocalImage()`
 *   thay bằng URL ảnh trong products.ts theo id để ProductCard hiển thị
 *   đúng (luồng ảnh đang làm trong products.ts — file đó KHÔNG bị sửa).
 * - Token JWT lưu ở localStorage key 'camping-token' (xem README server:
 *   JWT còn đơn giản, chưa có httpOnly cookie / refresh token).
 * - Khách vãng lai dùng `session_id` bền vững lưu ở localStorage key
 *   'camping-session-id' (giỏ hàng + đặt hàng không cần đăng nhập).
 */
import { PRODUCTS } from '../data/products'
import { saveSession } from '../data/users'
import type { CartItem, Category, Order, Product, User } from '../data/types'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const API_TOKEN_KEY = 'camping-token'
export const API_SESSION_ID_KEY = 'camping-session-id'

/** Lỗi từ API: giữ nguyên message tiếng Việt server trả về. */
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Bỏ dấu tiếng Việt để tìm kiếm/so khớp phía client (khớp server). */
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

// ---------------------------------------------------------------------------
// Trạng thái khả dụng của API (probe /api/health, cache kết quả)
// ---------------------------------------------------------------------------

let cachedAvailable: boolean | null = null
let cachedMode: string | null = null

/** true khi backend trả lời /api/health trong 2s. Kết quả được cache. */
export async function isApiAvailable(): Promise<boolean> {
  if (cachedAvailable !== null) return cachedAvailable
  try {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 2000)
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal,
    })
    window.clearTimeout(timer)
    if (!res.ok) throw new Error(`health ${res.status}`)
    const json = (await res.json()) as { mode?: string }
    cachedMode = json.mode ?? null
    cachedAvailable = true
  } catch {
    cachedAvailable = false
  }
  return cachedAvailable
}

/** 'mysql' | 'fallback' | null — chế độ server đang chạy (sau khi probe). */
export function getApiMode(): string | null {
  return cachedMode
}

// ---------------------------------------------------------------------------
// Token + session khách vãng lai
// ---------------------------------------------------------------------------

export function getToken(): string | null {
  try {
    return localStorage.getItem(API_TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveToken(token: string): void {
  try {
    localStorage.setItem(API_TOKEN_KEY, token)
  } catch {
    // Bỏ qua: phiên chỉ mất khi tải lại trang.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(API_TOKEN_KEY)
  } catch {
    // Bỏ qua.
  }
}

/** session_id bền vững cho khách vãng lai (tạo 1 lần, dùng cho giỏ/đơn). */
export function getSessionId(): string {
  try {
    let id = localStorage.getItem(API_SESSION_ID_KEY)
    if (!id) {
      id = `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(API_SESSION_ID_KEY, id)
    }
    return id
  } catch {
    return `guest-${Date.now().toString(36)}`
  }
}

// ---------------------------------------------------------------------------
// Fetch nền
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    // Backend chưa chạy / mất mạng: nơi gọi sẽ fallback về local.
    cachedAvailable = false
    throw new ApiError(0, 'Không kết nối được tới API (backend chưa chạy?).')
  }
  let json: unknown = null
  try {
    json = await res.json()
  } catch {
    // Body không phải JSON.
  }
  if (!res.ok) {
    const message =
      (json as { error?: string } | null)?.error ??
      `API lỗi (HTTP ${res.status}).`
    throw new ApiError(res.status, message)
  }
  return (json as { data: T }).data
}

// ---------------------------------------------------------------------------
// Sản phẩm / danh mục
// ---------------------------------------------------------------------------

const localImageById = new Map(PRODUCTS.map((p) => [p.id, p.image]))

/** Thay ảnh tên-file từ DB bằng URL ảnh local (products.ts) theo id. */
export function withLocalImage(product: Product): Product {
  const localImage = localImageById.get(product.id)
  return localImage ? { ...product, image: localImage } : product
}

export interface ProductQuery {
  q?: string
  category?: number | string
  sort?: 'price_asc' | 'price_desc'
}

export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/api/categories')
}

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  if (query.category !== undefined && query.category !== '')
    params.set('category', String(query.category))
  if (query.sort) params.set('sort', query.sort)
  const qs = params.toString()
  const list = await apiFetch<Product[]>(`/api/products${qs ? `?${qs}` : ''}`)
  return list.map(withLocalImage)
}

export async function getProduct(id: number): Promise<Product> {
  return withLocalImage(await apiFetch<Product>(`/api/products/${id}`))
}

// ---------------------------------------------------------------------------
// Auth — thử API trước, fallback demo/local do page tự lo khi ném ApiError
// ---------------------------------------------------------------------------

export interface AuthResult {
  user: User
  token: string
}

/** Đăng nhập qua API; đồng thời lưu token + session (camping-session). */
export async function loginApi(
  email: string,
  password: string,
): Promise<{ user: User; token: string; demo: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).catch(() => {
    cachedAvailable = false
    throw new ApiError(0, 'Không kết nối được tới API (backend chưa chạy?).')
  })
  const json = (await res.json().catch(() => null)) as {
    data?: AuthResult
    demo?: boolean
    error?: string
  } | null
  if (!res.ok || !json?.data) {
    throw new ApiError(res.status, json?.error ?? `Đăng nhập lỗi (HTTP ${res.status}).`)
  }
  saveToken(json.data.token)
  saveSession(json.data.user)
  return { ...json.data, demo: json.demo ?? false }
}

/** Đăng ký qua API (mật khẩu được hash bcrypt thật phía server). */
export async function registerApi(input: {
  name: string
  email: string
  phone: string | null
  password: string
}): Promise<AuthResult> {
  const data = await apiFetch<AuthResult>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  saveToken(data.token)
  saveSession(data.user)
  return data
}

// ---------------------------------------------------------------------------
// Giỏ hàng (server) — CartContext đồng bộ best-effort, localStorage là gốc
// ---------------------------------------------------------------------------

export interface ApiCartItem {
  id: number
  user_id: number | null
  session_id: string | null
  product_id: number
  quantity: number
  product: Product | null
}

function cartOwnerParams(userId: number | null): string {
  return userId
    ? `user_id=${userId}`
    : `session_id=${encodeURIComponent(getSessionId())}`
}

export async function getCartApi(
  userId: number | null,
): Promise<ApiCartItem[]> {
  const items = await apiFetch<ApiCartItem[]>(
    `/api/cart?${cartOwnerParams(userId)}`,
  )
  return items.map((item) => ({
    ...item,
    product: item.product ? withLocalImage(item.product) : null,
  }))
}

export async function addToCartApi(
  userId: number | null,
  productId: number,
  quantity: number,
): Promise<ApiCartItem> {
  const body = userId
    ? { user_id: userId, product_id: productId, quantity }
    : { session_id: getSessionId(), product_id: productId, quantity }
  return apiFetch<ApiCartItem>('/api/cart', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** Ghi đè toàn bộ giỏ server bằng giỏ local (gọi debounce từ CartContext). */
export async function syncCartApi(
  userId: number | null,
  items: CartItem[],
): Promise<ApiCartItem[]> {
  const body = userId
    ? { user_id: userId, items }
    : { session_id: getSessionId(), items }
  return apiFetch<ApiCartItem[]>('/api/cart/sync', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// Đơn hàng / admin
// ---------------------------------------------------------------------------

export interface CreateOrderInput {
  user_id?: number | null
  customer_name: string
  phone: string
  address: string
  items: CartItem[]
}

export interface CreatedOrder extends Order {
  items: { id: number; order_id: number; product_id: number; quantity: number; price: number }[]
}

/** Tạo đơn qua API (trừ tồn kho + xóa giỏ phía server). */
export async function createOrderApi(
  input: CreateOrderInput,
): Promise<CreatedOrder> {
  return apiFetch<CreatedOrder>('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      session_id: input.user_id ? undefined : getSessionId(),
    }),
  })
}

/** Đơn hàng cho trang Admin — cần token của tài khoản role=admin. */
export async function getAdminOrdersApi(): Promise<CreatedOrder[]> {
  return apiFetch<CreatedOrder[]>('/api/admin/orders')
}
