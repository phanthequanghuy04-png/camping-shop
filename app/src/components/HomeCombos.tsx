/**
 * Mục "Combo cắm trại" — section mới theo prompt KAIRN viết lại.
 *
 * 3 combo làm từ sản phẩm THẬT của shop, tổng tiền tính trực tiếp từ
 * PRODUCTS (không ghi cứng tổng). Nút "Thêm combo vào giỏ" thêm từng món
 * vào giỏ thật rồi mở ngăn giỏ (dùng đúng dispatchAddToCart + useCart
 * như ProductCard / ProductDetailPage).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { dispatchAddToCart } from './ProductCard'
import { useCart } from '../context/CartContext'
import { showToast } from '../lib/toast'
import { formatPrice, getProductById, resolveImage } from '../data/products'

const COMBOS = [
  {
    id: 'combo-dalat',
    name: 'Combo 2 ngày 1 đêm',
    trip: 'Đà Lạt · 2 người',
    note: 'Nhẹ gọn, đủ đồ cho một đêm trại trên đồi thông.',
    ids: [1, 8, 9, 13],
  },
  {
    id: 'combo-bavi',
    name: 'Combo Gia đình',
    trip: 'Ba Vì · 4–6 người',
    note: 'Lều lớn 2 phòng ngủ, nấu nướng thoải mái cho cả nhà.',
    ids: [3, 7, 10, 21],
  },
  {
    id: 'combo-taxua',
    name: 'Combo Leo núi',
    trip: 'Tà Xùa · 2–3 ngày',
    note: 'Bền, nhẹ, chịu lạnh tốt cho chuyến đi dài ngày.',
    ids: [17, 5, 14, 24],
  },
] as const

export default function HomeCombos() {
  const { openDrawer } = useCart()
  const [addedId, setAddedId] = useState<string | null>(null)

  function addCombo(combo: (typeof COMBOS)[number]) {
    const items = combo.ids
      .map((id) => getProductById(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
    if (!items.length) return
    items.forEach((p) => dispatchAddToCart(p.id, 1))
    setAddedId(combo.id)
    showToast(`Đã thêm ${combo.name} (${items.length} món) vào giỏ.`)
    openDrawer(items[0].id)
    window.setTimeout(() => setAddedId((cur) => (cur === combo.id ? null : cur)), 1600)
  }

  return (
    <section id="combos" className="mx-auto mt-16 w-full max-w-6xl scroll-mt-24 px-4 sm:mt-20 sm:px-6">
      <p className="home-eyebrow text-center">Đủ bộ cho chuyến đi</p>
      <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Combo cắm trại
      </h2>
      <p className="mx-auto mt-3 max-w-[560px] text-center text-base text-muted-foreground">
        Đã chọn sẵn theo từng kiểu chuyến đi — bấm một nút là đủ bộ vào giỏ.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {COMBOS.map((combo) => {
          const items = combo.ids
            .map((id) => getProductById(id))
            .filter((p): p is NonNullable<typeof p> => Boolean(p))
          const total = items.reduce((sum, p) => sum + p.price, 0)
          const added = addedId === combo.id
          return (
            <article
              key={combo.id}
              className="flex flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="border-b border-border bg-primary-soft px-5 py-4">
                <h3 className="text-lg leading-snug font-extrabold text-foreground">
                  {combo.name}
                </h3>
                <p className="mt-1 text-sm font-bold text-primary-text">{combo.trip}</p>
                <p className="mt-1 text-sm text-muted-foreground">{combo.note}</p>
              </div>

              <ul className="flex-1 space-y-3 px-5 py-4">
                {items.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/product/${p.id}`}
                      className="flex items-center gap-3 rounded-xl p-1 transition hover:bg-muted"
                    >
                      <img
                        src={resolveImage(p.image)}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        className="h-11 w-11 shrink-0 rounded-lg object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {p.name}
                        </span>
                        <span className="text-sm font-bold text-primary-text">
                          {formatPrice(p.price)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border px-5 py-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Tổng cộng · {items.length} món
                  </span>
                  <span className="text-lg font-extrabold text-primary-text">
                    {formatPrice(total)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => addCombo(combo)}
                  disabled={added}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2D6A4F] px-5 py-2.5 text-base font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#245940] focus:outline-2 focus:outline-offset-2 focus:outline-ring disabled:cursor-default disabled:bg-[#047857]"
                >
                  {added ? (
                    <>
                      <span aria-hidden="true">✓</span> Đã thêm vào giỏ
                    </>
                  ) : (
                    'Thêm combo vào giỏ'
                  )}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
