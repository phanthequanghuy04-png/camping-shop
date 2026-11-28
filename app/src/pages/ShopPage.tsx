import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Pagination from '../components/Pagination'
import ProductCard from '../components/ProductCard'
import SearchAutocomplete from '../components/SearchAutocomplete'
import {
  CATEGORIES,
  getActiveProducts,
  getCategoryById,
} from '../data/products'
import type { Category, Product } from '../data/types'
import { getCategories, getProducts, normalizeSearch } from '../lib/api'
import { scrollToElement } from '../lib/animations'

type SortOrder = 'default' | 'price-asc' | 'price-desc'

/** Số sản phẩm mỗi trang phân trang Lucian #449 (78 sản phẩm → 7 trang). */
const PAGE_SIZE = 12

/**
 * Trang cửa hàng.
 * - Đọc query ?category= và ?q= từ URL (giữ hành vi tìm kiếm ?q= như dự án cũ).
 * - Lọc theo danh mục + từ khóa (chỉ sản phẩm status = 1), sắp xếp theo giá.
 * - Dữ liệu: thử gọi API trước (GET /api/products + /api/categories);
 *   API lỗi/chưa chạy thì fallback về products.ts local (không vỡ trang).
 * - Lưới: 1 cột mobile → 2 tablet → 3-4 desktop.
 */
export default function ShopPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category') ?? ''
  const qParam = searchParams.get('q') ?? ''
  const [sort, setSort] = useState<SortOrder>('default')
  // null = chưa nạp được từ API (dùng dữ liệu local products.ts).
  const [apiProducts, setApiProducts] = useState<Product[] | null>(null)
  const [apiCategories, setApiCategories] = useState<Category[] | null>(null)

  // Nạp 1 lần khi vào trang: API lỗi thì giữ null -> fallback local.
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
        // API chưa chạy: dùng products.ts như trước.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const allProducts = apiProducts ?? getActiveProducts()
  const allCategories = apiCategories ?? CATEGORIES

  const categoryId = categoryParam ? Number(categoryParam) : null
  const category = categoryId ? getCategoryById(categoryId) : undefined

  const results = useMemo(() => {
    // Tìm không dấu phía client (khớp hành vi ?q= của API).
    let list = allProducts
    if (qParam) {
      const needle = normalizeSearch(qParam)
      list = list.filter((p) =>
        normalizeSearch(`${p.name} ${p.description ?? ''}`).includes(needle),
      )
    }
    if (categoryId) {
      list = list.filter((p) => p.id_category === categoryId)
    }
    if (sort === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price)
    } else if (sort === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price)
    }
    return list
  }, [qParam, categoryId, sort, allProducts])

  // #449 Lucian — phân trang: 12 sản phẩm/trang, trang hiện tại là state
  // local (cố tình KHÔNG đưa vào URL để không xáo trộn ?category= / ?q=).
  // Đổi từ khóa/danh mục/cách sắp xếp thì về trang 1; tổng số trang thu
  // hẹp lại thì kẹp trang hiện tại xuống cho vừa.
  const [page, setPage] = useState(1)
  const gridRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setPage(1)
  }, [qParam, categoryId, sort])
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = results.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )
  const changePage = (next: number) => {
    setPage(next)
    // Cuộn về đầu lưới (chừa 80px cho header thủy tinh).
    scrollToElement(gridRef.current, -80)
  }

  const updateParams = (next: { category?: string; q?: string }) => {
    const params = new URLSearchParams(searchParams)
    if (next.category !== undefined) {
      if (next.category) params.set('category', next.category)
      else params.delete('category')
    }
    if (next.q !== undefined) {
      if (next.q) params.set('q', next.q)
      else params.delete('q')
    }
    setSearchParams(params)
  }

  // #242 Lucian — thanh chip dính khi cuộn: bóng khi dính, viên pill
  // trượt theo chip đang chọn, hàng chip tự cuộn để chip đó luôn thấy được.
  const chipBarRef = useRef<HTMLDivElement>(null)
  const chipRowRef = useRef<HTMLElement>(null)
  const chipPillRef = useRef<HTMLSpanElement>(null)
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [chipBarStuck, setChipBarStuck] = useState(false)
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Bóng khi thanh dính: thanh đang dính khi mép trên của nó chạm ngưỡng
  // top (68px lúc header hiện, 0 lúc header ẩn) — cả hai đều <= 69px.
  useEffect(() => {
    const onScroll = () => {
      const bar = chipBarRef.current
      if (!bar) return
      setChipBarStuck(bar.getBoundingClientRect().top <= 69)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Viên pill trượt theo chip đang chọn + cuộn hàng chip để chip đó
  // luôn thấy được (căn giữa như bản gốc).
  useLayoutEffect(() => {
    const row = chipRowRef.current
    const pill = chipPillRef.current
    if (!row || !pill) return
    const activeIndex = categoryId
      ? allCategories.findIndex((c) => c.id === categoryId) + 1
      : 0
    const chip = chipRefs.current[activeIndex]
    if (!chip) return
    pill.style.width = `${chip.offsetWidth}px`
    pill.style.transform = `translateX(${chip.offsetLeft}px)`
    const chipLeft = chip.offsetLeft
    const chipRight = chipLeft + chip.offsetWidth
    if (chipLeft < row.scrollLeft || chipRight > row.scrollLeft + row.clientWidth) {
      const target = Math.max(
        0,
        Math.min(
          row.scrollWidth - row.clientWidth,
          chipLeft - (row.clientWidth - chip.offsetWidth) / 2,
        ),
      )
      row.scrollTo({
        left: target,
        behavior: reducedMotion ? 'auto' : 'smooth',
      })
    }
  }, [categoryId, allCategories, reducedMotion])

  useEffect(() => {
    const onResize = () => {
      const row = chipRowRef.current
      const pill = chipPillRef.current
      if (!row || !pill) return
      const activeIndex = categoryId
        ? allCategories.findIndex((c) => c.id === categoryId) + 1
        : 0
      const chip = chipRefs.current[activeIndex]
      if (!chip) return
      pill.style.width = `${chip.offsetWidth}px`
      pill.style.transform = `translateX(${chip.offsetLeft}px)`
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [categoryId, allCategories])

  return (
    <main className="shop-page bg-[#FAF6EC] text-[#1C2B1F]">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 md:py-12">
        <h1
          data-aos="fade-up"
          className="font-[Be_Vietnam_Pro,Inter,sans-serif] text-3xl font-bold text-[#1B4332]"
        >
          Cửa hàng
        </h1>
        <p className="mt-2 text-[#5A6B5A]">
          {category
            ? `Danh mục: ${category.name}`
            : 'Tất cả đồ cắm trại — lều, túi ngủ, bếp, đèn, ba lô và phụ kiện.'}
          {qParam && (
            <>
              {' '}· Từ khóa: “<span className="font-medium text-[#1C2B1F]">{qParam}</span>”
            </>
          )}
        </p>

        {/* Tìm kiếm + sắp xếp — ô tìm kiếm là #429 Lucian (gợi ý tự động) */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchAutocomplete
            value={qParam}
            onChange={(v) => updateParams({ q: v })}
            products={allProducts}
            categories={allCategories}
            onSelect={(p) => navigate(`/product/${p.id}`)}
            placeholder="Tìm lều, túi ngủ, bếp, đèn..."
            className="flex-1"
          />
          <label className="flex items-center gap-2 text-sm font-medium text-[#5A6B5A]">
            Sắp xếp
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOrder)}
              className="min-h-11 cursor-pointer rounded-xl border border-[#DDD5BD] bg-white px-3 py-2.5 text-[#1C2B1F] focus:border-[#2D6A4F] focus:outline-2 focus:outline-[#2D6A4F]"
            >
              <option value="default">Mặc định</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
            </select>
          </label>
        </div>

        {/* Lọc theo danh mục — #242 Lucian: thanh chip dính khi cuộn, viên
            pill trượt theo chip đang chọn, hàng tự cuộn để chip đó thấy được.
            Bấm chip để lọc (như trước), không phải để cuộn tới mục. */}
        <div
          ref={chipBarRef}
          className={`u242-cb mt-4${chipBarStuck ? ' is-stuck' : ''}`}
        >
          <nav
            className="u242-cr"
            ref={chipRowRef}
            aria-label="Lọc theo danh mục"
          >
            <span className="u242-ul" ref={chipPillRef} aria-hidden="true" />
            <button
              type="button"
              ref={(el) => {
                chipRefs.current[0] = el
              }}
              onClick={() => updateParams({ category: '' })}
              aria-current={!categoryId || undefined}
              className="u242-ch"
            >
              Tất cả
            </button>
            {allCategories.map((c, i) => (
              <button
                key={c.id}
                type="button"
                ref={(el) => {
                  chipRefs.current[i + 1] = el
                }}
                onClick={() => updateParams({ category: String(c.id) })}
                aria-current={categoryId === c.id || undefined}
                className="u242-ch"
              >
                {c.name}
              </button>
            ))}
          </nav>
        </div>

        <p className="mt-6 text-sm text-[#5A6B5A]" role="status">
          Tìm thấy <span className="font-semibold text-[#1C2B1F]">{results.length}</span> sản phẩm
          {category ? ` trong danh mục “${category.name}”` : ''}
          {qParam ? ` khớp với “${qParam}”` : ''}
          {totalPages > 1 ? ` · Trang ${safePage} / ${totalPages}` : ''}.
        </p>

        {results.length === 0 ? (
          <div className="mt-6 rounded-[20px] border border-[#DDD5BD] bg-white p-8 text-center">
            <h2 className="font-[Be_Vietnam_Pro,Inter,sans-serif] text-xl font-bold text-[#1B4332]">
              Không tìm thấy sản phẩm phù hợp
            </h2>
            <p className="mt-2 text-[#5A6B5A]">
              Thử từ khóa khác hoặc chọn danh mục khác nhé.
            </p>
            <Link
              to="/shop"
              onClick={() => setSort('default')}
              className="mt-6 inline-block min-h-11 rounded-xl bg-[#2D6A4F] px-5 py-2.5 font-medium text-white transition hover:bg-[#1B4332] focus:outline-2 focus:outline-offset-2 focus:outline-[#2D6A4F]"
            >
              Xem tất cả sản phẩm
            </Link>
          </div>
        ) : (
          <>
            <div
              ref={gridRef}
              className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {pageItems.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <Pagination
                  totalPages={totalPages}
                  currentPage={safePage}
                  onPageChange={changePage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
