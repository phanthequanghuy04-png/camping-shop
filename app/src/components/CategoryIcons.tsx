import type { ReactNode } from 'react'

/**
 * Icon 3D cho "Danh mục nổi bật" (theo yêu cầu của Huy 2026-11-27:
 * thay ảnh đại diện bằng icon 3D, trỏ chuột vào thì icon chuyển động).
 *
 * Mỗi icon là SVG vẽ tay phong cách isometric: mặt sáng / mặt chính /
 * mặt tối tạo chiều sâu + bóng mềm dưới chân. Hiệu ứng hover nằm trong
 * index.css (class .cat3d-*): icon nảy lên + nghiêng nhẹ, bóng thu nhỏ,
 * và mỗi icon có 1 chuyển động riêng (cờ vẫy, lửa nhấp nháy, kim la
 * bàn quay...). Icon là trang trí (aria-hidden), tên danh mục vẫn là
 * chữ trong thẻ nên không cần label riêng.
 */

const TILE_BG: Record<number, string> = {
  1: '#E7F2EA', // Lều trại — xanh lá nhạt
  2: '#DFF3F0', // Túi ngủ — xanh ngọc nhạt
  3: '#FDEEE3', // Bếp — cam nhạt
  4: '#FDF6DE', // Đèn & pin — vàng nhạt
  5: '#E9F1E4', // Ba lô — xanh rêu nhạt
  6: '#F3EDE2', // Bàn ghế — nâu gỗ nhạt
  7: '#E6EFF7', // Quần áo & giày — xanh dương nhạt
  8: '#F2EFE9', // Phụ kiện — đá nhạt
}

export function categoryTileBg(id: number): string {
  return TILE_BG[id] ?? '#EAF4EC'
}

function Shadow({ cx = 60, cy = 102, rx = 34 }: { cx?: number; cy?: number; rx?: number }) {
  return (
    <ellipse
      className="cat3d-shadow"
      cx={cx}
      cy={cy}
      rx={rx}
      ry="7"
      fill="rgba(27,67,50,0.18)"
    />
  )
}

/** 1. Lều trại — lều 2 mặt + cửa cam + cờ trên đỉnh vẫy khi hover. */
function TentIcon() {
  return (
    <g>
      <Shadow />
      {/* Cột cờ + lá cờ vẫy */}
      <line x1="60" y1="28" x2="60" y2="14" stroke="#1B4332" strokeWidth="3" strokeLinecap="round" />
      <polygon className="cat3d-flag" points="60,14 74,18 60,23" fill="#E76F51" />
      {/* Mặt phải lều (sáng hơn) */}
      <polygon points="60,28 94,90 60,90" fill="#40916C" />
      {/* Mặt trái lều (tối) */}
      <polygon points="60,28 26,90 60,90" fill="#1B4332" />
      {/* Gờ nóc */}
      <line x1="60" y1="28" x2="60" y2="90" stroke="#74C69D" strokeWidth="2" />
      {/* Cửa lều */}
      <polygon points="60,62 47,90 73,90" fill="#E76F51" />
      <line x1="60" y1="62" x2="60" y2="90" stroke="#C05621" strokeWidth="1.5" />
    </g>
  )
}

/** 2. Túi ngủ — túi hình nhộng, cuộn trên cùng nảy nhẹ khi hover. */
function SleepingBagIcon() {
  return (
    <g>
      <Shadow />
      {/* Thân túi */}
      <path
        d="M60 20 C 79 20 88 38 88 58 L 88 92 Q 88 101 79 101 L 41 101 Q 32 101 32 92 L 32 58 C 32 38 41 20 60 20 Z"
        fill="#2A9D8F"
      />
      {/* Mặt tối bên phải */}
      <path
        d="M60 20 C 79 20 88 38 88 58 L 88 92 Q 88 101 79 101 L 60 101 L 60 20 Z"
        fill="#1F7A70"
      />
      {/* Khóa kéo giữa */}
      <line x1="60" y1="30" x2="60" y2="96" stroke="#FAF6EC" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="56" y="52" width="8" height="10" rx="2" fill="#E76F51" />
      {/* Cuộn trên cùng */}
      <ellipse className="cat3d-roll" cx="60" cy="27" rx="20" ry="9" fill="#E9C46A" />
      <ellipse cx="60" cy="27" rx="13" ry="5" fill="#F4D35E" />
      {/* Đáy túi */}
      <rect x="40" y="92" width="40" height="6" rx="3" fill="#1B4332" opacity="0.35" />
    </g>
  )
}

/** 3. Bếp & dụng cụ nấu — nồi trên bếp gas, lửa nhấp nháy khi hover. */
function StoveIcon() {
  return (
    <g>
      <Shadow />
      {/* Bình gas mini bên phải */}
      <rect x="86" y="66" width="16" height="28" rx="4" fill="#2D6A4F" />
      <ellipse cx="94" cy="66" rx="8" ry="3.5" fill="#40916C" />
      <rect x="91" y="60" width="6" height="5" fill="#6C757D" />
      <line x1="94" y1="62" x2="76" y2="70" stroke="#6C757D" strokeWidth="2.5" />
      {/* Bếp (chân + mặt bếp) */}
      <rect x="42" y="74" width="36" height="7" rx="2" fill="#343A40" />
      <line x1="46" y1="81" x2="42" y2="94" stroke="#343A40" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="74" y1="81" x2="78" y2="94" stroke="#343A40" strokeWidth="3.5" strokeLinecap="round" />
      {/* Ngọn lửa */}
      <path
        className="cat3d-flame"
        d="M60 74 C 52 66 54 58 60 52 C 66 58 68 66 60 74 Z"
        fill="#F4A261"
      />
      <path
        className="cat3d-flame"
        d="M60 74 C 56 69 57 64 60 60 C 63 64 64 69 60 74 Z"
        fill="#E76F51"
      />
      {/* Nồi */}
      <rect x="38" y="30" width="44" height="26" rx="4" fill="#8D99AE" />
      <rect x="38" y="30" width="44" height="8" rx="4" fill="#ADB5BD" />
      <ellipse cx="60" cy="30" rx="22" ry="6" fill="#CED4DA" />
      <ellipse cx="60" cy="30" rx="14" ry="3.5" fill="#6C757D" />
      {/* Tay cầm nồi */}
      <line x1="38" y1="40" x2="28" y2="40" stroke="#343A40" strokeWidth="4" strokeLinecap="round" />
      <line x1="82" y1="40" x2="92" y2="40" stroke="#343A40" strokeWidth="4" strokeLinecap="round" />
    </g>
  )
}

/** 4. Đèn & pin — đèn lồng, quầng sáng đập nhẹ khi hover. */
function LanternIcon() {
  return (
    <g>
      <Shadow />
      {/* Quầng sáng */}
      <circle className="cat3d-glow" cx="60" cy="58" r="36" fill="#F4D35E" opacity="0.25" />
      {/* Quai xách */}
      <path d="M44 34 Q 60 12 76 34" fill="none" stroke="#1B4332" strokeWidth="4" strokeLinecap="round" />
      {/* Nắp trên */}
      <rect x="45" y="30" width="30" height="9" rx="4" fill="#1B4332" />
      {/* Thân đèn (kính phát sáng) */}
      <path d="M48 39 L 72 39 L 68 82 L 52 82 Z" fill="#F4D35E" />
      <path d="M54 39 L 66 39 L 64 82 L 56 82 Z" fill="#FEEAA8" />
      <line x1="60" y1="39" x2="60" y2="82" stroke="#E9C46A" strokeWidth="2" />
      {/* Đế */}
      <rect x="45" y="82" width="30" height="9" rx="4" fill="#1B4332" />
      {/* Tia sáng */}
      <g className="cat3d-rays" stroke="#E9C46A" strokeWidth="3" strokeLinecap="round">
        <line x1="22" y1="58" x2="30" y2="58" />
        <line x1="90" y1="58" x2="98" y2="58" />
      </g>
    </g>
  )
}

/** 5. Ba lô — nắp trên + túi trước, dây đeo đung đưa khi hover. */
function BackpackIcon() {
  return (
    <g>
      <Shadow />
      {/* Dây đeo vai */}
      <path className="cat3d-strap" d="M42 30 Q 34 16 46 12" fill="none" stroke="#8B5E34" strokeWidth="5" strokeLinecap="round" />
      <path className="cat3d-strap" d="M78 30 Q 86 16 74 12" fill="none" stroke="#8B5E34" strokeWidth="5" strokeLinecap="round" />
      {/* Thân ba lô */}
      <rect x="34" y="28" width="52" height="66" rx="14" fill="#2D6A4F" />
      {/* Nắp trên */}
      <path d="M34 44 Q 60 26 86 44 L 86 34 Q 86 26 78 26 L 42 26 Q 34 26 34 34 Z" fill="#1B4332" />
      {/* Túi bên hông */}
      <rect x="80" y="56" width="12" height="22" rx="5" fill="#74C69D" />
      {/* Túi trước */}
      <rect x="43" y="58" width="34" height="28" rx="7" fill="#40916C" />
      <line x1="43" y1="66" x2="77" y2="66" stroke="#FAF6EC" strokeWidth="2" />
      <rect x="56" y="62" width="8" height="7" rx="2" fill="#E76F51" />
      {/* Quai xách giữa */}
      <path d="M52 28 Q 60 20 68 28" fill="none" stroke="#1B4332" strokeWidth="4" strokeLinecap="round" />
    </g>
  )
}

/** 6. Bàn ghế cắm trại — ghế xếp, rung lắc nhẹ khi hover. */
function ChairIcon() {
  return (
    <g className="cat3d-rock">
      <Shadow cy={100} rx={30} />
      {/* Chân ghế chữ X */}
      <line x1="38" y1="66" x2="56" y2="98" stroke="#6C757D" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="82" y1="66" x2="64" y2="98" stroke="#6C757D" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="44" y1="98" x2="76" y2="98" stroke="#6C757D" strokeWidth="4" strokeLinecap="round" />
      {/* Mặt ghế */}
      <rect x="36" y="58" width="48" height="12" rx="6" fill="#40916C" />
      {/* Tựa lưng */}
      <rect x="38" y="24" width="44" height="36" rx="8" fill="#2D6A4F" transform="rotate(-4 60 42)" />
      <rect x="46" y="30" width="28" height="22" rx="5" fill="#74C69D" transform="rotate(-4 60 42)" />
      {/* Tay vịn */}
      <line x1="32" y1="52" x2="52" y2="52" stroke="#8B5E34" strokeWidth="4" strokeLinecap="round" />
      <line x1="68" y1="52" x2="88" y2="52" stroke="#8B5E34" strokeWidth="4" strokeLinecap="round" />
      <line x1="36" y1="52" x2="38" y2="62" stroke="#8B5E34" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="84" y1="52" x2="82" y2="62" stroke="#8B5E34" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  )
}

/** 7. Quần áo & giày — áo khoác có mũ + giày boot. */
function ClothingIcon() {
  return (
    <g>
      <Shadow />
      {/* Áo khoác */}
      <path d="M48 32 Q 60 18 72 32 Q 66 40 60 40 Q 54 40 48 32 Z" fill="#2A6F97" />
      <path d="M44 38 L 76 38 L 81 84 Q 81 92 73 92 L 47 92 Q 39 92 39 84 Z" fill="#457B9D" />
      <polygon points="44,40 30,54 37,88 45,86" fill="#2A6F97" />
      <polygon points="76,40 90,54 83,88 75,86" fill="#2A6F97" />
      {/* Khóa kéo + túi áo */}
      <line x1="60" y1="42" x2="60" y2="90" stroke="#FAF6EC" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="46" y="66" width="10" height="12" rx="2" fill="#2A6F97" />
      <rect x="64" y="66" width="10" height="12" rx="2" fill="#2A6F97" />
      {/* Giày boot bên phải */}
      <g className="cat3d-boot">
        <path
          d="M84 70 L 96 70 L 96 82 Q 96 86 100 86 L 108 86 Q 112 86 112 90 L 112 94 L 84 94 Z"
          fill="#8B5E34"
        />
        <rect x="84" y="94" width="28" height="4" rx="2" fill="#6C4A2F" />
        <line x1="96" y1="74" x2="96" y2="82" stroke="#FAF6EC" strokeWidth="2" />
      </g>
    </g>
  )
}

/** 8. Phụ kiện — la bàn, kim quay tròn khi hover. */
function CompassIcon() {
  return (
    <g>
      <Shadow />
      {/* Vỏ la bàn */}
      <circle cx="60" cy="60" r="36" fill="#1B4332" />
      <circle cx="60" cy="60" r="29" fill="#FAF6EC" />
      {/* Vạch chia */}
      <g stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round">
        <line x1="60" y1="34" x2="60" y2="40" />
        <line x1="60" y1="80" x2="60" y2="86" />
        <line x1="34" y1="60" x2="40" y2="60" />
        <line x1="80" y1="60" x2="86" y2="60" />
      </g>
      {/* Chữ N */}
      <text x="60" y="50" textAnchor="middle" fontSize="11" fontWeight="800" fill="#E76F51" fontFamily="'Be Vietnam Pro', Inter, sans-serif">
        N
      </text>
      {/* Kim la bàn */}
      <g className="cat3d-needle">
        <polygon points="60,40 66,60 60,80 54,60" fill="#2D6A4F" />
        <polygon points="60,40 66,60 54,60" fill="#E76F51" />
      </g>
      <circle cx="60" cy="60" r="4" fill="#1B4332" />
      {/* Móc carabiner nhỏ */}
      <path d="M88 26 Q 98 26 98 34 Q 98 42 90 42" fill="none" stroke="#8B5E34" strokeWidth="4" strokeLinecap="round" />
    </g>
  )
}

const ICONS: Record<number, () => ReactNode> = {
  1: TentIcon,
  2: SleepingBagIcon,
  3: StoveIcon,
  4: LanternIcon,
  5: BackpackIcon,
  6: ChairIcon,
  7: ClothingIcon,
  8: CompassIcon,
}

export default function CategoryIcon({ id }: { id: number }) {
  const Icon = ICONS[id] ?? TentIcon
  return (
    <svg
      viewBox="0 0 120 120"
      className="cat3d-icon"
      aria-hidden="true"
      focusable="false"
    >
      <Icon />
    </svg>
  )
}
