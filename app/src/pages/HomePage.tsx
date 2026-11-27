import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Hero3D from '../components/Hero3D'
import ProductCard from '../components/ProductCard'
import { CATEGORIES, getActiveProducts } from '../data/products'
import type { Category, Product } from '../data/types'
import { getCategories, getProducts } from '../lib/api'

/**
 * Trang chủ — hero 3D (ThreeUI LandscapeScene, variant hoàng hôn) qua
 * component Hero3D; bên dưới giữ nguyên danh mục + sản phẩm nổi bật.
 * Màu theo DESIGN-SYSTEM.md: rừng #2D6A4F / #1B4332, CTA đất nung #C05621,
 * nền kem #FAF6EC, font Be Vietnam Pro (tiêu đề) / Inter (thân bài).
 */
export default function HomePage() {
  // Dữ liệu: thử API trước, lỗi thì fallback products.ts local.
  const [apiProducts, setApiProducts] = useState<Product[] | null>(null)
  const [apiCategories, setApiCategories] = useState<Category[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [products, categories] = await Promise.all([
          getProducts(),
          getCategories(),
        ])
        if (!cancelled) {
          setApiProducts(products)
          setApiCategories(categories)
        }
      } catch {
        // API chưa chạy: dùng dữ liệu local như trước.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const categories = apiCategories ?? CATEGORIES

  // Sản phẩm nổi bật: đang bán, xếp theo rating cao nhất rồi lấy 8 món.
  const featured = useMemo(
    () =>
      [...(apiProducts ?? getActiveProducts())]
        .sort((a, b) => b.rating - a.rating || b.price - a.price)
        .slice(0, 8),
    [apiProducts],
  )

  return (
    <main className="bg-[#FAF6EC] text-[#1C2B1F]">
      {/* Hero 3D — cảnh hoàng hôn ThreeUI, tự fallback ảnh tĩnh khi không có WebGL */}
      <Hero3D />

      {/* Danh mục nổi bật — bấm vào lọc tới /shop?category=id */}
      <section className="mx-auto max-w-[1200px] px-4 pb-12 sm:px-6 md:pb-16">
        <h2
          data-aos="fade-up"
          className="font-[Be_Vietnam_Pro,Inter,sans-serif] text-2xl font-bold text-[#1B4332]"
        >
          Danh mục nổi bật
        </h2>
        <p className="mt-2 text-[#5A6B5A]">
          Chọn danh mục để xem sản phẩm phù hợp với chuyến đi của bạn.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/shop?category=${category.id}`}
              className="rounded-[20px] border border-[#DDD5BD] bg-white p-5 shadow-[0_1px_3px_rgba(27,67,50,0.08)] transition duration-250 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(27,67,50,0.16)] focus:outline-2 focus:outline-offset-2 focus:outline-[#2D6A4F]"
            >
              <h3 className="font-[Be_Vietnam_Pro,Inter,sans-serif] text-lg font-bold text-[#1C2B1F]">
                {category.name}
              </h3>
              <p className="mt-1 text-sm text-[#5A6B5A]">Xem sản phẩm →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Sản phẩm nổi bật */}
      <section className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              data-aos="fade-up"
              className="font-[Be_Vietnam_Pro,Inter,sans-serif] text-2xl font-bold text-[#1B4332]"
            >
              Sản phẩm nổi bật
            </h2>
            <p className="mt-2 text-[#5A6B5A]">
              Được đánh giá cao nhất bởi khách cắm trại.
            </p>
          </div>
          <Link
            to="/shop"
            className="font-medium text-[#2D6A4F] underline-offset-4 hover:underline focus:outline-2 focus:outline-[#2D6A4F]"
          >
            Xem tất cả →
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="mt-6 rounded-[20px] border border-[#DDD5BD] bg-white p-6 text-center text-[#5A6B5A]">
            Chưa có sản phẩm nổi bật. Vui lòng quay lại sau hoặc{' '}
            <Link to="/shop" className="font-medium text-[#2D6A4F] underline">
              xem cửa hàng
            </Link>
            .
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
