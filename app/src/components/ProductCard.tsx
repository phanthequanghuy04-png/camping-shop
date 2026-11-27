import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../data/types'
import { formatPrice, getCategoryById, resolveImage } from '../data/products'
import { useCart } from '../context/CartContext'
import { isWishlisted, toggleWishlist } from '../lib/wishlist'
import { flyToCart } from '../lib/flyToCart'
import { showToast } from '../lib/toast'

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
  const [added, setAdded] = useState(false)
  // #441 Lucian — tim yêu thích (lưu localStorage, giữ qua các lần vào web).
  const [wished, setWished] = useState(() => isWishlisted(product.id))
  const [burstKey, setBurstKey] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)
  const category = product.id_category
    ? getCategoryById(product.id_category)
    : undefined
  const outOfStock = product.quantity <= 0

  const handleWishlist = () => {
    const next = toggleWishlist(product.id)
    setWished(next)
    if (next) setBurstKey((k) => k + 1)
    showToast(next ? 'Đã lưu vào yêu thích' : 'Đã bỏ khỏi yêu thích')
  }

  const handleAddToCart = () => {
    if (outOfStock) return
    addToCart(product.id, 1)
    // #441 — nút morph thành tick "Đã thêm" nền xanh mint, 1400ms sau trở lại.
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1400)
    // #442 — ảnh bay vào giỏ, xong thì mở ngăn giỏ (#240) với món mới nhấp nháy.
    flyToCart(resolveImage(product.image), imgRef.current, () =>
      openDrawer(product.id),
    )
    showToast('Đã thêm vào giỏ')
  }

  return (
    <article
      data-aos="fade-up"
      data-aos-delay={(index % 4) * 100}
      className="flex flex-col overflow-hidden rounded-[20px] border border-[#DDD5BD] bg-white shadow-[0_1px_3px_rgba(27,67,50,0.08)] transition duration-250 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(27,67,50,0.16)]"
    >
      <div className="relative">
        <Link to={`/product/${product.id}`} className="block focus:outline-2 focus:outline-[#2D6A4F]">
          <img
            ref={imgRef}
            src={resolveImage(product.image)}
            alt={product.name}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
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

      <div className="flex flex-1 flex-col gap-2 p-4">
        {category && (
          <span className="w-fit rounded-lg bg-[#D8F3DC] px-2 py-0.5 text-xs font-medium text-[#1B4332]">
            {category.name}
          </span>
        )}

        <Link to={`/product/${product.id}`} className="focus:outline-2 focus:outline-[#2D6A4F]">
          <h3 className="line-clamp-2 font-[Be_Vietnam_Pro,Inter,sans-serif] text-lg leading-snug font-bold text-[#1C2B1F] hover:text-[#2D6A4F]">
            {product.name}
          </h3>
        </Link>

        <p className="flex items-center gap-1 text-sm text-[#5A6B5A]" aria-label={`Đánh giá ${product.rating} trên 5`}>
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4 text-[#C68A4B]">
            <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
          </svg>
          <span className="font-semibold text-[#1C2B1F]">{product.rating.toFixed(1)}</span>
          <span>/ 5</span>
        </p>

        <p className="font-[Be_Vietnam_Pro,Inter,sans-serif] text-xl font-bold text-[#2D6A4F]">
          {formatPrice(product.price)}
        </p>

        <p className="text-sm text-[#5A6B5A]">
          {outOfStock ? (
            <span className="font-medium text-[#B91C1C]">Hết hàng</span>
          ) : product.quantity <= 5 ? (
            <span className="font-medium text-[#B45309]">Sắp hết hàng — chỉ còn {product.quantity} sản phẩm</span>
          ) : (
            <>Còn {product.quantity} sản phẩm</>
          )}
        </p>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
          className={`u441-add${added ? ' is-ok' : ''} mt-auto min-h-11 w-full cursor-pointer place-items-center rounded-xl bg-[#2D6A4F] px-4 py-2.5 font-medium text-white transition duration-250 ease-out hover:bg-[#1B4332] focus:outline-2 focus:outline-offset-2 focus:outline-[#2D6A4F] disabled:cursor-not-allowed disabled:bg-[#EFE9D8] disabled:text-[#5A6B5A]`}
        >
          {outOfStock ? (
            <span>Hết hàng</span>
          ) : (
            <>
              <span>
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M12 6v12M6 12h12" />
                </svg>
                Thêm vào giỏ
              </span>
              <span aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                </svg>
                Đã thêm
              </span>
            </>
          )}
        </button>
      </div>
    </article>
  )
}
