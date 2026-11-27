import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import {
  CATEGORIES,
  getActiveProducts,
  getCategoryById,
} from '../data/products'
import type { Category, Product } from '../data/types'
import { getCategories, getProducts, normalizeSearch } from '../lib/api'

type SortOrder = 'default' | 'price-asc' | 'price-desc'

/**
 * Trang cửa hàng.
 * - Đọc query ?category= và ?q= từ URL (giữ hành vi tìm kiếm ?q= như dự án cũ).
 * - Lọc theo danh mục + từ khóa (chỉ sản phẩm status = 1), sắp xếp theo giá.
 * - Dữ liệu: thử gọi API trước (GET /api/products + /api/categories);
 *   API lỗi/chưa chạy thì fallback về products.ts local (không vỡ trang).
 * - Lưới: 1 cột mobile → 2 tablet → 3-4 desktop.
 */
export default function ShopPage() {
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

  return (
    <main className="bg-[#FAF6EC] text-[#1C2B1F]">
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

        {/* Tìm kiếm + sắp xếp */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex-1">
            <span className="sr-only">Tìm kiếm sản phẩm</span>
            <input
              type="search"
              value={qParam}
              placeholder="Tìm lều, túi ngủ, bếp, đèn..."
              onChange={(e) => updateParams({ q: e.target.value })}
              className="min-h-11 w-full rounded-xl border border-[#DDD5BD] bg-white px-4 py-2.5 text-[#1C2B1F] placeholder:text-[#5A6B5A] focus:border-[#2D6A4F] focus:outline-2 focus:outline-[#2D6A4F]"
            />
          </label>
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

        {/* Lọc theo danh mục */}
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Lọc theo danh mục">
          <button
            type="button"
            onClick={() => updateParams({ category: '' })}
            className={`min-h-11 cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition focus:outline-2 focus:outline-offset-2 focus:outline-[#2D6A4F] ${
              !categoryId
                ? 'bg-[#2D6A4F] text-white'
                : 'border border-[#8B4513] bg-white text-[#5C2E0E] hover:bg-[#EFE9D8]'
            }`}
          >
            Tất cả
          </button>
          {allCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => updateParams({ category: String(c.id) })}
              aria-pressed={categoryId === c.id}
              className={`min-h-11 cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition focus:outline-2 focus:outline-offset-2 focus:outline-[#2D6A4F] ${
                categoryId === c.id
                  ? 'bg-[#2D6A4F] text-white'
                  : 'border border-[#8B4513] bg-white text-[#5C2E0E] hover:bg-[#EFE9D8]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm text-[#5A6B5A]" role="status">
          Tìm thấy <span className="font-semibold text-[#1C2B1F]">{results.length}</span> sản phẩm
          {category ? ` trong danh mục “${category.name}”` : ''}
          {qParam ? ` khớp với “${qParam}”` : ''}.
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
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
