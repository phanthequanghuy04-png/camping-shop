/**
 * Hero kiểu KAIRN (MotionSites, prompt viết lại 2026-11-28) cho trang chủ.
 *
 * Bố cục gốc KAIRN: ảnh nền full-bleed + tiêu đề lớn bên trái + cụm tile
 * 2×2 bên phải + thẻ câu chuyện góc trái-dưới + nút CTA trên đường kẻ
 * ngang + social góc phải-dưới, hiệu ứng vào trang 2,2s.
 *
 * Thích ứng cho shop cắm trại:
 * - Ảnh nền: ảnh lều vàng lúc hoàng hôn do shop tự tạo (hero-camp.jpg),
 *   thay cho ảnh tuyết + kính trượt tuyết của bản gốc.
 * - Cụm tile 2×2: 2 danh mục (Lều trại, Túi ngủ) + vòng tròn "01 / 08"
 *   (8 danh mục) + thẻ sản phẩm bán chạy nhất (Lều 2 người, 4.8★).
 * - Copy tiếng Việt, giá VND, màu xanh rừng/kem/cam lửa trại của shop.
 * - Thẻ câu chuyện dẫn tới mục combo (#combos) thay cho "GLACIER COLLECTION".
 * - Social chỉ là họa tiết trang trí (shop chưa có trang mạng xã hội).
 */
import { Link } from 'react-router-dom'
import {
  formatPrice,
  getProductById,
  getProductsByCategory,
  resolveImage,
} from '../data/products'

const TENT = getProductById(1) // Lều 2 người, bán chạy nhất (4.8★)

function minPrice(categoryId: number): number {
  const items = getProductsByCategory(categoryId)
  return items.length ? Math.min(...items.map((p) => p.price)) : 0
}

const TILES = [
  {
    categoryId: 1,
    label: '01 / LỀU TRẠI',
    title: 'Lều 2–4 người',
    // Ảnh lều 4 người — ô 1 trước đây không có ảnh (Huy báo lỗi 2026-11-28).
    image: '/images/leu-trai-4-nguoi.jpg',
  },
  {
    categoryId: 2,
    label: '02 / TÚI NGỦ',
    title: 'Túi ngủ',
    // Ảnh túi ngủ 3 mùa — ô 2 trước đây không có ảnh (Huy báo lỗi 2026-11-28).
    image: '/images/tui-ngu-3-mua.jpg',
  },
] as const

export default function HeroKairn() {
  return (
    <section className="kairn-hero relative overflow-hidden text-white">
      {/* Ảnh nền: lều vàng lúc hoàng hôn, rừng thông, lửa trại */}
      <img
        src={resolveImage('/images/hero-camp.jpg')}
        alt=""
        aria-hidden="true"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
      />
      {/* Lớp phủ xanh rừng giữ chữ trắng đọc rõ trên ảnh sáng */}
      <div className="kairn-shade absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[92svh] w-full max-w-[1200px] flex-col px-4 pt-28 pb-10 sm:px-6 md:pt-32 md:pb-12">
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-8">
          {/* Trái: tiêu đề + nút + thống kê */}
          <div>
            <p
              className="kairn-in text-xs font-bold tracking-[0.22em] uppercase opacity-90 sm:text-sm"
              style={{ animationDelay: '0.1s' }}
            >
              Đồ cắm trại — Chuẩn bị cho chuyến đi tiếp theo
            </p>
            <h1 className="mt-4 font-[Be_Vietnam_Pro,Inter,sans-serif] text-[42px] leading-[1.04] font-extrabold tracking-tight sm:text-6xl md:text-[64px]">
              <span className="kairn-ln">
                <span style={{ animationDelay: '0.25s' }}>Ra ngoài trời,</span>
              </span>
              <span className="kairn-ln">
                <span style={{ animationDelay: '0.4s' }}>sống trọn từng</span>
              </span>
              <span className="kairn-ln">
                <span style={{ animationDelay: '0.55s' }}>khoảnh khắc</span>
              </span>
            </h1>
            <p
              className="kairn-in mt-4 max-w-[480px] text-base leading-relaxed text-white/90 sm:text-lg"
              style={{ animationDelay: '0.7s' }}
            >
              Lều, bếp, đèn và mọi thứ bạn cần cho một đêm dưới bầu trời sao.
            </p>
            <div
              className="kairn-in mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: '0.85s' }}
            >
              <Link
                to="/shop"
                className="kairn-cta inline-flex min-h-12 items-center rounded-full bg-[#1B4332] px-7 py-3 text-base font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#14332a] focus:outline-2 focus:outline-offset-2 focus:outline-white"
              >
                Mua sắm ngay
              </Link>
              {/* Nút "Xem combo" dẫn tới mục Combo cắm trại (#combos) —
                  thay cho nút "Xem bộ sưu tập" cũ (sang /shop) theo yêu
                  cầu của Huy 2026-11-28: đưa phần combo lên thay thế. */}
              <a
                href="#combos"
                className="kairn-cta inline-flex min-h-12 items-center rounded-full bg-white/15 px-7 py-3 text-base font-bold text-white shadow-[inset_0_0_0_2px_rgba(255,255,255,0.85)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/25 focus:outline-2 focus:outline-offset-2 focus:outline-white"
              >
                Xem combo
              </a>
            </div>
          </div>

          {/* Phải: cụm tile 2×2 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {TILES.map((tile, i) => (
              <Link
                key={tile.categoryId}
                to={`/shop?category=${tile.categoryId}`}
                // Cả 2 ô đều nền kem như các ô còn lại (ô 1 trước đây là ô
                // xanh duy nhất nên bị khác màu — Huy báo lỗi 2026-11-28).
                className="kairn-in kairn-tile kairn-tile-cream"
                style={{ animationDelay: `${0.5 + i * 0.15}s` }}
              >
                <img
                  src={resolveImage(tile.image)}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="h-20 w-full rounded-xl object-cover sm:h-24"
                />
                <span className="mt-2 block text-[11px] font-extrabold tracking-[0.14em] opacity-80">
                  {tile.label}
                </span>
                <span className="mt-2 block font-[Be_Vietnam_Pro,Inter,sans-serif] text-xl leading-tight font-extrabold sm:text-2xl">
                  {tile.title}
                </span>
                <span className="mt-2 block text-sm font-semibold opacity-85">
                  {getProductsByCategory(tile.categoryId).length} sản phẩm · từ{' '}
                  {formatPrice(minPrice(tile.categoryId))}
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold">
                  Xem ngay <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}

            {/* Vòng tròn kính: 8 danh mục — sang cửa hàng (mục danh mục
                trên trang chủ đã bỏ, thay bằng menu thả #413 trên
                header — Huy yêu cầu 2026-11-28). */}
            <Link
              to="/shop"
              className="kairn-in kairn-tile kairn-glass-circle"
              style={{ animationDelay: '0.8s' }}
              aria-label="Xem tất cả 8 danh mục"
            >
              <span className="kairn-ring" aria-hidden="true">
                <span className="text-xl font-extrabold">↘</span>
              </span>
              <span className="mt-2 block text-sm font-extrabold tracking-wide">
                01 / 08
              </span>
              <span className="text-xs font-semibold opacity-85">
                8 danh mục đồ cắm trại
              </span>
            </Link>

            {/* Thẻ sản phẩm bán chạy nhất */}
            {TENT && (
              <Link
                to={`/product/${TENT.id}`}
                className="kairn-in kairn-tile kairn-tile-cream"
                style={{ animationDelay: '0.95s' }}
              >
                <img
                  src={resolveImage(TENT.image)}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="h-20 w-full rounded-xl object-cover sm:h-24"
                />
                <span className="mt-2 block text-[11px] font-extrabold tracking-[0.14em] opacity-80">
                  BÁN CHẠY NHẤT · ★ {TENT.rating.toFixed(1)}
                </span>
                <span className="mt-1 block font-[Be_Vietnam_Pro,Inter,sans-serif] text-base leading-snug font-extrabold">
                  Lều trại 2 người
                </span>
                <span className="mt-1 block text-sm font-bold text-primary-text">
                  {formatPrice(TENT.price)}
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-sm font-bold">
                  Xem ngay <span aria-hidden="true">→</span>
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Hàng dưới: đường kẻ + social (thẻ câu chuyện "BỘ SƯU TẬP MÙA
            HÈ" đã bỏ 2026-11-28 — trùng đích với nút "Xem combo" ở trên,
            Huy yêu cầu loại bỏ phần thừa). */}
        <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div
            className="kairn-in relative hidden flex-1 items-center md:flex"
            style={{ animationDelay: '1.3s' }}
            aria-hidden="true"
          >
            <span className="kairn-rule absolute inset-x-0 top-1/2 h-px bg-white/40" />
          </div>

          {/* Nút cam "Khám phá cửa hàng" đã bỏ (trùng đích với "Mua sắm
              ngay" — hero có quá nhiều nút sang cửa hàng, theo yêu cầu
              của Huy 2026-11-28); hàng dưới còn thẻ câu chuyện + đường
              kẻ + social. */}
          <div
            className="kairn-in flex items-center gap-3"
            style={{ animationDelay: '1.45s' }}
          >
            <span className="ml-2 hidden items-center gap-2 lg:flex" aria-hidden="true">
              <span className="text-xs font-bold tracking-[0.18em] text-white/80">
                THEO DÕI SHOP
              </span>
              <span className="kairn-soc">f</span>
              <span className="kairn-soc">◎</span>
              <span className="kairn-soc">♪</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
