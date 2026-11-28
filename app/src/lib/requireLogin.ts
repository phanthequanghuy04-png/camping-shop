import type { NavigateFunction } from 'react-router-dom'
import { getSessionUser } from '../data/users'
import { showToast } from './toast'

/**
 * Chặn hành động cần đăng nhập (thêm vào giỏ, mua ngay, yêu thích,
 * thanh toán): khách vãng lai thấy toast rồi được chuyển sang /login,
 * kèm trang hiện tại để đăng nhập xong quay lại đúng chỗ.
 * Trả về true khi đã đăng nhập (cho phép làm tiếp), false khi chưa.
 */
export function requireLogin(
  navigate: NavigateFunction,
  action: string,
): boolean {
  if (getSessionUser()) return true
  showToast(`Bạn cần đăng nhập để ${action}.`)
  const from = `${window.location.pathname}${window.location.search}`
  navigate('/login', { state: { from } })
  return false
}

/**
 * Chỉ nhận đường dẫn nội bộ an toàn cho "quay lại sau khi đăng nhập"
 * (tránh đường dẫn lạ từ state). Không hợp lệ thì dùng fallback.
 */
export function safeReturnTo(value: unknown, fallback: string): string {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//')
    ? value
    : fallback
}
