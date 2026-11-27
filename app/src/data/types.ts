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
