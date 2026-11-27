import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CategoryIcon, { categoryTileBg } from '../components/CategoryIcons'
import HeroKairn from '../components/HeroKairn'
import HomeCombos from '../components/HomeCombos'
import HomeReviews from '../components/HomeReviews'
import ProductCard from '../components/ProductCard'
import { CATEGORIES, getActiveProducts } from '../data/products'
import type { Category, Product } from '../data/types'
import { getCategories, getProducts } from '../lib/api'

/**
 * Trang chủ — hero kiểu KAIRN (MotionSites, prompt viết lại 2026-11-28):
 * ảnh lều vàng lúc hoàng hôn + tiêu đề lớn bên trái + cụm tile 2×2 bên
 * phải + thẻ câu chuyện + CTA, hiệu ứng vào trang 2,2s.
 * Bên dưới giữ danh mục (icon 3D) + sản phẩm nổi bật, thêm 2 mục mới
 * theo prompt viết lại: "Combo cắm trại" và "Đánh giá khách hàng".
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
    <main className="home-clean text-foreground">
      {/* Hero kiểu KAIRN (2026-11-28): ảnh lều vàng lúc hoàng hôn + tiêu đề
          lớn bên trái + cụm tile 2×2 bên phải + thẻ câu chuyện + CTA.
          HeroIllustrated (tranh SVG) tạm không dùng — file vẫn còn. */}
      <HeroKairn />

      {/* Danh mục nổi bật — thẻ icon 3D (CategoryIcons.tsx, SVG vẽ tay):
          icon nảy lên + nghiêng nhẹ khi trỏ chuột, mỗi icon có chuyển
          động riêng (cờ vẫy, lửa nhấp nháy, kim la bàn quay...).
          KHÔNG dùng animation khi cuộn cho phần này (theo yêu cầu): tiêu
          đề và các thẻ luôn hiện sẵn, chỉ giữ hiệu ứng hover.
          Bấm vào lọc tới /shop?category=id */}
      <section id="danh-muc" className="cv-cats mx-auto max-w-[1200px] scroll-mt-24 px-4 pt-10 pb-12 sm:px-6 md:pt-14 md:pb-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="home-eyebrow text-xs font-bold uppercase">
              Khám phá danh mục
            </p>
            <h2 className="mt-2 font-[Be_Vietnam_Pro,Inter,sans-serif] text-2xl font-bold text-foreground">
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
            return (
              <Link
                key={category.id}
                to={`/shop?category=${category.id}`}
                className="group overflow-hidden rounded-[24px] border border-border bg-surface shadow-[0_1px_3px_rgba(27,67,50,0.08)] transition duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(27,67,50,0.18)] focus:outline-2 focus:outline-offset-2 focus:outline-ring"
              >
                <div
                  className="cat3d-tile relative aspect-[4/3] w-full"
                  style={{ backgroundColor: categoryTileBg(category.id) }}
                >
                  <CategoryIcon id={category.id} />
                  {/* Chip số sản phẩm nằm trên ô icon, chỉ trên điện thoại:
                      lưới 2 cột hẹp (~170px/thẻ) nên để chip cạnh tên
                      sẽ bóp tên thành 4–5 dòng; đưa chip lên ô icon thì
                      tên có trọn chiều rộng thẻ mà thẻ vẫn gọn, không
                      thêm hàng mới. Desktop giữ chip cạnh tên như cũ
                      (sm:hidden ở đây, hidden sm:inline-block ở chip dưới). */}
                  <span className="absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white backdrop-blur-[2px] sm:hidden">
                    {count} sản phẩm
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-[Be_Vietnam_Pro,Inter,sans-serif] text-lg leading-snug font-bold text-foreground">
                      {category.name}
                    </h3>
                    <span className="hidden shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-primary-text sm:inline-block">
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
      <section className="cv-feat mx-auto max-w-[1200px] px-4 pb-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {/* Tiêu đề dùng fade (chỉ mờ dần) thay vì fade-up: fade-up
                trượt tiêu đề từ dưới lên nên giữa hiệu ứng nó chồng
                lên dòng mô tả bên dưới trên điện thoại (sửa 2026-11-27).
                Các thẻ sản phẩm bên dưới vẫn giữ fade-up như cũ. */}
            <p className="home-eyebrow text-xs font-bold uppercase">
              Được yêu thích nhất
            </p>
            <h2
              data-aos="fade"
              className="mt-2 font-[Be_Vietnam_Pro,Inter,sans-serif] text-2xl font-bold text-foreground"
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

      {/* Combo cắm trại + Đánh giá khách hàng — 2 mục mới theo prompt
          KAIRN viết lại (2026-11-28) */}
      <HomeCombos />
      <div className="pb-16">
        <HomeReviews />
      </div>
    </main>
  )
}
