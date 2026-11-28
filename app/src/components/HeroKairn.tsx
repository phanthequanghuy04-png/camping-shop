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
 * - Cụm tile 2×2 cũ (2 danh mục + vòng tròn 8 danh mục + thẻ bán chạy
 *   nhất) đã thay bằng Plan switch #423 (Lucian) theo yêu cầu của Huy
 *   2026-11-28: công tắc Mua lẻ / Mua combo, giá lăn odometer.
 * - Copy tiếng Việt, giá VND, màu xanh rừng/kem/cam lửa trại của shop.
 * - Thẻ câu chuyện dẫn tới mục combo (#combos) thay cho "GLACIER COLLECTION".
 * - Social chỉ là họa tiết trang trí (shop chưa có trang mạng xã hội).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resolveImage } from '../data/products'
import PlanSwitch from './PlanSwitch'

export default function HeroKairn() {
  // Ảnh hero mờ dần vào khi tải xong (2026-11-28): trước đây ảnh 610KB
  // về muộn thì hiện "bụp" một cái sau khi hiệu ứng vào trang đã chạy
  // xong, còn nền section trong suốt nên chữ trắng khó đọc lúc chưa
  // có ảnh. Nay nền xanh đậm (xem .kairn-hero trong index.css) giữ
  // chữ đọc được, ảnh về thì mờ dần trong 0.7s.
  const [imgLoaded, setImgLoaded] = useState(false)
  return (
    <section className="kairn-hero relative overflow-hidden text-white">
      {/* Ảnh nền: lều vàng lúc hoàng hôn, rừng thông, lửa trại */}
      <img
        src={resolveImage('/images/hero-camp.jpg')}
        alt=""
        aria-hidden="true"
        decoding="async"
        fetchPriority="high"
        onLoad={() => setImgLoaded(true)}
        style={{
          opacity: imgLoaded ? 1 : 0,
          transition: 'opacity 0.7s ease',
        }}
        className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
      />
      {/* Lớp phủ xanh rừng giữ chữ trắng đọc rõ trên ảnh sáng */}
      <div className="kairn-shade absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[92svh] w-full max-w-[1200px] flex-col px-4 pt-28 pb-10 sm:px-6 md:pt-32 md:pb-12">
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-8">
          {/* Trái: tiêu đề + nút + thống kê */}
          <div>
            <p
              className="kairn-in text-xs font-bold tracking-[0.14em] uppercase opacity-90 sm:text-sm sm:tracking-[0.22em]"
              style={{ animationDelay: '0.1s' }}
            >
              Đồ cắm trại — Chuẩn bị cho chuyến đi tiếp theo
            </p>
            <h1 className="mt-4 font-[Be_Vietnam_Pro,Inter,sans-serif] text-[42px] leading-[1.04] font-extrabold tracking-tight sm:text-6xl md:text-[64px]">
              <span className="kairn-ln">
                <span style={{ animationDelay: '0.25s' }}>Sống trọn</span>
              </span>
              <span className="kairn-ln">
                <span style={{ animationDelay: '0.4s' }}>từng khoảnh khắc.</span>
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
                className="kairn-cta kairn-cta-primary inline-flex min-h-12 items-center rounded-full bg-[#1B4332] px-7 py-3 text-base font-bold text-white shadow-lg hover:bg-[#14332a] focus:outline-2 focus:outline-offset-2 focus:outline-white"
              >
                Mua sắm ngay
                <span className="kairn-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
              {/* Nút "Xem combo" dẫn tới mục Combo cắm trại (#combos) —
                  thay cho nút "Xem bộ sưu tập" cũ (sang /shop) theo yêu
                  cầu của Huy 2026-11-28: đưa phần combo lên thay thế. */}
              <a
                href="#combos"
                className="kairn-cta kairn-cta-ghost inline-flex min-h-12 items-center rounded-full border-2 border-white/85 bg-white/15 px-7 py-3 text-base font-bold text-white backdrop-blur-sm focus:outline-2 focus:outline-offset-2 focus:outline-white"
              >
                <span>Xem combo</span>
              </a>
            </div>
          </div>

          {/* Phải: chuyển đổi gói mua #423 (Lucian Plan switch) — thay cụm
              tile 2×2 (2 danh mục + vòng tròn 8 danh mục + thẻ bán chạy
              nhất) theo yêu cầu của Huy 2026-11-28. */}
          <div
            className="kairn-in flex items-center justify-center"
            style={{ animationDelay: '0.5s' }}
          >
            <PlanSwitch />
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
