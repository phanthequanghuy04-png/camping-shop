/**
 * TypeScript types khớp với DB MySQL trong camping.sql
 * (bảng categories, products, users, orders, order_items, cart_items).
 *
 * Quy ước kiểu:
 * - DECIMAL trong DB -> number ở frontend.
 * - TIMESTAMP trong DB -> string (ISO) ở frontend.
 * - Cột NULL được -> `... | null`.
 * - products.status là TINYINT(1): 1 = đang bán, 0 = ẩn/ngừng bán.
 * - users.role chỉ nhận 'user' | 'admin' (CHECK trong DB).
 * - orders.status chỉ nhận 'pending' | 'paid' | 'shipped' | 'done' | 'cancelled'.
 *
 * Lưu ý: User KHÔNG chứa password_hash — cột này chỉ tồn tại ở
 * phía server/DB, không bao giờ trả về frontend.
 */

export interface Category {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  image: string | null
  price: number
  quantity: number
  /** 1 = đang bán, 0 = ẩn/ngừng bán (TINYINT(1) trong DB) */
  status: number
  id_category: number | null
  description: string | null
  rating: number
  created_at: string
}

export type UserRole = 'user' | 'admin'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: UserRole
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'done'
  | 'cancelled'

export interface Order {
  id: number
  user_id: number | null
  total: number
  status: OrderStatus
  address: string | null
  phone: string | null
  customer_name: string | null
  created_at: string
  /** Tạm tính trước giảm giá (server tính khi tạo đơn). */
  subtotal?: number
  /** Số tiền đã giảm theo mã (vd CAMP10). */
  discount_amount?: number
  coupon_code?: string | null
  /** Phí vận chuyển (0 = miễn phí). */
  shipping_fee?: number
  shipping_method?: string
  /** Khu vực giao: 'hanoi' | 'hcm' | 'other'. */
  shipping_region?: string | null
  /** Cách thanh toán: 'cod' | 'bank_transfer'. */
  payment_method?: 'cod' | 'bank_transfer'
  /** 'unpaid' (chưa thanh toán) | 'paid' (đã thanh toán/đã nhận tiền). */
  payment_status?: 'unpaid' | 'paid'
  /** Mã vận đơn do admin nhập khi giao hàng. */
  tracking_code?: string | null
  /** Ngày giao dự kiến (yyyy-mm-dd). */
  estimated_delivery?: string | null
}

/** Chi tiết một dòng trong đơn hàng (bảng order_items). */
export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  price: number
}

/** Mục trong giỏ hàng phía client (chưa đồng bộ DB). */
export interface CartItem {
  productId: number
  quantity: number
}
