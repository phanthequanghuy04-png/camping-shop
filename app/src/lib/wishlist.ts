/* Lucian UX/UI Prompt #441 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#441
   Danh sách yêu thích (nút tim trên thẻ sản phẩm) — lưu localStorage,
   đồng bộ giữa các tab qua sự kiện 'storage' + 'camping-wishlist-changed'. */

export const WISHLIST_STORAGE_KEY = 'camping-wishlist'

export function loadWishlist(): number[] {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY)
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
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids))
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
