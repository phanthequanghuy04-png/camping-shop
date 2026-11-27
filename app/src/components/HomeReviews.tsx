/**
 * Mục "Đánh giá khách hàng" — section mới theo prompt KAIRN viết lại.
 *
 * Điểm trung bình tính từ rating THẬT của 28 sản phẩm; tỉ lệ các thanh sao
 * dùng đúng công thức suy ra từ điểm trung bình của #261 (ReviewFilter).
 * 3 đánh giá hiển thị lấy từ cùng pool dữ liệu mẫu của #261
 * (app/src/data/reviews.ts) — hiện vẫn là đánh giá mẫu, chưa phải đánh giá
 * thật của khách (cần backend đánh giá mới có đánh giá thật).
 */
import { getReviewsForProduct } from '../data/reviews'
import { PRODUCTS } from '../data/products'

/** Tỉ lệ 5 thanh sao suy ra từ điểm trung bình — cùng công thức với #261. */
function starShares(rating: number): number[] {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
  const five = clamp(Math.round((rating - 3.5) * 60), 35, 92)
  let rest = 100 - five
  const four = Math.round(rest * 0.65)
  rest -= four
  const three = Math.round(rest * 0.6)
  rest -= three
  const two = Math.round(rest / 2)
  const one = rest - two
  return [five, four, three, two, one]
}

function Stars({ value }: { value: number }) {
  const pct = `${Math.min(100, Math.max(0, (value / 5) * 100))}%`
  return (
    <span
      className="relative inline-block text-lg leading-none tracking-[2px]"
      role="img"
      aria-label={`${value.toFixed(1)} trên 5 sao`}
    >
      <span className="text-muted-foreground/40" aria-hidden="true">
        ★★★★★
      </span>
      <span
        className="absolute inset-0 overflow-hidden whitespace-nowrap text-[#F59E0B]"
        style={{ width: pct }}
        aria-hidden="true"
      >
        ★★★★★
      </span>
    </span>
  )
}

export default function HomeReviews() {
  const avg =
    PRODUCTS.reduce((sum, p) => sum + p.rating, 0) / (PRODUCTS.length || 1)
  const avgText = avg.toFixed(1).replace('.', ',')
  const shares = starShares(avg)
  const reviews = getReviewsForProduct(1).slice(0, 3)

  return (
    <section className="mx-auto mt-16 w-full max-w-6xl px-4 sm:mt-20 sm:px-6">
      <p className="home-eyebrow text-center">Khách hàng nói gì</p>
      <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Đánh giá khách hàng
      </h2>

      <div className="mt-8 grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Tóm tắt điểm + thanh sao */}
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-end gap-3">
            <span className="text-5xl leading-none font-extrabold text-foreground">
              {avgText}
            </span>
            <span className="pb-1 text-sm font-semibold text-muted-foreground">
              / 5
            </span>
          </div>
          <div className="mt-2">
            <Stars value={avg} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Điểm trung bình của các sản phẩm tại shop
          </p>
          <div className="mt-5 space-y-2">
            {shares.map((pct, i) => (
              <div key={5 - i} className="flex items-center gap-2 text-sm">
                <span className="w-6 shrink-0 text-right font-bold text-foreground">
                  {5 - i}★
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[#F59E0B]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right font-semibold text-muted-foreground">
                  {pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3 đánh giá mẫu */}
        <div className="grid gap-5 sm:grid-cols-3">
          {reviews.map((r) => (
            <figure
              key={r.id}
              className="flex flex-col rounded-3xl border border-border bg-surface p-5 shadow-sm"
            >
              <Stars value={r.stars} />
              {r.title && (
                <figcaption className="mt-3 text-base leading-snug font-extrabold text-foreground">
                  {r.title}
                </figcaption>
              )}
              <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {r.text}
              </blockquote>
              <figcaption className="mt-4 border-t border-border pt-3 text-sm">
                <span className="block font-bold text-foreground">{r.author}</span>
                <span className="text-muted-foreground">{r.date}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
