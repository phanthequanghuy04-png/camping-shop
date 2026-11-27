/**
 * Hero minh họa mới cho trang chủ (thiết kế lại 2026-11-28 theo bản mẫu
 * "Camping Events To Remember" mà Huy gửi: sạch, gọn, nổi bật).
 *
 * Thay cảnh 3D/ảnh lều cũ (Hero3D) bằng tranh SVG vẽ tay: bầu trời
 * gradient xanh nhạt, mặt trời, mây trôi, chim, rừng thông nhiều lớp,
 * lều vàng cửa đỏ + lửa trại nhỏ. Không dùng ảnh mạng nên nhẹ và nét
 * ở mọi màn hình. Chế độ tối đổi thành bầu trời đêm (trăng + sao,
 * cửa lều sáng đèn). Chữ + nút là HTML thật (không phải chữ trong SVG)
 * để font và responsive chuẩn. Giữ nguyên nội dung tiêu đề và 2 nút
 * cũ (Mua sắm ngay → /shop, Xem bộ sưu tập → /shop).
 */
import { Link } from 'react-router-dom'

const PINES_BACK: Array<[number, number, number]> = [
  [70, 468, 1.0],
  [150, 472, 1.25],
  [240, 466, 0.9],
  [330, 470, 1.15],
  [420, 468, 0.95],
  [500, 472, 1.2],
  [640, 468, 1.0],
  [760, 470, 0.9],
  [1290, 468, 1.1],
  [1370, 472, 0.9],
  [1420, 466, 1.2],
]

const PINES_FRONT: Array<[number, number, number]> = [
  [30, 560, 1.5],
  [130, 566, 1.2],
  [250, 562, 1.6],
  [380, 568, 1.3],
  [470, 564, 1.45],
  [1240, 562, 1.5],
  [1330, 568, 1.25],
  [1410, 564, 1.55],
]

const STARS: Array<[number, number, number]> = [
  [120, 70, 2.2],
  [260, 120, 1.8],
  [420, 60, 2.4],
  [560, 140, 1.6],
  [700, 80, 2.0],
  [860, 50, 1.8],
  [980, 130, 2.2],
  [1240, 60, 1.7],
  [1350, 150, 2.0],
  [180, 190, 1.6],
  [640, 200, 1.8],
  [1080, 200, 1.6],
]

export default function HeroIllustrated() {
  return (
    <section className="hero-illus relative overflow-hidden">
      {/* Tranh nền SVG — bầu trời, rừng thông, lều vàng, lửa trại */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 620"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="hero-stop-1" />
            <stop offset="0.62" className="hero-stop-2" />
            <stop offset="1" className="hero-stop-3" />
          </linearGradient>
          <radialGradient id="hero-sun-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFD66B" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FFD66B" stopOpacity="0" />
          </radialGradient>
          <g id="hero-pine">
            <path d="M0 -52 L14 -20 L7 -20 L18 4 L10 4 L20 26 L-20 26 L-10 4 L-18 4 L-7 -20 L-14 -20 Z" />
            <rect x="-3" y="26" width="6" height="10" rx="1.5" />
          </g>
        </defs>

        {/* Bầu trời */}
        <rect width="1440" height="620" fill="url(#hero-sky)" />

        {/* Sao (chỉ hiện ở chế độ tối) */}
        <g className="hero-stars" fill="#F5F0E1">
          {STARS.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} />
          ))}
        </g>

        {/* Mặt trời / mặt trăng */}
        <circle cx="1150" cy="108" r="92" fill="url(#hero-sun-glow)" />
        <circle className="hero-sun" cx="1150" cy="108" r="52" />

        {/* Mây trôi */}
        <g className="hero-cloud" fill="#FFFFFF" opacity="0.85">
          <ellipse cx="300" cy="110" rx="70" ry="20" />
          <ellipse cx="350" cy="96" rx="46" ry="16" />
        </g>
        <g className="hero-cloud hero-cloud-2" fill="#FFFFFF" opacity="0.7">
          <ellipse cx="950" cy="60" rx="56" ry="16" />
          <ellipse cx="990" cy="48" rx="36" ry="12" />
        </g>
        <g className="hero-cloud hero-cloud-3" fill="#FFFFFF" opacity="0.6">
          <ellipse cx="130" cy="220" rx="48" ry="14" />
        </g>

        {/* Chim — đặt ở khoảng trời trống bên phải (gần mặt trời), tránh
            chồng chữ cả trên desktop lẫn mobile (mobile chỉ thấy giữa tranh) */}
        <g
          className="hero-bird"
          stroke="#1B4332"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M950 132 Q 958 124 966 132 Q 974 124 982 132" />
          <path d="M1020 100 Q 1026 94 1032 100 Q 1038 94 1044 100" />
        </g>

        {/* Đồi xa */}
        <path
          d="M0 470 Q 240 420 480 458 T 960 452 T 1440 460 L 1440 620 L 0 620 Z"
          className="hero-hill-far"
        />

        {/* Rừng thông lớp sau */}
        <g className="hero-pines-back">
          {PINES_BACK.map(([x, y, s], i) => (
            <use
              key={i}
              href="#hero-pine"
              transform={`translate(${x} ${y}) scale(${s})`}
            />
          ))}
        </g>

        {/* Lửa trại */}
        <g transform="translate(840 512)">
          <ellipse cx="0" cy="26" rx="34" ry="6" fill="rgba(27,67,50,0.16)" />
          <line x1="-14" y1="22" x2="14" y2="14" stroke="#8B5E34" strokeWidth="5" strokeLinecap="round" />
          <line x1="-14" y1="14" x2="14" y2="22" stroke="#7F5539" strokeWidth="5" strokeLinecap="round" />
          <path
            className="hero-flame"
            d="M0 18 C -9 8 -5 -2 0 -10 C 5 -2 9 8 0 18 Z"
            fill="#F4A261"
          />
          <path
            className="hero-flame"
            d="M0 18 C -5 11 -3 4 0 -1 C 3 4 5 11 0 18 Z"
            fill="#E76F51"
          />
        </g>

        {/* Lều vàng */}
        <g transform="translate(1010 380)">
          <ellipse cx="0" cy="142" rx="118" ry="12" fill="rgba(27,67,50,0.16)" />
          <polygon points="0,0 -108,140 108,140" fill="#F6C445" stroke="#1B4332" strokeWidth="4" strokeLinejoin="round" />
          <polygon points="0,0 -108,140 0,140" fill="#F2B705" opacity="0.55" />
          <polygon className="hero-door" points="0,62 -30,140 30,140" />
          <line x1="0" y1="0" x2="0" y2="62" stroke="#1B4332" strokeWidth="3" />
          <line x1="0" y1="0" x2="0" y2="-18" stroke="#1B4332" strokeWidth="3" strokeLinecap="round" />
          <polygon className="hero-flag" points="0,-18 20,-12 0,-6" fill="#E76F51" />
        </g>

        {/* Rừng thông lớp trước */}
        <g className="hero-pines-front">
          {PINES_FRONT.map(([x, y, s], i) => (
            <use
              key={i}
              href="#hero-pine"
              transform={`translate(${x} ${y}) scale(${s})`}
            />
          ))}
        </g>

        {/* Cỏ trước */}
        <path
          d="M0 560 Q 360 530 720 556 T 1440 552 L 1440 620 L 0 620 Z"
          className="hero-grass"
        />
      </svg>

      {/* Nội dung */}
      <div className="relative z-10 mx-auto max-w-[1200px] px-4 pt-16 pb-[210px] sm:px-6 md:pt-24 md:pb-[340px]">
        <p className="hero-eyebrow text-xs font-bold tracking-[0.22em] uppercase sm:text-sm">
          Đồ cắm trại — Chuẩn bị cho chuyến đi tiếp theo
        </p>
        <h1 className="hero-title mt-4 max-w-[560px] font-[Be_Vietnam_Pro,Inter,sans-serif] text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Ra ngoài trời, sống trọn từng khoảnh khắc
        </h1>
        <p className="hero-sub mt-4 max-w-[480px] text-base leading-relaxed sm:text-lg">
          Lều, bếp, đèn và mọi thứ bạn cần cho một đêm dưới bầu trời sao.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/shop"
            className="hero-cta-primary inline-flex min-h-12 items-center rounded-full px-7 py-3 text-base font-bold shadow-lg transition hover:-translate-y-0.5 focus:outline-2 focus:outline-offset-2"
          >
            Mua sắm ngay
          </Link>
          <Link
            to="/shop"
            className="hero-cta-secondary inline-flex min-h-12 items-center rounded-full px-7 py-3 text-base font-bold transition hover:-translate-y-0.5 focus:outline-2 focus:outline-offset-2"
          >
            Xem bộ sưu tập
          </Link>
        </div>
        <p className="hero-stats mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold">
          <span>28 sản phẩm</span>
          <span aria-hidden="true">·</span>
          <span>8 danh mục</span>
          <span aria-hidden="true">·</span>
          <span>Miễn phí vận chuyển từ 500.000₫</span>
        </p>
      </div>
    </section>
  )
}
