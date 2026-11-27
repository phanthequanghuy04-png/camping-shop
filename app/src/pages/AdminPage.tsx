import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  categories as baseCategories,
  products as baseProducts,
} from '../data/products'
import type { Order, OrderStatus, Product } from '../data/types'
import { getAdminOrdersApi } from '../lib/api'

/**
 * Trang quản trị — Camping Shop.
 *
 * Đơn hàng: thử lấy từ API (GET /api/admin/orders, cần token admin)
 * khi đã đăng nhập admin; API lỗi/chưa chạy thì fallback đơn trong
 * localStorage / đơn mẫu như trước. Các thao tác sửa sản phẩm / đổi
 * trạng thái đơn vẫn lưu localStorage (chưa có endpoint admin tương ứng).
 *
 * Kiểm tra quyền đơn giản:
 * - Đọc localStorage key 'camping-session' (do trang Đăng nhập ghi).
 *   Session có thể là JSON { role: 'admin' } hoặc { user: { role } }.
 * - Nếu có session mà role !== 'admin' -> chặn, chỉ hiện thông báo
 *   "Chỉ admin mới xem được trang này" + link tới /login.
 * - Nếu CHƯA có session -> vẫn cho xem ở CHẾ ĐỘ DEMO kèm cảnh báo
 *   (để demo/test khi trang Đăng nhập chưa xong). Khi đăng nhập thật
 *   được triển khai, chỉ cần bỏ nhánh demo này là xong.
 */

const SESSION_KEY = 'camping-session'
const ADMIN_PRODUCTS_KEY = 'camping-admin-products'
const ORDERS_KEY = 'camping-orders'

/** 8 danh mục theo camping.sql (dùng khi products.ts chưa được nạp). */
const FALLBACK_CATEGORIES = [
  { id: 1, name: 'Lều trại' },
  { id: 2, name: 'Túi ngủ' },
  { id: 3, name: 'Bếp & dụng cụ nấu' },
  { id: 4, name: 'Đèn & pin' },
  { id: 5, name: 'Ba lô' },
  { id: 6, name: 'Bàn ghế cắm trại' },
  { id: 7, name: 'Quần áo & giày' },
  { id: 8, name: 'Phụ kiện' },
]

/**
 * 2 đơn hàng mẫu khớp camping.sql — chỉ dùng khi localStorage
 * 'camping-orders' (do Checkout tạo) chưa có đơn nào.
 * Đơn 1: 1 x Lều Cloud Up 2 (2.890.000) + 2 x Đèn lồng LED (350.000)
 *        = 3.590.000đ, đã thanh toán.
 * Đơn 2: 2 x Ghế xếp dã ngoại (590.000) + 1 x Thảm cách nhiệt (390.000)
 *        = 1.570.000đ, chờ xử lý.
 */
const SAMPLE_ORDERS: Order[] = [
  {
    id: 1,
    user_id: 2,
    total: 3590000,
    status: 'paid',
    address: '123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh',
    phone: '0912345678',
    customer_name: 'Nguyễn Văn An',
    created_at: '2026-11-27T09:30:00+07:00',
  },
  {
    id: 2,
    user_id: 2,
    total: 1570000,
    status: 'pending',
    address: '45 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội',
    phone: '0912345678',
    customer_name: 'Nguyễn Văn An',
    created_at: '2026-11-27T10:15:00+07:00',
  },
]

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xử lý',
  paid: 'Đã thanh toán',
  shipped: 'Đang giao hàng',
  done: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

/** pending -> paid -> shipped -> done (hết vòng thì dừng ở done). */
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'paid',
  paid: 'shipped',
  shipped: 'done',
}

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-sky-100 text-sky-800',
  shipped: 'bg-violet-100 text-violet-800',
  done: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
}

type Tab = 'products' | 'add' | 'orders'

type SessionInfo = { role: string | null; name: string | null }

function readSession(): SessionInfo | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as {
      role?: unknown
      name?: unknown
      user?: { role?: unknown; name?: unknown } | null
    }
    const role =
      typeof data.role === 'string'
        ? data.role
        : typeof data.user?.role === 'string'
          ? data.user.role
          : null
    const name =
      typeof data.name === 'string'
        ? data.name
        : typeof data.user?.name === 'string'
          ? data.user.name
          : null
    return { role, name }
  } catch {
    return null
  }
}

function readStoredProducts(): Product[] | null {
  try {
    const raw = localStorage.getItem(ADMIN_PRODUCTS_KEY)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return null
    return data.filter(
      (p): p is Product =>
        typeof p === 'object' &&
        p !== null &&
        typeof (p as Product).id === 'number' &&
        typeof (p as Product).name === 'string',
    )
  } catch {
    return null
  }
}

function isValidOrderStatus(value: unknown): value is OrderStatus {
  return (
    value === 'pending' ||
    value === 'paid' ||
    value === 'shipped' ||
    value === 'done' ||
    value === 'cancelled'
  )
}

function readStoredOrders(): Order[] | null {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return null
    const orders = data
      .filter(
        (o): o is Record<string, unknown> =>
          typeof o === 'object' && o !== null,
      )
      .map((o) => ({
        id: typeof o.id === 'number' ? o.id : 0,
        user_id: typeof o.user_id === 'number' ? o.user_id : null,
        total: typeof o.total === 'number' ? o.total : 0,
        status: isValidOrderStatus(o.status) ? o.status : 'pending',
        address: typeof o.address === 'string' ? o.address : null,
        phone: typeof o.phone === 'string' ? o.phone : null,
        customer_name:
          typeof o.customer_name === 'string'
            ? o.customer_name
            : typeof o.name === 'string'
              ? o.name
              : 'Khách vãng lai',
        created_at:
          typeof o.created_at === 'string' ? o.created_at : '',
      }))
      .filter((o) => o.id > 0)
    return orders.length > 0 ? orders : null
  } catch {
    return null
  }
}

function formatVnd(value: number): string {
  return `${value.toLocaleString('vi-VN')} đ`
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600'
const labelClass = 'mb-1 block text-sm font-medium text-gray-700'
const primaryButtonClass =
  'rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButtonClass =
  'rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'

export default function AdminPage() {
  const [session, setSession] = useState<SessionInfo | null | undefined>(
    undefined,
  )
  const [tab, setTab] = useState<Tab>('products')

  const categories =
    baseCategories.length > 0 ? baseCategories : FALLBACK_CATEGORIES

  // Sản phẩm: ưu tiên bản admin đã sửa trong localStorage,
  // nếu chưa có thì dùng products.ts (agent tích hợp nạp từ camping.sql).
  const [adminProducts, setAdminProducts] = useState<Product[]>(() => {
    const stored = readStoredProducts()
    return stored ?? baseProducts
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [editQuantity, setEditQuantity] = useState('')
  const [editStatus, setEditStatus] = useState<'1' | '0'>('1')
  const [productNotice, setProductNotice] = useState('')

  // Form thêm sản phẩm mới.
  const [newName, setNewName] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('1')
  const [newPrice, setNewPrice] = useState('')
  const [newQuantity, setNewQuantity] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newImage, setNewImage] = useState('')
  const [addNotice, setAddNotice] = useState('')
  const [addError, setAddError] = useState('')

  // Đơn hàng: ưu tiên đơn Checkout đã lưu, nếu chưa có thì 2 đơn mẫu.
  const [orders, setOrders] = useState<Order[]>(() => {
    return readStoredOrders() ?? SAMPLE_ORDERS
  })
  const [usingSampleOrders, setUsingSampleOrders] = useState<boolean>(
    () => readStoredOrders() === null,
  )

  useEffect(() => {
    setSession(readSession())
  }, [])

  // Admin đã đăng nhập: kéo đơn hàng thật từ API (kèm chi tiết items).
  // API lỗi (chưa chạy / token hết hạn) -> giữ đơn localStorage/mẫu.
  const [apiOrdersLoaded, setApiOrdersLoaded] = useState(false)
  useEffect(() => {
    if (session?.role !== 'admin') return
    let cancelled = false
    void (async () => {
      try {
        const apiOrders = await getAdminOrdersApi()
        if (cancelled) return
        setOrders(
          apiOrders.map(
            ({ items: _items, ...order }) => order as Order,
          ),
        )
        setUsingSampleOrders(false)
        setApiOrdersLoaded(true)
      } catch {
        // Fallback: đơn localStorage / mẫu đã nạp ở state khởi tạo.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session])

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]))
    return (id: number | null) =>
      id === null ? 'Chưa phân loại' : (map.get(id) ?? 'Chưa phân loại')
  }, [categories])

  const visibleProducts = adminProducts.filter((p) => p.status === 1)
  const hiddenProducts = adminProducts.filter((p) => p.status === 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const revenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0)

  // Chưa đọc xong session thì chưa quyết định chặn hay cho xem.
  if (session === undefined) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-gray-600">Đang kiểm tra quyền truy cập…</p>
      </main>
    )
  }

  // Đã đăng nhập nhưng không phải admin -> chặn hẳn.
  if (session !== null && session.role !== 'admin') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Chỉ admin mới xem được trang này
        </h1>
        <p className="mt-3 text-gray-600">
          Tài khoản hiện tại không có quyền quản trị. Vui lòng đăng nhập
          bằng tài khoản admin để tiếp tục.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/login" className={primaryButtonClass}>
            Đăng nhập
          </Link>
          <Link to="/" className={secondaryButtonClass}>
            Về trang chủ
          </Link>
        </div>
      </main>
    )
  }

  // Tới đây: role === 'admin' hoặc chưa có session (chế độ demo).
  const isDemo = session === null

  function persistProducts(next: Product[]) {
    setAdminProducts(next)
    try {
      localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(next))
    } catch {
      // localStorage đầy hoặc bị chặn: vẫn hiện danh sách trong phiên này.
    }
  }

  function startEdit(product: Product) {
    setEditingId(product.id)
    setEditPrice(String(product.price))
    setEditQuantity(String(product.quantity))
    setEditStatus(product.status === 1 ? '1' : '0')
    setProductNotice('')
  }

  function saveEdit() {
    if (editingId === null) return
    const price = Number(editPrice)
    const quantity = Number(editQuantity)
    if (!Number.isFinite(price) || price < 0) {
      setProductNotice('Giá phải là số và không được âm.')
      return
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      setProductNotice('Tồn kho phải là số nguyên và không được âm.')
      return
    }
    const next = adminProducts.map((p) =>
      p.id === editingId
        ? { ...p, price, quantity, status: Number(editStatus) }
        : p,
    )
    persistProducts(next)
    setEditingId(null)
    setProductNotice('Đã lưu thay đổi sản phẩm.')
  }

  function deleteProduct(product: Product) {
    // "Xóa" ở đây là ẩn sản phẩm (status = 0), không xóa hẳn khỏi dữ liệu.
    if (!window.confirm(`Ẩn sản phẩm "${product.name}" khỏi cửa hàng?`)) return
    persistProducts(
      adminProducts.map((p) =>
        p.id === product.id ? { ...p, status: 0 } : p,
      ),
    )
    setProductNotice(`Đã ẩn sản phẩm "${product.name}".`)
  }

  function restoreProduct(product: Product) {
    persistProducts(
      adminProducts.map((p) =>
        p.id === product.id ? { ...p, status: 1 } : p,
      ),
    )
    setProductNotice(`Đã hiện lại sản phẩm "${product.name}".`)
  }

  function submitNewProduct(event: React.FormEvent) {
    event.preventDefault()
    setAddError('')
    setAddNotice('')
    const price = Number(newPrice)
    const quantity = Number(newQuantity)
    if (newName.trim() === '') {
      setAddError('Vui lòng nhập tên sản phẩm.')
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      setAddError('Giá phải là số lớn hơn 0.')
      return
    }
    if (newQuantity.trim() !== '' && (!Number.isInteger(quantity) || quantity < 0)) {
      setAddError('Tồn kho phải là số nguyên và không được âm.')
      return
    }
    const nextId =
      adminProducts.reduce((max, p) => Math.max(max, p.id), 0) + 1
    const product: Product = {
      id: nextId,
      name: newName.trim(),
      image: newImage.trim() === '' ? null : newImage.trim(),
      price,
      quantity: newQuantity.trim() === '' ? 0 : quantity,
      status: 1,
      id_category: Number(newCategoryId),
      description:
        newDescription.trim() === '' ? null : newDescription.trim(),
      rating: 4.5,
      created_at: new Date().toISOString(),
    }
    persistProducts([...adminProducts, product])
    setAddNotice(`Đã thêm sản phẩm "${product.name}" vào cửa hàng.`)
    setNewName('')
    setNewCategoryId('1')
    setNewPrice('')
    setNewQuantity('')
    setNewDescription('')
    setNewImage('')
  }

  function advanceOrderStatus(order: Order) {
    const nextStatus = NEXT_STATUS[order.status]
    if (!nextStatus) return
    const next = orders.map((o) =>
      o.id === order.id ? { ...o, status: nextStatus } : o,
    )
    setOrders(next)
    setUsingSampleOrders(false)
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(next))
    } catch {
      // Vẫn hiện trạng thái mới trong phiên này.
    }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'products', label: 'Sản phẩm', count: adminProducts.length },
    { id: 'add', label: 'Thêm sản phẩm' },
    { id: 'orders', label: 'Đơn hàng', count: orders.length },
  ]

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
        Trang quản trị
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        {isDemo
          ? 'Bạn đang xem ở chế độ demo (chưa đăng nhập).'
          : `Đăng nhập với quyền admin${session?.name ? ` — ${session.name}` : ''}.`}
      </p>

      {isDemo && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Chế độ demo:</strong> chưa phát hiện phiên đăng nhập
          (localStorage key <code>camping-session</code>). Trang vẫn cho xem
          để demo và kiểm thử; mọi thay đổi chỉ lưu trên trình duyệt này
          (localStorage) và sẽ bị thay thế khi có API/backend thật. Vui lòng{' '}
          <Link to="/login" className="font-medium underline">
            đăng nhập bằng tài khoản admin
          </Link>{' '}
          để quản lý chính thức.
        </div>
      )}

      {/* Thống kê nhanh */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Sản phẩm đang bán</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">
            {visibleProducts.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Sản phẩm đang ẩn</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">
            {hiddenProducts.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Đơn chờ xử lý</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {pendingOrders}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Tổng tiền đơn hàng</p>
          <p className="mt-1 text-xl font-bold text-emerald-800">
            {formatVnd(revenue)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Quản trị"
        className="mt-8 flex flex-wrap gap-2 border-b border-gray-200 pb-0"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id)
              setProductNotice('')
            }}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? 'border border-b-0 border-gray-200 bg-white text-emerald-800'
                : 'text-gray-600 hover:text-emerald-700'
            }`}
          >
            {t.label}
            {typeof t.count === 'number' ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {/* ===== Tab: Sản phẩm ===== */}
      {tab === 'products' && (
        <section className="mt-6">
          {productNotice && (
            <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              {productNotice}
            </p>
          )}

          {editingId !== null && (
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <h2 className="font-semibold text-gray-900">
                Sửa sản phẩm #{editingId}
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor="edit-price" className={labelClass}>
                    Giá (VND)
                  </label>
                  <input
                    id="edit-price"
                    type="number"
                    min={0}
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="edit-quantity" className={labelClass}>
                    Tồn kho
                  </label>
                  <input
                    id="edit-quantity"
                    type="number"
                    min={0}
                    step={1}
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="edit-status" className={labelClass}>
                    Trạng thái
                  </label>
                  <select
                    id="edit-status"
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as '1' | '0')
                    }
                    className={inputClass}
                  >
                    <option value="1">Đang bán</option>
                    <option value="0">Ẩn / Ngừng bán</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  className={primaryButtonClass}
                >
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className={secondaryButtonClass}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {adminProducts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-600">
              Chưa có sản phẩm nào. Dữ liệu 28 sản phẩm mẫu sẽ được nạp từ
              camping.sql ở bước tích hợp, hoặc bạn có thể thêm sản phẩm mới
              ở tab “Thêm sản phẩm”.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-700">
                    <th className="px-4 py-3 font-semibold">Sản phẩm</th>
                    <th className="px-4 py-3 font-semibold">Danh mục</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Giá (VND)
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Tồn kho
                    </th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {adminProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {product.name}
                        </span>
                        <span className="block text-xs text-gray-500">
                          #{product.id}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {categoryName(product.id_category)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatVnd(product.price)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {product.quantity}
                      </td>
                      <td className="px-4 py-3">
                        {product.status === 1 ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                            Đang bán
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700">
                            Đang ẩn
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(product)}
                            className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
                          >
                            Sửa
                          </button>
                          {product.status === 1 ? (
                            <button
                              type="button"
                              onClick={() => deleteProduct(product)}
                              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                            >
                              Xóa
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => restoreProduct(product)}
                              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Hiện lại
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-gray-500">
            Thay đổi được lưu vào localStorage key{' '}
            <code>camping-admin-products</code> và sẽ hiển thị lại khi mở
            trang. Nút “Xóa” chỉ ẩn sản phẩm (chuyển trạng thái thành Ẩn),
            có thể hiện lại bằng nút “Hiện lại”.
          </p>
        </section>
      )}

      {/* ===== Tab: Thêm sản phẩm ===== */}
      {tab === 'add' && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Thêm sản phẩm mới
          </h2>
          {addError && (
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">
              {addError}
            </p>
          )}
          {addNotice && (
            <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              {addNotice}
            </p>
          )}
          <form
            onSubmit={submitNewProduct}
            className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-2"
          >
            <div>
              <label htmlFor="new-name" className={labelClass}>
                Tên sản phẩm *
              </label>
              <input
                id="new-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ví dụ: Lều trại 2 người Naturehike"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="new-category" className={labelClass}>
                Danh mục *
              </label>
              <select
                id="new-category"
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className={inputClass}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="new-price" className={labelClass}>
                Giá (VND) *
              </label>
              <input
                id="new-price"
                type="number"
                min={1}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Ví dụ: 2890000"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="new-quantity" className={labelClass}>
                Tồn kho
              </label>
              <input
                id="new-quantity"
                type="number"
                min={0}
                step={1}
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                placeholder="Ví dụ: 10"
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="new-image" className={labelClass}>
                Ảnh (URL)
              </label>
              <input
                id="new-image"
                type="url"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                placeholder="https://…/ten-anh.jpg (để trống nếu chưa có ảnh)"
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="new-description" className={labelClass}>
                Mô tả
              </label>
              <textarea
                id="new-description"
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Mô tả ngắn về sản phẩm…"
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className={primaryButtonClass}>
                Thêm sản phẩm
              </button>
            </div>
          </form>
          <p className="mt-3 text-xs text-gray-500">
            Sản phẩm mới được lưu vào localStorage key{' '}
            <code>camping-admin-products</code> và xuất hiện ngay trong tab
            “Sản phẩm”.
          </p>
        </section>
      )}

      {/* ===== Tab: Đơn hàng ===== */}
      {tab === 'orders' && (
        <section className="mt-6">
          {apiOrdersLoaded && (
            <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              Đơn hàng đang lấy từ API (DB MySQL `camping`).
            </p>
          )}
          {usingSampleOrders && !apiOrdersLoaded && (
            <p className="mb-4 rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-800">
              Đang hiển thị 2 đơn hàng mẫu theo camping.sql (chưa có đơn nào
              từ Checkout trong localStorage key{' '}
              <code>camping-orders</code>).
            </p>
          )}
          {orders.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-600">
              Chưa có đơn hàng nào.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-700">
                    <th className="px-4 py-3 font-semibold">Mã đơn</th>
                    <th className="px-4 py-3 font-semibold">Khách hàng</th>
                    <th className="px-4 py-3 font-semibold">Ngày đặt</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Tổng tiền
                    </th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const nextStatus = NEXT_STATUS[order.status]
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-gray-100 align-top last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {order.customer_name ?? 'Khách vãng lai'}
                          {order.phone && (
                            <span className="block text-xs text-gray-500">
                              {order.phone}
                            </span>
                          )}
                          {order.address && (
                            <span className="block max-w-56 text-xs text-gray-500">
                              {order.address}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatVnd(order.total)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${ORDER_STATUS_STYLES[order.status]}`}
                          >
                            {ORDER_STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {nextStatus ? (
                            <button
                              type="button"
                              onClick={() => advanceOrderStatus(order)}
                              className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white hover:bg-emerald-800"
                            >
                              → {ORDER_STATUS_LABELS[nextStatus]}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-gray-500">
            Nhấn nút ở cột “Thao tác” để chuyển trạng thái đơn theo vòng:{' '}
            Chờ xử lý → Đã thanh toán → Đang giao hàng → Hoàn thành. Thay
            đổi được lưu vào localStorage key <code>camping-orders</code>.
          </p>
        </section>
      )}
    </main>
  )
}
