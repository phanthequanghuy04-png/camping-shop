import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { dispatchAddToCart } from '../components/ProductCard'
import {
  formatPrice,
  getCategoryById,
  getProductById,
  getProductsByCategory,
  resolveImage,
} from '../data/products'
import type { Product } from '../data/types'
import { getProduct, getProducts } from '../lib/api'
import { useCart } from '../context/CartContext'
import { flyToCart } from '../lib/flyToCart'
import { showToast } from '../lib/toast'

/**
 * Trang chi tiết sản phẩm.
 * - Đọc :id từ URL, hiện ảnh lớn, tên, giá VND, mô tả, rating, tồn kho.
 * - Chọn số lượng, nút "Thêm vào giỏ" và "Mua ngay" (tới /cart).
 * - Thêm vào giỏ dùng custom event 'add-to-cart' (xem ProductCard.tsx):
 *   chưa có CartContext (src/context/ đang trống), CartContext sau này
 *   chỉ cần lắng nghe event này là giỏ hoạt động, không cần sửa file này.
 * - Sản phẩm liên quan: cùng danh mục, đang bán, tối đa 4 món.
 */
export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { openDrawer } = useCart()
  const imgRef = useRef<HTMLImageElement>(null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  // Sản phẩm: thử API trước (lấy tồn kho mới nhất), lỗi thì dùng local.
  const [apiProduct, setApiProduct] = useState<Product | null | undefined>(
    undefined,
  )
  const [apiRelated, setApiRelated] = useState<Product[] | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      try {
        const product = await getProduct(Number(id))
        if (cancelled) return
        setApiProduct(product)
        if (product.id_category) {
          const sameCategory = await getProducts({
            category: product.id_category,
          })
          if (!cancelled) {
            setApiRelated(
              sameCategory.filter((p) => p.id !== product.id).slice(0, 4),
            )
          }
        }
      } catch {
        if (!cancelled) setApiProduct(null) // fallback local bên dưới
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  // apiProduct: undefined = đang chờ API; null = API lỗi -> dùng local.
  const product =
    apiProduct === undefined
      ? id
        ? getProductById(Number(id))
        : undefined
      : (apiProduct ?? (id ? getProductById(Number(id)) : undefined))

  if (!product) {
    return (
      <main className="mx-auto max-w-3xl bg-[#FAF6EC] px-4 py-16 text-center text-[#1C2B1F]">
        <h1 className="font-[Be_Vietnam_Pro,Inter,sans-serif] text-3xl font-bold text-[#1B4332]">
          Không tìm thấy sản phẩm
        </h1>
        <p className="mt-4 text-[#5A6B5A]">
          Sản phẩm bạn vừa mở không tồn tại hoặc đã ngừng bán.
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-block min-h-11 rounded-xl bg-[#2D6A4F] px-5 py-2.5 font-medium text-white transition hover:bg-[#1B4332] focus:outline-2 focus:outline-offset-2 focus:outline-[#2D6A4F]"
        >
          Về cửa hàng
        </Link>
      </main>
    )
  }

  const category = product.id_category
    ? getCategoryById(product.id_category)
    : undefined
  const outOfStock = product.quantity <= 0
  const maxQuantity = Math.max(1, product.quantity)
  const related =
    apiRelated ??
    (product.id_category
      ? getProductsByCategory(product.id_category)
          .filter((p) => p.id !== product.id)
          .slice(0, 4)
      : [])

  const handleAddToCart = () => {
    if (outOfStock) return
    dispatchAddToCart(product.id, quantity)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1400)
    // #442 — ảnh bay vào giỏ, xong thì mở ngăn giỏ (#240).
    flyToCart(resolveImage(product.image), imgRef.current, () =>
      openDrawer(product.id),
    )
    showToast('Đã thêm vào giỏ')
  }

  const handleBuyNow = () => {
    if (outOfStock) return
    dispatchAddToCart(product.id, quantity)
    navigate('/cart')
  }

  return (
    <main className="bg-[#FAF6EC] text-[#1C2B1F]">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 md:py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-[#5A6B5A]">
          <Link to="/" className="hover:text-[#2D6A4F] hover:underline">
            Trang chủ
          </Link>
          {' / '}
          <Link to="/shop" className="hover:text-[#2D6A4F] hover:underline">
            Cửa hàng
          </Link>
          {category && (
            <>
              {' / '}
              <Link
                to={`/shop?category=${category.id}`}
                className="hover:text-[#2D6A4F] hover:underline"
              >
                {category.name}
              </Link>
            </>
          )}
          {' / '}
          <span className="font-medium text-[#1C2B1F]">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div data-aos="fade-right">
            <img
              ref={imgRef}
              src={resolveImage(product.image)}
              alt={product.name}
              className="aspect-[4/3] w-full rounded-[24px] object-cover shadow-[0_8px_32px_rgba(27,67,50,0.12)]"
            />
            <p className="mt-3 text-sm text-[#5A6B5A]">
              Ảnh minh họa — ảnh mẫu Unsplash, sẽ thay bằng ảnh thật của sản phẩm.
            </p>
          </div>

          <div data-aos="fade-left" data-aos-delay="100">
            {category && (
              <span className="inline-block rounded-lg bg-[#D8F3DC] px-2 py-0.5 text-xs font-medium text-[#1B4332]">
                {category.name}
              </span>
            )}
            <h1 className="mt-3 font-[Be_Vietnam_Pro,Inter,sans-serif] text-3xl leading-tight font-bold text-[#1B4332]">
              {product.name}
            </h1>

            <p className="mt-3 flex items-center gap-1 text-sm text-[#5A6B5A]" aria-label={`Đánh giá ${product.rating} trên 5`}>
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5 text-[#C68A4B]">
                <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
              </svg>
              <span className="font-semibold text-[#1C2B1F]">{product.rating.toFixed(1)}</span>
              <span>/ 5</span>
            </p>

            <p className="mt-4 font-[Be_Vietnam_Pro,Inter,sans-serif] text-3xl font-bold text-[#2D6A4F]">
              {formatPrice(product.price)}
            </p>

            <p className="mt-4 leading-relaxed text-[#5A6B5A]">
              {product.description ?? 'Chưa có mô tả cho sản phẩm này.'}
            </p>

            <p className="mt-4 text-sm">
              Tình trạng:{' '}
              {outOfStock ? (
                <span className="font-medium text-[#B91C1C]">Hết hàng</span>
              ) : product.quantity <= 5 ? (
                <span className="font-medium text-[#B45309]">
                  Sắp hết hàng — chỉ còn {product.quantity} sản phẩm
                </span>
              ) : (
                <span className="font-medium text-[#2D6A4F]">
                  Còn hàng — {product.quantity} sản phẩm
                </span>
              )}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                Số lượng
                <span className="flex items-center rounded-xl border border-[#DDD5BD] bg-white">
                  <button
                    type="button"
                    aria-label="Giảm số lượng"
                    disabled={quantity <= 1 || outOfStock}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="min-h-11 min-w-11 cursor-pointer px-3 text-lg disabled:cursor-not-allowed disabled:text-[#5A6B5A] focus:outline-2 focus:outline-[#2D6A4F]"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center" aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Tăng số lượng"
                    disabled={quantity >= maxQuantity || outOfStock}
                    onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                    className="min-h-11 min-w-11 cursor-pointer px-3 text-lg disabled:cursor-not-allowed disabled:text-[#5A6B5A] focus:outline-2 focus:outline-[#2D6A4F]"
                  >
                    +
                  </button>
                </span>
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="min-h-11 flex-1 cursor-pointer rounded-xl bg-[#2D6A4F] px-5 py-3 font-medium text-white transition hover:bg-[#1B4332] focus:outline-2 focus:outline-offset-2 focus:outline-[#2D6A4F] disabled:cursor-not-allowed disabled:bg-[#EFE9D8] disabled:text-[#5A6B5A]"
              >
                {outOfStock ? 'Hết hàng' : added ? 'Đã thêm vào giỏ ✓' : 'Thêm vào giỏ'}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={outOfStock}
                className="min-h-11 flex-1 cursor-pointer rounded-full bg-[#C05621] px-5 py-3 font-medium text-white transition hover:bg-[#9C4221] focus:outline-2 focus:outline-offset-2 focus:outline-[#2D6A4F] disabled:cursor-not-allowed disabled:bg-[#EFE9D8] disabled:text-[#5A6B5A]"
              >
                Mua ngay
              </button>
            </div>
            {added && (
              <p className="mt-3 text-sm font-medium text-[#2D6A4F]" role="status">
                Đã thêm {quantity} × “{product.name}” vào giỏ hàng.
              </p>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16" data-aos="fade-up">
            <h2 className="font-[Be_Vietnam_Pro,Inter,sans-serif] text-2xl font-bold text-[#1B4332]">
              Sản phẩm liên quan
            </h2>
            <p className="mt-2 text-[#5A6B5A]">
              Cùng danh mục {category ? `“${category.name}”` : ''} — có thể bạn cũng thích.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
