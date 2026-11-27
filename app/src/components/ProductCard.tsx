import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../data/types'
import { formatPrice, getCategoryById, resolveImage } from '../data/products'

/**
 * Thêm vào giỏ:
 * - Chưa có CartContext (thư mục src/context/ đang trống, agent khác phụ trách).
 *   Tạm thời phát custom event 'add-to-cart' để CartContext / CartPage sau này
 *   lắng nghe: window.addEventListener('add-to-cart', e => ...).
 *   Khi CartContext có sẵn, thay dispatchEvent bằng useCart().addItem(product.id, 1).
 * - Chi tiết event: { productId: number, quantity: number }.
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
  const [added, setAdded] = useState(false)
  const category = product.id_category
    ? getCategoryById(product.id_category)
    : undefined
  const outOfStock = product.quantity <= 0

  const handleAddToCart = () => {
    if (outOfStock) return
    dispatchAddToCart(product.id, 1)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2000)
  }

  return (
    <article
      data-aos="fade-up"
      data-aos-delay={(index % 4) * 100}
      className="flex flex-col overflow-hidden rounded-[20px] border border-[#DDD5BD] bg-white shadow-[0_1px_3px_rgba(27,67,50,0.08)] transition duration-250 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(27,67,50,0.16)]"
    >
      <Link to={`/product/${product.id}`} className="block focus:outline-2 focus:outline-[#2D6A4F]">
        <img
          src={resolveImage(product.image)}
          alt={product.name}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover"
        />
      </Link>

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
          className="mt-auto min-h-11 w-full cursor-pointer rounded-xl bg-[#2D6A4F] px-4 py-2.5 font-medium text-white transition duration-250 ease-out hover:bg-[#1B4332] focus:outline-2 focus:outline-offset-2 focus:outline-[#2D6A4F] disabled:cursor-not-allowed disabled:bg-[#EFE9D8] disabled:text-[#5A6B5A]"
        >
          {outOfStock ? 'Hết hàng' : added ? 'Đã thêm vào giỏ ✓' : 'Thêm vào giỏ'}
        </button>
      </div>
    </article>
  )
}
