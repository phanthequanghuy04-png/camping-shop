/* Lucian UX/UI Prompt #441 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#441
   Product card (Commerce & Pricing) — port TOÀN BỘ sang React cho Camping Shop.
   DROP-IN REPLACEMENT cho app/src/components/ProductCard.tsx: copy file này
   đè lên ProductCard.tsx (giữ nguyên tên file + import tương đối bên dưới,
   vì chúng được viết theo vị trí app/src/components/).

   File này DỰA VÀO 2 khối CSS:
   - app/src/components/lucian.css, khối "#441 — Nút tim yêu thích + nút Thêm
     morph": toàn bộ .u441-wl (tim, nảy, 6 hạt văng, vòng lan tỏa, keyframes
     u441-heart / u441-burst / u441-ring) và .u441-add (morph, :active,
     > span, > span + span, .is-ok + các trạng thái span). KHÔNG lặp lại
     các luật đó ở đây.
   - _staging/u441-full.css (file kèm theo): khung thẻ, vùng ảnh, thân thẻ,
     tên, giá, hàng (rating + nút Add), tồn kho, chip danh mục, sr-only.

   ADAPTATIONS (so với bản gốc 441.txt — ghi lại đầy đủ):
   1. Không có swatch màu: sản phẩm của shop không có biến thể màu (đã xác
      lập từ đợt port #441 đầu tiên, 2026-11-27) — không port .u441-sw /
      .u441-sws, không có logic setColor / phím mũi tên đổi màu.
   2. Không có % giảm giá / giá gạch ngang: shop không có dữ liệu giá gốc —
      không port .u441-pc .dc / s; chỉ hiện giá thật qua formatPrice().
   3. Không có bình giữ nhiệt SVG / animation bump: vùng ảnh hiện ảnh thật
      của sản phẩm (resolveImage như thẻ hiện tại); không port .u441-pr,
      .u441-pr.is-bump, keyframes u441-bump, ::after (bóng dưới bình).
   4. Khung demo .u441 (340×300, căn giữa) không port: thẻ là item fluid
      trong lưới sản phẩm (grid-cols-1 sm:2 lg:3 xl:4) nên .u441-c rộng
      100%; giữ nguyên bo 22px, padding 8px 8px 12px, bóng gốc.
   5. Vùng ảnh (sửa 2026-11-28, theo yêu cầu chủ shop): aspect-ratio 4/3
      + bo 16px + nền trắng #ffffff ở cả 2 chế độ; ảnh thật object-fit
      contain để TOÀN BỘ sản phẩm hiện đủ, không bị cắt (trước đây height
      150px + cover cắt mất đầu/cuối ảnh studio vuông 1600×1600). Không
      còn gradient radial nền như bản port đầu.
   6. Giữ nguyên tên/giá theo kích thước gốc: tên 15px/650, giá 16px/750.
      Tên giữ line-clamp 2 dòng như thẻ hiện tại (bản gốc không có clamp).
   7. Hàng dưới (.u441-row) giữ đúng cấu trúc gốc (flex, space-between,
      margin-top 12px): ô trái là rating + tồn kho (thay cho cụm swatch),
      ô phải là nút Add pill 36px. Nút Add KHÔNG full-width như thẻ hiện
      tại — đúng bản gốc (min-width 84px, padding 0 16px).
   8. Giữ rating + tồn kho thật của thẻ hiện tại (bản gốc không có):
      rating sao + "x.x / 5", tồn kho "Còn N sản phẩm" / "Sắp hết hàng —
      chỉ còn N sản phẩm" / "Hết hàng"; hết hàng thì Add disabled.
   9. Màu nút Add giữ xanh rừng #2D6A4F (hover #1B4332) như thẻ hiện tại
      thay vì --ux-ink của bản gốc; trạng thái "Đã thêm" dùng .is-ok có
      sẵn trong lucian.css (nền --ux-mint). Chữ "Đã thêm" ở dark mode
      đổi sang --ux-accent-ink (luật trong u441-full.css) để đủ tương phản
      trên nền mint sáng.
   10. Giá + chip danh mục + hover tên dùng token --color-primary-text /
       --color-primary-soft (token chữ/nền xanh của shop, tự đổi theo
       .dark); sao rating dùng --ux-warn thay vì hex #C68A4B hardcode của
       thẻ hiện tại. Không còn hex hardcode nào ngoài 2 xanh thương hiệu
       #2D6A4F / #1B4332 của nút Add.
   11. Giảm chuyển động: 441.txt KHÔNG có luật CSS prefers-reduced-motion
       (chỉ có fallback JS: timeout morph 900ms thay vì 1400ms) — port
       đúng fallback này (kèm clearTimeout + dọn timer khi unmount).
   12. Thẻ là flex column, thân thẻ flex:1, hàng dưới margin-top:auto
       (giữ khoảng 12px bằng padding-top) để nút Add luôn dính đáy thẻ
       khi các thẻ trong cùng một hàng lưới cao không đều — hành vi của
       thẻ hiện tại (mt-auto), bản gốc là thẻ đơn lẻ nên không có.
   13. Thêm vùng live sr-only (role="status") như bản gốc để đọc thông
       báo "Đã thêm vào giỏ" / yêu thích cho trình đọc màn hình (thẻ hiện
       tại chỉ dùng toast).
   14. Focus-visible cho tim + Add lấy từ bản gốc (scope .u441 → .u441-c,
       vì không còn khung demo .u441); tim + Add vẫn là <button> có
       aria-label / aria-pressed như thẻ hiện tại.
   15. Thẻ hiện bằng data-aos fade (chỉ mờ dần, KHÔNG trượt lên — fade-up trượt 100px làm bấm nhầm sang trang chi tiết khi bấm ngay lúc thẻ đang hiện ra, đã đo được 2026-11-28) + data-aos-delay theo index, event
       'add-to-cart' (dispatchAddToCart), flyToCart (#442) + mở ngăn giỏ
       (#240) và toast như thẻ hiện tại.
*/
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Product } from '../data/types'
import { formatPrice, getCategoryById, resolveImage } from '../data/products'
import { useCart } from '../context/CartContext'
import { isWishlisted, toggleWishlist } from '../lib/wishlist'
import { flyToCart } from '../lib/flyToCart'
import { showToast } from '../lib/toast'
import { requireLogin } from '../lib/requireLogin'

/**
 * Thêm vào giỏ (giữ export này cho ProductDetailPage):
 * phát custom event 'add-to-cart' để CartContext lắng nghe.
 * ProductCard tự dùng useCart().addToCart trực tiếp (đã có CartProvider).
 */
export function dispatchAddToCart(productId: number, quantity = 1): void {
  window.dispatchEvent(
    new CustomEvent('add-to-cart', { detail: { productId, quantity } }),
  )
}

interface ProductCardProps {
  product: Product
  /** Vị trí trong lưới — dùng để so le data-aos-delay (0 / 100 / 200 / 300 ms). */
  index?: number
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart, openDrawer } = useCart()
  const navigate = useNavigate()
  const [added, setAdded] = useState(false)
  // #441 Lucian — tim yêu thích (lưu localStorage, giữ qua các lần vào web).
  const [wished, setWished] = useState(() => isWishlisted(product.id))
  const [burstKey, setBurstKey] = useState(0)
  const [liveMessage, setLiveMessage] = useState('')
  const imgRef = useRef<HTMLImageElement>(null)
  const addTimer = useRef<number | undefined>(undefined)
  const category = product.id_category
    ? getCategoryById(product.id_category)
    : undefined
  const outOfStock = product.quantity <= 0

  // Dọn timer morph khi unmount (bản gốc chỉ clearTimeout khi bấm lại).
  useEffect(() => () => window.clearTimeout(addTimer.current), [])

  const handleWishlist = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Chặn bấm lan lên thẻ cha: bấm tim chỉ đổi yêu thích, không bao giờ
    // nhảy sang trang chi tiết.
    e.stopPropagation()
    // Yêu thích cần đăng nhập: khách vãng lai được chuyển sang /login.
    if (!requireLogin(navigate, 'lưu vào yêu thích')) return
    const next = toggleWishlist(product.id)
    setWished(next)
    if (next) setBurstKey((k) => k + 1)
    setLiveMessage(next ? 'Đã lưu vào yêu thích' : 'Đã bỏ khỏi yêu thích')
    showToast(next ? 'Đã lưu vào yêu thích' : 'Đã bỏ khỏi yêu thích')
  }

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Chặn bấm lan lên thẻ cha: bấm Thêm chỉ thêm vào giỏ, không bao giờ
    // nhảy sang trang chi tiết.
    e.stopPropagation()
    if (outOfStock) return
    // Thêm vào giỏ cần đăng nhập: khách vãng lai được chuyển sang /login.
    if (!requireLogin(navigate, 'thêm vào giỏ hàng')) return
    addToCart(product.id, 1)
    // #441 — nút morph thành tick "Đã thêm" nền xanh mint; bản gốc:
    // 1400ms sau trở lại, 900ms khi bật prefers-reduced-motion.
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    setAdded(true)
    window.clearTimeout(addTimer.current)
    addTimer.current = window.setTimeout(
      () => setAdded(false),
      reducedMotion ? 900 : 1400,
    )
    setLiveMessage('Đã thêm vào giỏ')
    // #442 — ảnh bay vào giỏ, xong thì mở ngăn giỏ (#240) với món mới nhấp nháy.
    flyToCart(resolveImage(product.image), imgRef.current, () =>
      openDrawer(product.id),
    )
    showToast('Đã thêm vào giỏ')
  }

  return (
    <article
      data-aos="fade"
      data-aos-delay={(index % 4) * 100}
      className="u441-c"
    >
      <div className="u441-img">
        <Link
          to={`/product/${product.id}`}
          aria-label={product.name}
          className="focus:outline-2 focus:outline-ring"
        >
          <img
            ref={imgRef}
            src={resolveImage(product.image)}
            alt={product.name}
            loading="lazy"
            decoding="async"
          />
        </Link>
        {/* #441 — tim yêu thích: bấm thì tim đầy + nảy, 6 hạt văng ra + vòng lan tỏa. */}
        <button
          type="button"
          className={`u441-wl${wished && burstKey > 0 ? ' is-burst' : ''}`}
          aria-pressed={wished}
          aria-label={wished ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
          onClick={handleWishlist}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z" />
          </svg>
          <i key={`ring-${burstKey}`} />
          <b key={`d0-${burstKey}`} style={{ '--a': '0deg' } as React.CSSProperties} />
          <b key={`d1-${burstKey}`} style={{ '--a': '60deg', '--c': 'var(--ux-warn)' } as React.CSSProperties} />
          <b key={`d2-${burstKey}`} style={{ '--a': '120deg' } as React.CSSProperties} />
          <b key={`d3-${burstKey}`} style={{ '--a': '180deg', '--c': 'var(--ux-warn)' } as React.CSSProperties} />
          <b key={`d4-${burstKey}`} style={{ '--a': '240deg' } as React.CSSProperties} />
          <b key={`d5-${burstKey}`} style={{ '--a': '300deg', '--c': 'var(--ux-warn)' } as React.CSSProperties} />
        </button>
      </div>

      <div className="u441-bd">
        {category && <span className="u441-ct">{category.name}</span>}

        <Link
          to={`/product/${product.id}`}
          className="focus:outline-2 focus:outline-ring"
        >
          <h3 className="u441-nm">{product.name}</h3>
        </Link>

        <div className="u441-pc">
          <b>{formatPrice(product.price)}</b>
        </div>

        <div className="u441-row">
          <div className="u441-meta">
            <p
              className="u441-rt"
              aria-label={`Đánh giá ${product.rating} trên 5`}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
              </svg>
              <b>{product.rating.toFixed(1)}</b>
              <span>/ 5</span>
            </p>
            <p
              className={`u441-st${outOfStock ? ' is-out' : product.quantity <= 5 ? ' is-low' : ''}`}
            >
              {outOfStock
                ? 'Hết hàng'
                : product.quantity <= 5
                  ? `Sắp hết hàng — chỉ còn ${product.quantity} sản phẩm`
                  : `Còn ${product.quantity} sản phẩm`}
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`u441-add${added ? ' is-ok' : ''}`}
            aria-label={outOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
          >
            {outOfStock ? (
              <span>Hết hàng</span>
            ) : (
              <>
                <span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 6v12M6 12h12" />
                  </svg>
                  Thêm vào giỏ
                </span>
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                  Đã thêm
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Vùng live của bản gốc (role="status") — đọc thông báo thêm giỏ / yêu thích. */}
      <p className="u441-sr" role="status">
        {liveMessage}
      </p>
    </article>
  )
}
