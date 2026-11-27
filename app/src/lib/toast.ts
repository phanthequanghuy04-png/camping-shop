/**
 * Thông báo ngắn (toast) — vd "Đăng nhập thành công!".
 *
 * Cách dùng: gọi `showToast('...')` ở bất cứ đâu (vd LoginPage sau khi
 * đăng nhập xong). AppContent (App.tsx) lắng nghe sự kiện
 * 'camping-toast' và hiện thông báo nổi phía trên trang trong vài giây
 * rồi tự mờ đi. Dùng sự kiện window thay vì context để LoginPage không
 * cần biết App render toast như thế nào.
 */
export function showToast(message: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('camping-toast', { detail: message }))
}
