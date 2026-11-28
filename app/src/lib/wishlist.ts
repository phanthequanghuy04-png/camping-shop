/* Lucian UX/UI Prompt #441 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#441
   Danh sách yêu thích (nút tim trên thẻ sản phẩm) — lưu localStorage,
   đồng bộ giữa các tab qua sự kiện 'storage' + 'camping-wishlist-changed'. */

import { getSessionUser } from '../data/users'

export const WISHLIST_STORAGE_KEY = 'camping-wishlist'

/**
 * Key yêu thích theo tài khoản ('camping-wishlist-<userId>'); khách vãng
 * lai dùng key chung 'camping-wishlist'. Đăng xuất thì clearSession()
 * (data/users.ts) dọn key chung, nên sau đăng xuất không còn tim của
 * tài khoản cũ; đăng nhập lại thì tim riêng của tài khoản đó vẫn còn.
 */
function wishlistKey(): string {
  const userId = getSessionUser()?.id
  return userId ? `${WISHLIST_STORAGE_KEY}-${userId}` : WISHLIST_STORAGE_KEY
}

export function loadWishlist(): number[] {
  try {
    const raw = localStorage.getItem(wishlistKey())
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (id): id is number => typeof id === 'number' && Number.isInteger(id),
    )
  } catch {
    return []
  }
}

function saveWishlist(ids: number[]): void {
  try {
    localStorage.setItem(wishlistKey(), JSON.stringify(ids))
  } catch {
    // localStorage đầy / bị chặn: trạng thái tim vẫn giữ trong phiên.
  }
  window.dispatchEvent(
    new CustomEvent('camping-wishlist-changed', { detail: ids }),
  )
}

export function isWishlisted(productId: number): boolean {
  return loadWishlist().includes(productId)
}

/** Bật/tắt yêu thích, trả về trạng thái mới (true = đã thêm vào yêu thích). */
export function toggleWishlist(productId: number): boolean {
  const ids = loadWishlist()
  const next = ids.includes(productId)
    ? ids.filter((id) => id !== productId)
    : [...ids, productId]
  saveWishlist(next)
  return next.includes(productId)
}
