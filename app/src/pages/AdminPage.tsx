import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  categories as baseCategories,
  products as baseProducts,
} from '../data/products'
import type { Order, OrderStatus, Product } from '../data/types'
import {
  ApiError,
  createProductApi,
  deleteAdminProductApi,
  getAdminOrdersApi,
  getProducts,
  updateAdminOrderApi,
  updateAdminProductApi,
} from '../lib/api'
import {
  prepareProductImage,
  type PreparedImage,
} from '../lib/imageUpload'

/**
 * Trang quản trị — Camping Shop.
 *
 * Đơn hàng: thử lấy từ API (GET /api/admin/orders, cần token admin)
 * khi đã đăng nhập admin; API lỗi/chưa chạy thì fallback đơn trong
 * localStorage / đơn mẫu như trước. Đổi trạng thái đơn, đánh dấu đã
 * nhận tiền và nhập mã vận đơn gọi PATCH /api/admin/orders/:id khi
 * API chạy; API lỗi thì chỉ đổi trong phiên này (lưu localStorage).
 * Form "Thêm sản phẩm" gọi POST /api/admin/products (cần token admin)
 * để lưu vào database và hiện ngay trên cửa hàng; ảnh tải lên từ thiết
 * bị được đẩy lên kho GitHub qua API (cần GITHUB_TOKEN trên server).
 * Các thao tác Sửa/Xóa sản phẩm trong tab "Sản phẩm" vẫn lưu
 * localStorage (chưa có endpoint admin tương ứng).
 *
 * Kiểm tra quyền — chỉ tài khoản role 'admin' mới được vào:
 * - Đọc localStorage key 'camping-session' (do trang Đăng nhập ghi).
 *   Session có thể là JSON { role: 'admin' } hoặc { user: { role } }.
 * - Chưa đăng nhập -> chặn, yêu cầu đăng nhập bằng tài khoản admin.
 * - Đã đăng nhập nhưng role !== 'admin' -> chặn, chỉ hiện thông báo
 *   "Chỉ admin mới xem được trang này" + link tới /login.
 * - Không có chế độ demo: khách vãng lai không bao giờ thấy nội dung
 *   quản trị (sản phẩm, đơn hàng, doanh thu).
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
  'btn-white rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButtonClass =
  'btn-dark rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'

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
  // Ảnh tải lên từ thiết bị (đã tách nền sẵn): xử lý xong ở client
  // (cắt lề trong suốt + nén WebP) rồi mới gửi lên server.
  const [newImageFile, setNewImageFile] = useState<PreparedImage | null>(
    null,
  )
  const [imageProcessing, setImageProcessing] = useState(false)
  const [imageError, setImageError] = useState('')
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const [addNotice, setAddNotice] = useState('')
  const [addError, setAddError] = useState('')
  const [addingProduct, setAddingProduct] = useState(false)

  // Đơn hàng: ưu tiên đơn Checkout đã lưu, nếu chưa có thì 2 đơn mẫu.
  const [orders, setOrders] = useState<Order[]>(() => {
    return readStoredOrders() ?? SAMPLE_ORDERS
  })
  // Mã vận đơn admin đang gõ (theo từng đơn) + đơn đang lưu qua API.
  const [trackingDrafts, setTrackingDrafts] = useState<Record<number, string>>(
    {},
  )
  const [savingOrderId, setSavingOrderId] = useState<number | null>(null)
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

  // Bảng sản phẩm cũng lấy số liệu THẬT từ API (database) khi admin đăng
  // nhập — bản localStorage/baseProducts chỉ là bản dự phòng, dễ lệch
  // với DB (vd tồn kho id 1: local 15, DB 12). Sản phẩm nào chỉ có
  // trong bản local (thêm tay trước khi có API) thì giữ lại phía sau.
  const adminProductsRef = useRef(adminProducts)
  adminProductsRef.current = adminProducts
  useEffect(() => {
    if (session?.role !== 'admin') return
    let cancelled = false
    void (async () => {
      try {
        const list = await getProducts()
        if (cancelled) return
        const apiIds = new Set(list.map((p) => p.id))
        const localOnly = adminProductsRef.current.filter(
          (p) => !apiIds.has(p.id),
        )
        persistProducts([...list, ...localOnly])
      } catch {
        // API lỗi: giữ bản local như trước.
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <p className="text-muted-foreground">Đang kiểm tra quyền truy cập…</p>
      </main>
    )
  }

  // Chưa đăng nhập -> chặn, yêu cầu đăng nhập bằng tài khoản admin.
  if (session === null) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Bạn cần đăng nhập để xem trang này
        </h1>
        <p className="mt-3 text-muted-foreground">
          Trang quản trị chỉ dành cho tài khoản admin. Vui lòng đăng nhập
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

  // Đã đăng nhập nhưng không phải admin -> chặn hẳn.
  if (session.role !== 'admin') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Chỉ admin mới xem được trang này
        </h1>
        <p className="mt-3 text-muted-foreground">
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

  // Tới đây: role === 'admin'.

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

  /** Sửa giá / tồn kho / trạng thái: ghi VÀO DATABASE qua API để cửa
      hàng cập nhật thật; API lỗi (mất mạng, sản phẩm chỉ có trong bản
      local) thì chỉ đổi trong bản sao local như trước. */
  async function saveEdit() {
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
    const id = editingId
    const patch = {
      price,
      quantity,
      status: Number(editStatus) as 0 | 1,
    }
    const applyLocal = () =>
      persistProducts(
        adminProducts.map((p) =>
          p.id === id ? { ...p, ...patch } : p,
        ),
      )
    setEditingId(null)
    try {
      const updated = await updateAdminProductApi(id, patch)
      persistProducts(
        adminProducts.map((p) => (p.id === id ? { ...p, ...updated } : p)),
      )
      setProductNotice('Đã lưu thay đổi sản phẩm (đã cập nhật trên cửa hàng).')
    } catch {
      applyLocal()
      setProductNotice(
        'Đã lưu thay đổi trong quản trị (chưa cập nhật lên cửa hàng — kiểm tra lại kết nối rồi thử lại).',
      )
    }
  }

  /** "Xóa" là ẨN sản phẩm khỏi cửa hàng (status = 0, không xóa hẳn khỏi
      database) — ghi vào DB qua API để khách không còn thấy; hiện lại
      được bằng nút "Hiện lại". */
  async function deleteProduct(product: Product) {
    // "Xóa" ở đây là ẩn sản phẩm (status = 0), không xóa hẳn khỏi dữ liệu.
    if (!window.confirm(`Ẩn sản phẩm "${product.name}" khỏi cửa hàng?`)) return
    try {
      const updated = await deleteAdminProductApi(product.id)
      persistProducts(
        adminProducts.map((p) =>
          p.id === product.id ? { ...p, ...updated } : p,
        ),
      )
      setProductNotice(`Đã ẩn sản phẩm "${product.name}" khỏi cửa hàng.`)
    } catch {
      persistProducts(
        adminProducts.map((p) =>
          p.id === product.id ? { ...p, status: 0 } : p,
        ),
      )
      setProductNotice(
        `Đã ẩn sản phẩm "${product.name}" trong quản trị (chưa cập nhật lên cửa hàng — kiểm tra lại kết nối rồi thử lại).`,
      )
    }
  }

  /** Hiện lại sản phẩm đã ẩn: ghi status = 1 vào database qua API. */
  async function restoreProduct(product: Product) {
    try {
      const updated = await updateAdminProductApi(product.id, { status: 1 })
      persistProducts(
        adminProducts.map((p) =>
          p.id === product.id ? { ...p, ...updated } : p,
        ),
      )
      setProductNotice(`Đã hiện lại sản phẩm "${product.name}".`)
    } catch {
      persistProducts(
        adminProducts.map((p) =>
          p.id === product.id ? { ...p, status: 1 } : p,
        ),
      )
      setProductNotice(
        `Đã hiện lại sản phẩm "${product.name}" trong quản trị (chưa cập nhật lên cửa hàng — kiểm tra lại kết nối rồi thử lại).`,
      )
    }
  }

  /** Chọn ảnh từ thiết bị: cắt lề trong suốt thừa + nén WebP ngay trên
      trình duyệt rồi mới lưu để gửi lên server (xem lib/imageUpload). */
  async function handleImageFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setImageError('')
    setImageProcessing(true)
    try {
      const prepared = await prepareProductImage(file)
      setNewImageFile(prepared)
      setNewImage('')
    } catch (err) {
      setNewImageFile(null)
      setImageError(
        err instanceof Error ? err.message : 'Không xử lý được ảnh này.',
      )
    } finally {
      setImageProcessing(false)
    }
  }

  function clearImageFile() {
    setNewImageFile(null)
    setImageError('')
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  /** Thêm sản phẩm mới VÀO DATABASE qua API để hiện ngay trên cửa hàng
      cho mọi khách (POST /api/admin/products). Ảnh tải lên (image_data)
      được server đẩy lên kho GitHub rồi lưu tên file vào DB; ảnh mới
      hiện sau ~1 phút (chờ Pages deploy). */
  async function submitNewProduct(event: React.FormEvent) {
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
    if (
      newQuantity.trim() !== '' &&
      (!Number.isInteger(quantity) || quantity < 0)
    ) {
      setAddError('Tồn kho phải là số nguyên và không được âm.')
      return
    }
    setAddingProduct(true)
    try {
      const created = await createProductApi({
        name: newName.trim(),
        price,
        quantity: newQuantity.trim() === '' ? 0 : quantity,
        id_category: Number(newCategoryId),
        description:
          newDescription.trim() === '' ? null : newDescription.trim(),
        image: newImageFile ? null : newImage.trim() || null,
        image_data: newImageFile ? newImageFile.dataUrl : null,
      })
      // Hiện ngay trong tab "Sản phẩm" của quản trị (bản sao local).
      persistProducts([...adminProducts, created])
      setAddNotice(
        `Đã thêm sản phẩm "${created.name}" vào cửa hàng (mã #${created.id}).` +
          (created.image_pending_deploy
            ? ' Ảnh tải lên sẽ hiện sau khoảng 1 phút (đang chờ deploy).'
            : ''),
      )
      setNewName('')
      setNewCategoryId('1')
      setNewPrice('')
      setNewQuantity('')
      setNewDescription('')
      setNewImage('')
      clearImageFile()
    } catch (err) {
      setAddError(
        err instanceof ApiError
          ? err.message
          : 'Không thêm được sản phẩm (không kết nối được tới API).',
      )
    } finally {
      setAddingProduct(false)
    }
  }

  /** Đổi trạng thái đơn qua API (fallback local khi API chưa chạy). */
  async function patchOrder(
    order: Order,
    patch: {
      status?: OrderStatus
      payment_status?: 'unpaid' | 'paid'
      tracking_code?: string | null
    },
  ): Promise<void> {
    const next = orders.map((o) =>
      o.id === order.id ? { ...o, ...patch } : o,
    )
    if (!apiOrdersLoaded) {
      setOrders(next)
      setUsingSampleOrders(false)
      persistOrders(next)
      return
    }
    setSavingOrderId(order.id)
    try {
      const updated = await updateAdminOrderApi(order.id, patch)
      const { items: _items, ...rest } = updated
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? (rest as Order) : o)),
      )
      setUsingSampleOrders(false)
    } catch {
      // API lỗi giữa chừng: vẫn đổi trong phiên này để admin làm tiếp.
      setOrders(next)
      setUsingSampleOrders(false)
      persistOrders(next)
    } finally {
      setSavingOrderId(null)
    }
  }

  function persistOrders(next: Order[]): void {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(next))
    } catch {
      // Vẫn hiện trạng thái mới trong phiên này.
    }
  }

  function advanceOrderStatus(order: Order) {
    const nextStatus = NEXT_STATUS[order.status]
    if (!nextStatus) return
    void patchOrder(order, { status: nextStatus })
  }

  /** Khách chuyển khoản xong: admin xác nhận đã nhận tiền. */
  function markOrderPaid(order: Order) {
    void patchOrder(order, { payment_status: 'paid' })
  }

  /** Lưu mã vận đơn admin vừa nhập. */
  function saveTrackingCode(order: Order) {
    const code = (trackingDrafts[order.id] ?? order.tracking_code ?? '').trim()
    void patchOrder(order, { tracking_code: code || null })
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
      <p className="mt-2 text-sm text-muted-foreground">
        {`Đăng nhập với quyền admin${session?.name ? ` — ${session.name}` : ''}.`}
      </p>

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

      {/* Tabs: một hàng cuộn ngang trên điện thoại (không xuống dòng),
          vuốt để xem đủ 3 tab: Sản phẩm / Thêm sản phẩm / Đơn hàng. */}
      <div
        role="tablist"
        aria-label="Quản trị"
        className="mt-8 flex flex-nowrap gap-2 overflow-x-auto border-b border-gray-200 pb-0"
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
            className={`shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium whitespace-nowrap ${
              tab === t.id
                ? 'border border-b-0 border-gray-200 bg-white text-emerald-800'
                : 'text-muted-foreground hover:text-emerald-700'
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
                    <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 font-semibold">
                      Sản phẩm
                    </th>
                    <th className="px-4 py-3 font-semibold">Danh mục</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">
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
                      <td className="sticky left-0 bg-white px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {product.name}
                        </span>
                        <span className="block text-xs text-gray-500">
                          #{product.id}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {categoryName(product.id_category)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">
                        {formatVnd(product.price)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {product.quantity}
                      </td>
                      <td className="px-4 py-3">
                        {product.status === 1 ? (
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                            Đang bán
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500" />
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
          <p className="mt-3 text-xs text-muted-foreground">
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
              <span className={labelClass}>Ảnh sản phẩm</span>
              <label
                htmlFor="new-image-file"
                className="mt-1 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-700 hover:border-emerald-600 hover:bg-emerald-50"
              >
                {imageProcessing
                  ? 'Đang xử lý ảnh…'
                  : newImageFile
                    ? 'Bấm để chọn ảnh khác'
                    : 'Bấm để tải ảnh lên từ thiết bị'}
              </label>
              <input
                id="new-image-file"
                ref={imageInputRef}
                type="file"
                accept="image/png,image/webp,image/jpeg"
                onChange={handleImageFile}
                className="hidden"
              />
              <p className="mt-1 text-xs text-gray-500">
                Nên dùng ảnh PNG/WebP đã tách nền sẵn — web tự cắt lề
                trong suốt thừa và nén nhẹ trước khi tải lên. Tối đa 5 MB.
              </p>
              {imageError && (
                <p className="mt-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">
                  {imageError}
                </p>
              )}
              {newImageFile && (
                <div className="mt-3 flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3">
                  <img
                    src={newImageFile.dataUrl}
                    alt="Ảnh sản phẩm đã chọn"
                    className="h-24 w-24 shrink-0 rounded-md border border-gray-200 bg-white object-contain"
                  />
                  <div className="min-w-0 text-sm">
                    <p className="break-all font-medium text-gray-900">
                      {newImageFile.fileName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {newImageFile.width}×{newImageFile.height} ·{' '}
                      {(newImageFile.size / 1024).toFixed(0)} KB
                      {newImageFile.trimmed
                        ? ' · đã cắt lề trong suốt thừa'
                        : ''}
                    </p>
                    <button
                      type="button"
                      onClick={clearImageFile}
                      className="mt-2 text-xs font-medium text-red-600 hover:underline"
                    >
                      Bỏ ảnh này
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="new-image" className={labelClass}>
                Hoặc dán link ảnh có sẵn
              </label>
              <input
                id="new-image"
                type="url"
                value={newImage}
                disabled={newImageFile !== null}
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
              <button
                type="submit"
                disabled={addingProduct || imageProcessing}
                className={primaryButtonClass}
              >
                {addingProduct ? 'Đang thêm…' : 'Thêm sản phẩm'}
              </button>
            </div>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Sản phẩm mới được lưu vào database và hiện ngay trên cửa hàng
            cho mọi khách. Ảnh tải lên sẽ hiện sau khoảng 1 phút (chờ
            deploy).
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
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-700">
                    <th className="px-4 py-3 font-semibold">Mã đơn</th>
                    <th className="px-4 py-3 font-semibold">Khách hàng</th>
                    <th className="px-4 py-3 font-semibold">Ngày đặt</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Tổng tiền
                    </th>
                    <th className="px-4 py-3 font-semibold">Thanh toán</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold">Mã vận đơn</th>
                    <th className="px-4 py-3 font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const nextStatus = NEXT_STATUS[order.status]
                    const paymentMethod =
                      order.payment_method ?? 'cod'
                    const isPaid = order.payment_status === 'paid'
                    const trackingValue =
                      trackingDrafts[order.id] ?? order.tracking_code ?? ''
                    const saving = savingOrderId === order.id
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
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                          {paymentMethod === 'bank_transfer'
                            ? 'Chuyển khoản'
                            : 'COD'}
                          <span
                            className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isPaid ? 'Đã nhận tiền' : 'Chưa thanh toán'}
                          </span>
                          {paymentMethod === 'bank_transfer' && !isPaid && (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => markOrderPaid(order)}
                              className="mt-1 block rounded-md border border-emerald-600 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                            >
                              Xác nhận đã nhận tiền
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${ORDER_STATUS_STYLES[order.status]}`}
                          >
                            {ORDER_STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={trackingValue}
                              disabled={saving}
                              onChange={(e) =>
                                setTrackingDrafts((prev) => ({
                                  ...prev,
                                  [order.id]: e.target.value,
                                }))
                              }
                              placeholder="VD: GHN-123456"
                              aria-label={`Mã vận đơn cho đơn #${order.id}`}
                              className="w-28 rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-emerald-600 focus:outline-none"
                            />
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => saveTrackingCode(order)}
                              className="rounded-md bg-gray-700 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                            >
                              Lưu
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {nextStatus ? (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => advanceOrderStatus(order)}
                              className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white hover:bg-emerald-800 disabled:opacity-50"
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
          <p className="mt-3 text-xs text-muted-foreground">
            Nhấn nút ở cột “Thao tác” để chuyển trạng thái đơn theo vòng:{' '}
            Chờ xử lý → Đã thanh toán → Đang giao hàng → Hoàn thành. Đơn
            chuyển khoản: nhấn “Xác nhận đã nhận tiền” khi tiền đã về tài
            khoản. Nhập mã vận đơn (GHN/GHTK/Viettel Post) rồi nhấn “Lưu” —
            khách sẽ thấy mã này ở trang Đơn hàng của tôi. Thay đổi được
            lưu qua API khi backend chạy, nếu không thì lưu vào
            localStorage key <code>camping-orders</code>.
          </p>
        </section>
      )}
    </main>
  )
}
