import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Hero3D from '../components/Hero3D'
import ProductCard from '../components/ProductCard'
import {
  CATEGORIES,
  getActiveProducts,
  resolveImage,
} from '../data/products'
import type { Category, Product } from '../data/types'
import { getCategories, getProducts } from '../lib/api'

/**
 * Ảnh đại diện cho từng danh mục (file ảnh riêng trong public/images/).
 * Dùng ảnh của 1 sản phẩm tiêu biểu trong danh mục đó; resolveImage()
 * thêm BASE_URL nên chạy đúng cả trên GitHub Pages (/camping-shop/).
 */
const CATEGORY_COVERS: Record<number, string> = {
  1: '/images/leu-trai-2-nguoi.jpg',
  2: '/images/tui-ngu-mua-dong.jpg',
  3: '/images/bep-ga-mini.jpg',
  4: '/images/den-long-led.jpg',
  5: '/images/ba-lo-leo-nui-65l.jpg',
  6: '/images/ghe-xep-da-ngoai.jpg',
  7: '/images/ao-khoac-chong-nuoc.jpg',
  8: '/images/dao-da-nang.jpg',
}

/**
 * Trang chủ — hero 3D (ThreeUI LandscapeScene, variant hoàng hôn) qua
 * component Hero3D; bên dưới giữ nguyên danh mục + sản phẩm nổi bật.
 * Màu theo DESIGN-SYSTEM.md: rừng #2D6A4F / #1B4332, CTA đất nung #C05621,
 * nền kem #FAF6EC, font Be Vietnam Pro (tiêu đề) / Inter (thân bài).
 * Màu viết bằng token theme (bg-background, text-foreground,
 * text-primary-text...) để dark mode tự đổi theo .dark — KHÔNG dùng hex
 * hardcode ở trang này (hex hardcode làm chữ tối kẹt trên nền sáng khi
 * class .dark đổi biến --color-foreground, xem sửa 2026-11-27).
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

  const allProducts = apiProducts ?? getActiveProducts()

  // Số sản phẩm đang bán của từng danh mục (hiện trên thẻ danh mục).
  const productCountByCategory = useMemo(() => {
    const counts = new Map<number, number>()
    for (const p of allProducts) {
      if (!p.id_category) continue
      counts.set(p.id_category, (counts.get(p.id_category) ?? 0) + 1)
    }
    return counts
  }, [allProducts])

  // Sản phẩm nổi bật: đang bán, xếp theo rating cao nhất rồi lấy 8 món.
  const featured = useMemo(
    () =>
      [...allProducts]
        .sort((a, b) => b.rating - a.rating || b.price - a.price)
        .slice(0, 8),
    [allProducts],
  )

  return (
    <main className="bg-background text-foreground">
      {/* Hero 3D — cảnh hoàng hôn ThreeUI, tự fallback ảnh tĩnh khi không có WebGL */}
      <Hero3D />

      {/* Danh mục nổi bật — thẻ ảnh: ảnh đại diện + tên + số sản phẩm.
          KHÔNG dùng animation khi cuộn cho phần này (theo yêu cầu): tiêu
          đề và các thẻ luôn hiện sẵn, chỉ giữ hiệu ứng hover.
          Bấm vào lọc tới /shop?category=id */}
      <section className="mx-auto max-w-[1200px] px-4 pt-10 pb-12 sm:px-6 md:pt-14 md:pb-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-[Be_Vietnam_Pro,Inter,sans-serif] text-2xl font-bold text-foreground">
              Danh mục nổi bật
            </h2>
            <p className="mt-2 text-muted-foreground">
              Chọn danh mục để xem sản phẩm phù hợp với chuyến đi của bạn.
            </p>
          </div>
          <Link
            to="/shop"
            className="font-medium text-primary-text underline-offset-4 hover:underline focus:outline-2 focus:outline-ring"
          >
            Xem tất cả →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => {
            const count = productCountByCategory.get(category.id) ?? 0
            const cover = CATEGORY_COVERS[category.id]
            return (
              <Link
                key={category.id}
                to={`/shop?category=${category.id}`}
                className="group overflow-hidden rounded-[24px] border border-border bg-surface shadow-[0_1px_3px_rgba(27,67,50,0.08)] transition duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(27,67,50,0.18)] focus:outline-2 focus:outline-offset-2 focus:outline-ring"
              >
                {cover && (
                  <div className="overflow-hidden">
                    <img
                      src={resolveImage(cover)}
                      alt={category.name}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition duration-500 ease-out group-hover:scale-105"
                    />
                  </div>
                )}
                {/* Thẻ danh mục: tên chiếm trọn chiều rộng thẻ, chip số
                    sản phẩm xuống dòng riêng — trên điện thoại lưới 2 cột
                    hẹp (~170px/thẻ), để tên và chip chung 1 dòng sẽ bóp
                    tên thành 4–5 dòng, thẻ cao thấp không đều (sửa
                    2026-11-27). */}
                <div className="p-4 sm:p-5">
                  <h3 className="font-[Be_Vietnam_Pro,Inter,sans-serif] text-base leading-snug font-bold text-foreground sm:text-lg">
                    {category.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-primary-text">
                      {count} sản phẩm
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-primary-text">
                    Xem sản phẩm{' '}
                    <span
                      aria-hidden="true"
                      className="inline-block transition duration-300 ease-out group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Sản phẩm nổi bật */}
      <section className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              data-aos="fade-up"
              className="font-[Be_Vietnam_Pro,Inter,sans-serif] text-2xl font-bold text-foreground"
            >
              Sản phẩm nổi bật
            </h2>
            <p className="mt-2 text-muted-foreground">
              Được đánh giá cao nhất bởi khách cắm trại.
            </p>
          </div>
          <Link
            to="/shop"
            className="font-medium text-primary-text underline-offset-4 hover:underline focus:outline-2 focus:outline-ring"
          >
            Xem tất cả →
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="mt-6 rounded-[20px] border border-border bg-surface p-6 text-center text-muted-foreground">
            Chưa có sản phẩm nổi bật. Vui lòng quay lại sau hoặc{' '}
            <Link to="/shop" className="font-medium text-primary-text underline">
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
