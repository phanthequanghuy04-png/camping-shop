import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import HeroKairn from '../components/HeroKairn'
import HomeCombos from '../components/HomeCombos'
import HomeReviews from '../components/HomeReviews'
import ProductCard from '../components/ProductCard'
import { getActiveProducts } from '../data/products'
import type { Product } from '../data/types'
import { getProducts } from '../lib/api'

/**
 * Trang chủ — hero kiểu KAIRN (MotionSites, prompt viết lại 2026-11-28):
 * ảnh lều vàng lúc hoàng hôn + tiêu đề lớn bên trái + cụm tile 2×2 bên
 * phải + thẻ câu chuyện + CTA, hiệu ứng vào trang 2,2s.
 * Bên dưới giữ sản phẩm nổi bật, thêm 2 mục mới
 * theo prompt viết lại: "Combo cắm trại" và "Đánh giá khách hàng".
 * Mục "Danh mục nổi bật" đã bỏ 2026-11-28 theo yêu cầu của Huy, thay
 * bằng menu thả sản phẩm #413 trên header (ProductDropdown.tsx);
 * CategoryIcons.tsx không còn dùng ở trang chủ (file vẫn còn).
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

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const products = await getProducts()
        if (!cancelled) setApiProducts(products)
      } catch {
        // API chưa chạy: dùng dữ liệu local như trước.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const allProducts = apiProducts ?? getActiveProducts()

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
