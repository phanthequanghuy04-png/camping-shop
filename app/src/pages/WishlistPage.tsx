/**
 * Trang Sản phẩm yêu thích — liệt kê các sản phẩm đã bấm tim (#441).
 * Đọc từ localStorage `camping-wishlist`, cập nhật trực tiếp khi bấm
 * tim/bỏ tim ở bất kỳ đâu (sự kiện 'camping-wishlist-changed').
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { products } from '../data/products'
import { loadWishlist } from '../lib/wishlist'

export default function WishlistPage() {
  const [ids, setIds] = useState<number[]>(() => loadWishlist())

  useEffect(() => {
    const sync = () => setIds(loadWishlist())
    window.addEventListener('camping-wishlist-changed', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('camping-wishlist-changed', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const wished = products.filter((p) => ids.includes(p.id))

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-emerald-900 sm:text-3xl">
        Sản phẩm yêu thích
      </h1>
      <p className="mt-2 text-gray-600">
        {wished.length === 0
          ? 'Bạn chưa lưu sản phẩm nào.'
          : `${wished.length} sản phẩm đã lưu`}
      </p>

      {wished.length === 0 ? (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-5xl" aria-hidden="true">
            ♡
          </p>
          <p className="mt-4 text-gray-600">
            Bấm vào biểu tượng tim trên thẻ sản phẩm để lưu lại món bạn thích.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800"
          >
            Xem sản phẩm
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {wished.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </main>
  )
}
