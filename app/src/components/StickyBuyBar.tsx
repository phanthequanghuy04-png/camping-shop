// Lucian UX/UI Prompt #221 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#221
/**
 * Sticky buy bar with option sheet — port sang React cho Camping Shop.
 *
 * Hành vi giữ theo gốc:
 * - Thanh mua cố định đáy trang (ảnh nhỏ + tên + giá + nút "Mua ngay") chỉ
 *   hiện khi hộp mua chính của trang (#buy-box) đã cuộn khỏi màn hình —
 *   theo dõi bằng IntersectionObserver; cuộn ngược lên thì thanh trượt
 *   xuống biến mất (.45s cubic-bezier(.3,1.2,.5,1) như gốc).
 * - Bấm "Mua ngay" trên thanh thì thanh kéo dài lên thành sheet chọn lựa
 *   chọn; bấm X, bấm nền mờ hoặc Esc thì đóng; focus vào nút đóng khi mở,
 *   đóng thì trả focus về nút "Mua ngay" trên thanh.
 * - Sau khi thêm xong, nút đổi thành tick "Đã thêm" rồi sheet gập lại
 *   thành thanh (1100ms, 600ms khi giảm chuyển động; reset sau 450ms).
 *
 * THÍCH ỨNG so với gốc (sản phẩm shop KHÔNG có biến thể size/màu):
 * - Lưới chọn size của gốc thay bằng bộ chọn số lượng (− / số / +, tối
 *   thiểu 1, tối đa = product.quantity) + tổng tiền (giá × số lượng).
 * - Nút "Thêm vào giỏ" luôn bật (không chờ chọn size như gốc); sheet có
 *   2 nút: "Thêm vào giỏ" (xanh rừng #2D6A4F) và "Mua ngay" (cam #C05621,
 *   đúng 2 nút trên trang chi tiết).
 * - Khung demo 300×480px của gốc bỏ đi: thanh là fixed bottom full-width,
 *   nội dung căn giữa max-width 1200px như trang; nền mờ phủ toàn màn hình.
 * - Khi sheet mở thì khóa cuộn trang; khi thanh ẩn thì visibility:hidden
 *   (kèm delay) để nút trong thanh không tab tới được lúc đang trượt xuống.
 * - z-index: thanh 60, nền mờ 55 — trên header (50), dưới ngăn giỏ #240
 *   (70) và panel chat #450 (65) để mở giỏ/chat vẫn phủ được thanh.
 *
 * Tích hợp: trang chi tiết gắn id="buy-box" cho khối mua chính (số lượng
 * + 2 nút mua); component này tự observe nó. CSS ở _staging/u221.css —
 * người tích hợp append vào lucian.css (component này KHÔNG import CSS).
 * Toàn bộ chữ tiếng Việt.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatPrice, resolveImage } from '../data/products'
import type { Product } from '../data/types'

export interface StickyBuyBarProps {
  product: Product
  onAddToCart: (qty: number) => void
  onBuyNow: (qty: number) => void
}

export default function StickyBuyBar({
  product,
  onAddToCart,
  onBuyNow,
}: StickyBuyBarProps) {
  // Hết hàng khi tồn kho = 0 hoặc admin đã chuyển trạng thái Hết hàng (2).
  const outOfStock = product.quantity <= 0 || product.status === 2
  const maxQty = Math.max(1, product.quantity)

  const [gone, setGone] = useState(false) // #buy-box đã cuộn khỏi màn hình
  const [sheet, setSheet] = useState(false)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [reducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const closeRef = useRef<HTMLButtonElement>(null)
  const barBuyRef = useRef<HTMLButtonElement>(null)
  const timersRef = useRef<number[]>([])

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms))
  }

  // Dọn timer khi unmount.
  useEffect(
    () => () => {
      timersRef.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  // Đổi sản phẩm thì đặt lại số lượng + trạng thái sheet.
  useEffect(() => {
    setQty(1)
    setAdded(false)
    setSheet(false)
  }, [product.id])

  // Kẹp số lượng khi tồn kho đổi (vd API trả về số mới thấp hơn).
  useEffect(() => {
    setQty((q) => Math.min(q, Math.max(1, product.quantity)))
  }, [product.quantity])

  // Theo dõi hộp mua chính: chỉ hiện thanh khi nó đã cuộn khỏi màn hình.
  // Không tìm thấy #buy-box thì mặc định ẩn (gone = false).
  useEffect(() => {
    const target = document.getElementById('buy-box')
    if (!target || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        setGone(!entries[0].isIntersecting)
      },
      { threshold: 0 },
    )
    io.observe(target)
    return () => io.disconnect()
  }, [])

  const closeSheet = useCallback(
    (opts?: { returnFocus?: boolean }) => {
      setSheet(false)
      if (opts?.returnFocus !== false) {
        barBuyRef.current?.focus({ preventScroll: true })
      }
    },
    [],
  )

  // Mở sheet: focus nút đóng sau nhịp chuyển động (320ms, 0 khi giảm
  // chuyển động) — đúng gốc (gốc focus nút chọn đầu tiên; ở đây focus
  // nút đóng vì sheet không còn lưới size).
  useEffect(() => {
    if (!sheet) return
    const t = window.setTimeout(
      () => {
        closeRef.current?.focus({ preventScroll: true })
      },
      reducedMotion ? 0 : 320,
    )
    return () => window.clearTimeout(t)
  }, [sheet, reducedMotion])

  // Esc đóng sheet (lắng nghe ở window vì focus có thể ở ngoài sheet).
  useEffect(() => {
    if (!sheet) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheet, closeSheet])

  // Khóa cuộn trang trong lúc sheet mở.
  useEffect(() => {
    if (!sheet) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [sheet])

  const openSheet = () => {
    if (outOfStock) return
    setSheet(true)
  }

  const decQty = () => setQty((q) => Math.max(1, q - 1))
  const incQty = () => setQty((q) => Math.min(maxQty, q + 1))

  const handleAdd = () => {
    if (outOfStock || added) return
    onAddToCart(qty)
    setAdded(true)
    later(() => {
      closeSheet({ returnFocus: false })
      later(() => {
        setAdded(false)
        setQty(1)
      }, 450)
    }, reducedMotion ? 600 : 1100)
  }

  const handleBuyNowFromSheet = () => {
    if (outOfStock) return
    closeSheet({ returnFocus: false })
    onBuyNow(qty)
  }

  const visible = gone || sheet
  const total = product.price * qty
  const imgSrc = resolveImage(product.image)

  // Đẩy cụm nút nổi (về đầu trang + chat #450, z-65) lên trên khi thanh /
  // sheet hiện, khỏi đè lên nút "Mua ngay" của thanh. CSS đáp lại bằng
  // body.has-sticky-bar / .has-sticky-sheet trong lucian.css.
  useEffect(() => {
    document.body.classList.toggle('has-sticky-bar', visible)
    document.body.classList.toggle('has-sticky-sheet', sheet)
    return () => {
      document.body.classList.remove('has-sticky-bar')
      document.body.classList.remove('has-sticky-sheet')
    }
  }, [visible, sheet])

  return (
    <div
      className={`ux u221${visible ? ' is-bar' : ''}${sheet ? ' is-sheet' : ''}`}
    >
      <div className="u221-ov" aria-hidden="true" onClick={() => closeSheet()} />
      <div
        className="u221-br"
        aria-hidden={!visible}
        aria-label="Thanh mua nhanh"
      >
        <div className="u221-in">
          <div className="u221-rw">
            {imgSrc ? (
              <img src={imgSrc} alt="" className="u221-th" />
            ) : (
              <span className="u221-th" aria-hidden="true" />
            )}
            <div className="u221-ri">
              <b className="u221-nm">{product.name}</b>
              {outOfStock ? (
                <small className="u221-oos">Hết hàng</small>
              ) : (
                <small className="u221-pr">{formatPrice(product.price)}</small>
              )}
            </div>
            <button
              type="button"
              className="u221-by"
              onClick={openSheet}
              disabled={outOfStock}
              ref={barBuyRef}
            >
              {outOfStock ? 'Hết hàng' : 'Mua ngay'}
            </button>
          </div>
          <div
            className="u221-op"
            role="dialog"
            aria-modal="true"
            aria-label="Chọn số lượng và mua hàng"
            aria-hidden={!sheet}
          >
            <div className="u221-oh">
              <span>Số lượng</span>
              <button
                type="button"
                className="u221-x"
                aria-label="Đóng lựa chọn"
                onClick={() => closeSheet()}
                ref={closeRef}
              >
                <svg viewBox="0 0 10 10" aria-hidden="true">
                  <path
                    d="M2 2l6 6M8 2L2 8"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="u221-qt">
              <div
                className="u221-qty"
                role="group"
                aria-label="Chọn số lượng"
              >
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  disabled={qty <= 1 || outOfStock}
                  onClick={decQty}
                >
                  −
                </button>
                <span aria-live="polite" aria-label={`Số lượng đã chọn: ${qty}`}>
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  disabled={qty >= maxQty || outOfStock}
                  onClick={incQty}
                >
                  +
                </button>
              </div>
              <div className="u221-tt">
                <small>
                  {product.quantity <= 5 && !outOfStock
                    ? `Tổng cộng · Chỉ còn ${product.quantity}`
                    : 'Tổng cộng'}
                </small>
                <b>{formatPrice(total)}</b>
              </div>
            </div>
            <div className="u221-bt">
              <button
                type="button"
                className={`u221-ad${added ? ' is-ok' : ''}`}
                onClick={handleAdd}
                disabled={outOfStock || added}
                aria-live="polite"
              >
                <svg viewBox="0 0 14 14" aria-hidden="true">
                  <path
                    d="M3 7.5l2.6 2.6L11 4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{added ? 'Đã thêm' : 'Thêm vào giỏ'}</span>
              </button>
              <button
                type="button"
                className="u221-bn"
                onClick={handleBuyNowFromSheet}
                disabled={outOfStock}
              >
                Mua ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
