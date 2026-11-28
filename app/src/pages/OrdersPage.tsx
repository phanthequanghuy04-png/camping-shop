/**
 * Trang Đơn hàng của tôi — liệt kê các đơn đã đặt bằng tài khoản đang
 * đăng nhập. Ưu tiên lấy từ API (GET /api/orders?user_id=) khi backend
 * chạy; API lỗi thì đọc localStorage `camping-orders` như trước.
 * Đơn đặt lúc chưa đăng nhập (user_id null) không gắn với tài khoản nào
 * nên không hiện ở đây.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSessionUser } from '../data/users'
import { formatVND } from '../context/CartContext'
import { getMyOrdersApi } from '../lib/api'

/** Key lưu đơn hàng trong localStorage (xem CheckoutPage). */
const ORDERS_STORAGE_KEY = 'camping-orders'

interface LocalOrder {
  id: number
  user_id: number | null
  total: number
  status: string
  created_at: string
  items: Array<{ quantity: number }>
  subtotal?: number
  discount_amount?: number
  coupon_code?: string | null
  shipping_fee?: number
  payment_method?: 'cod' | 'bank_transfer'
  payment_status?: 'unpaid' | 'paid'
  tracking_code?: string | null
  estimated_delivery?: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  paid: 'Đã thanh toán',
  shipped: 'Đang giao hàng',
  done: 'Hoàn tất',
  cancelled: 'Đã hủy',
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản / VietQR',
}

function formatDeliveryDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('vi-VN')
}

function loadOrders(): LocalOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as LocalOrder[]) : []
  } catch {
    return []
  }
}

export default function OrdersPage() {
  const sessionUser = getSessionUser()
  const [orders, setOrders] = useState<LocalOrder[]>(() => loadOrders())
  const [fromApi, setFromApi] = useState(false)

  // Khi backend chạy, đơn đặt qua API mới là nguồn đúng (đơn lưu local
  // chỉ là bản dự phòng lúc API chưa chạy). Lấy từ API, lỗi thì giữ
  // danh sách local đã nạp sẵn.
  useEffect(() => {
    if (!sessionUser) return
    let cancelled = false
    getMyOrdersApi(sessionUser.id)
      .then((apiOrders) => {
        if (cancelled) return
        setOrders(
          apiOrders.map((order) => ({
            ...order,
            items: order.items.map((item) => ({
              quantity: item.quantity,
            })),
          })),
        )
        setFromApi(true)
      })
      .catch(() => {
        // API chưa chạy: giữ danh sách local.
      })
    return () => {
      cancelled = true
    }
  }, [sessionUser])

  if (!sessionUser) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-emerald-900 sm:text-3xl">
          Bạn cần đăng nhập để xem đơn hàng
        </h1>
        <p className="mt-3 text-muted-foreground">
          Đăng nhập để xem các đơn hàng bạn đã đặt.
        </p>
        <Link
          to="/login"
          className="btn-white mt-8 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800"
        >
          Đăng nhập
        </Link>
      </main>
    )
  }

  const mine = orders.filter((order) => order.user_id === sessionUser.id)

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-emerald-900 sm:text-3xl">
        Đơn hàng của tôi
      </h1>
      <p className="mt-2 text-muted-foreground">
        {mine.length === 0
          ? 'Bạn chưa có đơn hàng nào.'
          : `${mine.length} đơn hàng`}
        {fromApi && mine.length > 0 && (
          <span className="text-muted-foreground"> · lấy từ hệ thống</span>
        )}
      </p>

      {mine.length === 0 ? (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="mt-4 text-gray-600">
            Bạn chưa đặt đơn hàng nào. Khám phá các sản phẩm cắm trại nhé.
          </p>
          <Link
            to="/shop"
            className="btn-white mt-6 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800"
          >
            Xem sản phẩm
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {mine.map((order) => {
            const itemCount = order.items.reduce(
              (sum, item) => sum + (item.quantity ?? 0),
              0,
            )
            const deliveryDate = formatDeliveryDate(order.estimated_delivery)
            const paymentLabel =
              PAYMENT_LABELS[order.payment_method ?? 'cod'] ??
              'Thanh toán khi nhận hàng (COD)'
            return (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div>
                  <p className="font-bold text-emerald-900">
                    Đơn hàng #{order.id}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('vi-VN')}{' '}
                    · {itemCount} sản phẩm
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {paymentLabel}
                    {order.payment_status === 'paid'
                      ? ' · Đã thanh toán'
                      : ' · Chưa thanh toán'}
                    {order.tracking_code && (
                      <> · Mã vận đơn: {order.tracking_code}</>
                    )}
                    {deliveryDate && <> · Giao dự kiến: {deliveryDate}</>}
                  </p>
                  {(order.subtotal !== undefined ||
                    (order.discount_amount ?? 0) > 0 ||
                    (order.shipping_fee ?? 0) > 0) && (
                    <p className="mt-1 text-sm text-gray-500">
                      Tạm tính{' '}
                      {formatVND(order.subtotal ?? order.total)}
                      {(order.discount_amount ?? 0) > 0 && (
                        <> · Giảm giá −{formatVND(order.discount_amount ?? 0)}</>
                      )}
                      {' · '}Phí ship{' '}
                      {(order.shipping_fee ?? 0) === 0
                        ? 'miễn phí'
                        : formatVND(order.shipping_fee ?? 0)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <span className="font-bold text-emerald-800">
                    {formatVND(order.total)}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
