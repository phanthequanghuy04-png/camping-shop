// Lucian UX/UI Prompt #240 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#240
// Ngăn giỏ trượt từ phải vào + thanh tiến trình miễn phí vận chuyển.
// Món mới thêm vào nhấp nháy; xóa món thì hàng trượt ra rồi gập lại;
// tăng số lượng thì tổng tiền lăn từng chữ số.
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatVND, useCart } from '../context/CartContext'
import { FREE_SHIPPING_THRESHOLD } from '../lib/coupons'
import { resolveImage } from '../data/products'

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/** Tổng tiền lăn từng chữ số (kỹ thuật .u240-dg của bản gốc). */
function RollingNumber({ value }: { value: number }) {
  const text = formatVND(value)
  return (
    <b aria-label={text}>
      {text.split('').map((ch, i) => {
        if (/\d/.test(ch)) {
          const d = Number(ch)
          return (
            <span key={i} className="u240-dg" aria-hidden="true">
              <span style={{ transform: `translateY(${-d * 1.2}em)` }}>
                {DIGITS.map((digit, k) => (
                  <span key={k}>
                    {digit}
                    {k < DIGITS.length - 1 ? <br /> : null}
                  </span>
                ))}
              </span>
            </span>
          )
        }
        return (
          <span key={i} aria-hidden="true">
            {ch}
          </span>
        )
      })}
    </b>
  )
}

export default function CartDrawer() {
  const {
    detailedItems,
    totalQty,
    totalPrice,
    updateQty,
    removeFromCart,
    isDrawerOpen,
    flashProductId,
    closeDrawer,
  } = useCart()
  const navigate = useNavigate()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [removingIds, setRemovingIds] = useState<ReadonlySet<number>>(
    new Set(),
  )

  // Mở ngăn thì khóa cuộn trang + focus nút đóng; đóng thì trả lại.
  useEffect(() => {
    if (!isDrawerOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const timer = window.setTimeout(
      () => closeRef.current?.focus({ preventScroll: true }),
      reduced ? 0 : 300,
    )
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isDrawerOpen, closeDrawer])

  const freeShipOk = totalPrice >= FREE_SHIPPING_THRESHOLD
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice)
  const barPercent = Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100)

  const handleRemove = (productId: number) => {
    if (removingIds.has(productId)) return
    setRemovingIds((prev) => new Set(prev).add(productId))
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    window.setTimeout(
      () => {
        removeFromCart(productId)
        setRemovingIds((prev) => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })
      },
      reduced ? 0 : 600,
    )
  }

  const goTo = (path: string) => {
    closeDrawer()
    navigate(path)
  }

  return (
    <div className={`ux u240-root${isDrawerOpen ? ' is-open' : ''}`}>
      <div className="u240-ov" aria-hidden="true" onClick={closeDrawer} />
      <aside
        className="u240-dr"
        role="dialog"
        aria-modal="true"
        aria-hidden={!isDrawerOpen}
        aria-label="Giỏ hàng"
      >
        <div className="u240-dh">
          <b>
            Giỏ hàng<i className="u240-ct">{totalQty}</i>
          </b>
          <button
            type="button"
            className="u240-x"
            aria-label="Đóng giỏ hàng"
            onClick={closeDrawer}
            ref={closeRef}
          >
            <svg viewBox="0 0 11 11" aria-hidden="true">
              <path
                d="M2 2l7 7M9 2L2 9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div
          className={`u240-fs${freeShipOk ? ' is-ok' : ''}`}
          aria-live="polite"
        >
          <span className="u240-fm">
            {freeShipOk ? (
              'Bạn đã được miễn phí vận chuyển!'
            ) : (
              <>
                <b>{formatVND(remaining)}</b> nữa được miễn phí vận chuyển
              </>
            )}
          </span>
          <div className="u240-bar">
            <i style={{ width: `${barPercent}%` }} />
          </div>
        </div>

        <div className="u240-ls">
          {detailedItems.length === 0 && (
            <p className="u240-empty">
              Giỏ hàng đang trống.
              <br />
              <button
                type="button"
                className="mt-3 font-medium text-[#2D6A4F] underline underline-offset-4"
                onClick={() => goTo('/shop')}
              >
                Tiếp tục mua sắm →
              </button>
            </p>
          )}
          {detailedItems.map((item) => {
            const isGone = removingIds.has(item.productId)
            const isFlash = item.productId === flashProductId
            return (
              <div
                key={item.productId}
                className={`u240-it${isGone ? ' is-gone' : ''}${isFlash ? ' is-fl' : ''}`}
              >
                <div>
                  <div className="u240-in">
                    {item.product?.image ? (
                      <img
                        className="u240-th"
                        src={resolveImage(item.product.image)}
                        alt=""
                      />
                    ) : (
                      <span className="u240-th" aria-hidden="true" />
                    )}
                    <div className="u240-tx">
                      <b>{item.product?.name ?? `Sản phẩm #${item.productId}`}</b>
                      <small>{formatVND(item.unitPrice)} / sản phẩm</small>
                      <div className="u240-qt">
                        <button
                          type="button"
                          aria-label="Giảm số lượng"
                          onClick={() =>
                            updateQty(item.productId, item.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Tăng số lượng"
                          onClick={() =>
                            updateQty(item.productId, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="u240-pr">
                      <span className="u240-lp">
                        {formatVND(item.subtotal)}
                      </span>
                      <button
                        type="button"
                        className="u240-rm"
                        aria-label={`Xóa ${item.product?.name ?? 'sản phẩm'} khỏi giỏ`}
                        onClick={() => handleRemove(item.productId)}
                      >
                        <svg viewBox="0 0 12 12" aria-hidden="true">
                          <path
                            d="M2.5 3.5h7M4.8 3.5V2.3h2.4v1.2M3.5 3.5l.5 6.2h4l.5-6.2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="u240-ft">
          <div className="u240-sm">
            Tạm tính
            <RollingNumber value={totalPrice} />
          </div>
          <button
            type="button"
            className="u240-ck"
            disabled={detailedItems.length === 0}
            onClick={() => goTo('/checkout')}
          >
            Thanh toán
          </button>
          <Link
            to="/cart"
            className="mt-3 block text-center text-sm font-medium text-[#2D6A4F] hover:underline"
            onClick={closeDrawer}
          >
            Xem giỏ hàng đầy đủ →
          </Link>
        </div>
      </aside>
    </div>
  )
}
