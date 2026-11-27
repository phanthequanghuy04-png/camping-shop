/**
 * Lucian UX/UI Prompt #261 — Review filter by star bars (Social Proof).
 * MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#261
 *
 * Hành vi giữ đúng gốc:
 * - Điểm trung bình (product.rating) tô sao theo phần thập phân; số lượng
 *   đánh giá = 18 + (product.id * 7) % 60.
 * - 5 hàng thanh 5★→1★, tỉ lệ suy ra từ rating, mọc ra (scaleX) khi cuộn
 *   tới, stagger 0.15s + i*0.07s như gốc (IntersectionObserver).
 * - Bấm 1 thanh: chỉ hiện đánh giá đúng số sao đó, hàng đó in đậm
 *   (class .is-on, các hàng khác mờ đi qua .is-f); bấm lại: về tất cả.
 * - Nút "Hữu ích": bấm +1, bấm lại thì bỏ; lưu localStorage
 *   `camping-review-helpful` nên tải lại trang vẫn nhớ.
 *
 * Điểm thích ứng so với gốc:
 * - Gốc là khung cố định 340×340, danh sách cuộn trong, vị trí absolute.
 *   Bản này fluid full-width (max-width 720px, CSS u261.css), chiều cao
 *   tự nhiên, không cuộn trong, không absolute positioning.
 * - Tóm tắt + thanh lọc xếp ngang trên desktop, xếp dọc trên mobile
 *   (xem media query trong u261.css).
 * - Dữ liệu thật từ data/reviews.ts (6 đánh giá/sản phẩm) thay cho mảng
 *   mẫu cứng trong script gốc; thêm ngày đánh giá + tiêu đề mỗi đánh giá.
 * - Toàn bộ chữ tiếng Việt.
 *
 * CSS nằm ở _staging/u261.css — người tích hợp append nội dung đó vào
 * app/src/components/lucian.css (KHÔNG import CSS ở đây vì file đó
 * chưa nằm trong src/).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Product } from '../data/types'
import { getReviewsForProduct } from '../data/reviews'

const LS_KEY = 'camping-review-helpful'

/** '★★★☆☆' cho n sao (như hàm stars() trong script gốc). */
function stars(n: number): string {
  return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n)
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function loadHelpful(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

export default function ReviewFilter({ product }: { product: Product }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  const [filter, setFilter] = useState(0)
  const [mine, setMine] = useState<Record<string, boolean>>(loadHelpful)

  const rating = product.rating
  const total = 18 + ((product.id * 7) % 60)

  // Tỉ lệ từng mức sao suy ra từ điểm trung bình, tổng = 100.
  const pcts = useMemo(() => {
    const p5 = clamp(Math.round((rating - 3.5) * 60), 35, 92)
    const r1 = 100 - p5
    const p4 = Math.round(r1 * 0.65)
    const r2 = r1 - p4
    const p3 = Math.round(r2 * 0.6)
    const r3 = r2 - p3
    const p2 = Math.round(r3 / 2)
    const p1 = r3 - p2
    return [p5, p4, p3, p2, p1]
  }, [rating])

  const reviews = useMemo(
    () => getReviewsForProduct(product.id),
    [product.id],
  )
  const visible = filter
    ? reviews.filter((r) => r.stars === filter)
    : reviews

  // Mọc thanh + tô sao khi cuộn tới (gốc dùng IntersectionObserver).
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          io.disconnect()
          requestAnimationFrame(() => setShown(true))
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  function toggleHelpful(id: string) {
    setMine((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      if (!next[id]) delete next[id]
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next))
      } catch {
        // Bỏ qua: trình duyệt chặn localStorage.
      }
      return next
    })
  }

  const avg = rating.toFixed(1).replace('.', ',')

  return (
    <div ref={rootRef} className={`ux u261${filter ? ' is-f' : ''}`}>
      <div className="u261-tp">
        <div className="u261-av">
          <b>{avg}</b>
          <span className="u261-st" aria-label={`Trung bình ${avg} trên 5 sao`}>
            ★★★★★
            <i
              aria-hidden="true"
              style={{ width: shown ? `${(rating / 5) * 100}%` : '0%' }}
            >
              ★★★★★
            </i>
          </span>
          <small>{total.toLocaleString('vi-VN')} đánh giá</small>
        </div>
        <div
          className="u261-bs"
          role="group"
          aria-label="Lọc đánh giá theo số sao"
        >
          {pcts.map((pct, i) => {
            const s = 5 - i
            const on = filter === s
            return (
              <button
                key={s}
                type="button"
                className={`u261-br${on ? ' is-on' : ''}`}
                aria-pressed={on}
                onClick={() => setFilter(filter === s ? 0 : s)}
              >
                <span>{s}★</span>
                <em>
                  <i
                    style={{
                      transform: shown
                        ? `scaleX(${(pct / pcts[0]).toFixed(3)})`
                        : 'scaleX(0)',
                      transitionDelay: `${0.15 + i * 0.07}s`,
                    }}
                  />
                </em>
                <span>{pct}%</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="u261-hd">
        <span className="u261-tt">
          {filter ? `Đánh giá ${filter} sao` : 'Tất cả đánh giá'}
        </span>
        <span>{visible.length} đánh giá</span>
      </div>

      <div className="u261-ls" aria-live="polite">
        {visible.length === 0 ? (
          <p className="u261-empty">
            Chưa có đánh giá {filter} sao cho sản phẩm này.
          </p>
        ) : (
          visible.map((r, i) => (
            <article
              key={`${filter}-${r.id}`}
              className="u261-rv"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <header>
                <i aria-label={`${r.stars}/5 sao`}>{stars(r.stars)}</i>
                <span>{r.author}</span>
                <time dateTime={r.date.split('/').reverse().join('-')}>
                  {r.date}
                </time>
                <button
                  type="button"
                  className="u261-hp"
                  aria-pressed={!!mine[r.id]}
                  onClick={() => toggleHelpful(r.id)}
                >
                  <svg viewBox="0 0 10 10" aria-hidden="true">
                    <path
                      d="M1.5 4.5h1.6v4H1.5zM3.1 8.5h3.8l1.5-3.4-.4-.8H5.6l.4-2.2-.6-.6L3.1 4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.1"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Hữu ích {r.helpful + (mine[r.id] ? 1 : 0)}</span>
                </button>
              </header>
              {r.title && <strong className="u261-ti">{r.title}</strong>}
              <p>{r.text}</p>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
