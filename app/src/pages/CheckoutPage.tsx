import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatVND, useCart } from '../context/CartContext'
import { getSessionUser } from '../data/users'
import type { Order, OrderItem, OrderStatus } from '../data/types'
import { createOrderApi } from '../lib/api'
import CheckoutSteps from '../components/CheckoutSteps'
import CouponBox from '../components/CouponBox'
import { computeDiscount, type Coupon } from '../lib/coupons'

/** Key lưu đơn hàng trong localStorage. */
export const ORDERS_STORAGE_KEY = 'camping-orders'

/** Đơn hàng đã lưu: khớp kiểu Order trong types.ts + chi tiết items. */
export interface StoredOrder extends Order {
  items: OrderItem[]
  /** Mã giảm giá đã áp (nếu có) + số tiền đã giảm — chỉ lưu local. */
  coupon_code?: string
  discount?: number
}

function loadOrders(): StoredOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as StoredOrder[]) : []
  } catch {
    return []
  }
}

/** SĐT Việt Nam: đúng 10 chữ số (bỏ khoảng trắng/dấu gạch ngang khi nhập). */
function isValidPhone(phone: string): boolean {
  return /^\d{10}$/.test(phone.replace(/[\s-]/g, ''))
}

export default function CheckoutPage() {
  const { detailedItems, totalQty, totalPrice, clearCart } = useCart()
  const sessionUser = getSessionUser()
  const navigate = useNavigate()

  // #445 Lucian — mã giảm giá: CAMP10 giảm 10% (tối đa 200.000₫).
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const discount = appliedCoupon
    ? computeDiscount(appliedCoupon, totalPrice)
    : 0
  const payable = totalPrice - discount

  const [customerName, setCustomerName] = useState(sessionUser?.name ?? '')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState(sessionUser?.phone ?? '')
  const [error, setError] = useState('')
  const [placedOrder, setPlacedOrder] = useState<StoredOrder | null>(null)
  // 'api' = đơn đã lưu vào DB qua API; 'local' = API lỗi nên lưu localStorage.
  const [orderSource, setOrderSource] = useState<'api' | 'local' | null>(null)
  // Chụp lại mã + số tiền giảm lúc đặt hàng (giỏ sẽ bị xóa ngay sau đó).
  const [orderCoupon, setOrderCoupon] = useState<Coupon | null>(null)
  const [orderDiscount, setOrderDiscount] = useState(0)

  // Màn hình thành công kiểu SweetAlert (chỉ dùng div + Tailwind, không cài thêm lib).
  if (placedOrder) {
    // Đơn local đã lưu tổng sau giảm; đơn API thì server tính tổng chưa
    // giảm nên trừ mã giảm giá ở đây để ra số tiền cần thanh toán.
    const successSubtotal =
      orderSource === 'local'
        ? placedOrder.total + orderDiscount
        : placedOrder.total
    const successPayable =
      orderSource === 'local'
        ? placedOrder.total
        : placedOrder.total - orderDiscount
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-lg">
          <p
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700"
            aria-hidden="true"
          >
            ✓
          </p>
          <h1 className="mt-4 text-2xl font-bold text-emerald-900">
            Đặt hàng thành công!
          </h1>
          <p className="mt-3 text-gray-600">
            Cảm ơn {placedOrder.customer_name} đã đặt hàng. Chúng tôi sẽ liên
            hệ qua số {placedOrder.phone} để xác nhận đơn hàng.
          </p>
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-left text-sm text-gray-700">
            Mã đơn hàng:{' '}
            <span className="font-bold text-emerald-800">
              #{placedOrder.id}
            </span>
            <br />
            {orderDiscount > 0 && (
              <>
                Tạm tính:{' '}
                <span className="font-bold text-emerald-800">
                  {formatVND(successSubtotal)}
                </span>
                <br />
                Giảm giá ({orderCoupon?.code ?? 'mã giảm giá'}):{' '}
                <span className="font-bold text-emerald-800">
                  −{formatVND(orderDiscount)}
                </span>
                <br />
              </>
            )}
            Tổng tiền:{' '}
            <span className="font-bold text-emerald-800">
              {formatVND(successPayable)}
            </span>
            <br />
            Trạng thái: Chờ xử lý
            <br />
            <span className="text-xs text-gray-500">
              {orderSource === 'api'
                ? 'Đơn đã lưu vào hệ thống qua API.'
                : 'API chưa chạy nên đơn tạm lưu trên trình duyệt này.'}
            </span>
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/shop"
              className="rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800"
            >
              Tiếp tục mua sắm
            </Link>
            <Link
              to="/"
              className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (detailedItems.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-emerald-900 sm:text-3xl">
          Giỏ hàng của bạn đang trống
        </h1>
        <p className="mt-3 text-gray-600">
          Bạn cần thêm sản phẩm vào giỏ trước khi thanh toán.
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800"
        >
          Tiếp tục mua sắm
        </Link>
      </main>
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = customerName.trim()
    const addr = address.trim()
    const phoneDigits = phone.replace(/[\s-]/g, '')

    if (!name) {
      setError('Vui lòng nhập họ tên người nhận.')
      return
    }
    if (!addr) {
      setError('Vui lòng nhập địa chỉ giao hàng.')
      return
    }
    if (!phoneDigits) {
      setError('Vui lòng nhập số điện thoại.')
      return
    }
    if (!isValidPhone(phoneDigits)) {
      setError('Số điện thoại phải có đúng 10 chữ số (ví dụ: 0912345678).')
      return
    }

    // Thử tạo đơn qua API trước (trừ tồn kho + xóa giỏ phía server).
    // API lỗi (chưa chạy / hết hàng...) -> fallback lưu localStorage như trước.
    // Mã giảm giá gửi kèm coupon_code (server hiện chưa tính giảm giá —
    // xem DEPLOY.md; màn hình thành công trừ mã ở phía client).
    try {
      const created = await createOrderApi({
        user_id: sessionUser?.id ?? null,
        customer_name: name,
        phone: phoneDigits,
        address: addr,
        coupon_code: appliedCoupon?.code,
        items: detailedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      })
      setOrderCoupon(appliedCoupon)
      setOrderDiscount(discount)
      clearCart()
      setError('')
      setOrderSource('api')
      setPlacedOrder({
        ...created,
        items: created.items.map((item) => ({
          id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
      })
      return
    } catch (apiError) {
      // Hết hàng là lỗi nghiệp vụ từ API: báo luôn, không fallback local.
      const message =
        apiError instanceof Error ? apiError.message : 'Đặt hàng thất bại.'
      if (message.includes('trong kho') || message.includes('ngừng bán')) {
        setError(message)
        return
      }
      // Còn lại (API chưa chạy / mất mạng): fallback localStorage bên dưới.
    }

    const orderId = Date.now()
    const order: StoredOrder = {
      id: orderId,
      user_id: sessionUser?.id ?? null,
      total: payable,
      status: 'pending' as OrderStatus,
      address: addr,
      phone: phoneDigits,
      customer_name: name,
      created_at: new Date().toISOString(),
      coupon_code: appliedCoupon?.code,
      discount,
      items: detailedItems.map((item, index) => ({
        id: orderId * 1000 + index,
        order_id: orderId,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.unitPrice,
      })),
    }

    try {
      localStorage.setItem(
        ORDERS_STORAGE_KEY,
        JSON.stringify([...loadOrders(), order]),
      )
    } catch {
      setError('Không lưu được đơn hàng. Vui lòng thử lại.')
      return
    }

    clearCart()
    setError('')
    setOrderSource('local')
    setOrderCoupon(appliedCoupon)
    setOrderDiscount(discount)
    setPlacedOrder(order)
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100'

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-emerald-900 sm:text-3xl">
        Thanh toán
      </h1>

      {/* #444 Lucian — các bước: Giỏ hàng (xong) -> Giao hàng (hiện tại) ->
          Thanh toán -> Hoàn tất. Bấm bước Giỏ hàng để quay lại /cart. */}
      <div className="mt-6">
        <CheckoutSteps
          current={1}
          onStepClick={(step) => {
            if (step === 0) navigate('/cart')
          }}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-3"
          noValidate
        >
          <h2 className="text-lg font-semibold text-gray-900">
            Thông tin giao hàng
          </h2>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
            >
              {error}
            </p>
          )}

          <label className="mt-4 block">
            <span className="text-sm font-medium text-gray-700">
              Họ tên người nhận <span className="text-red-600">*</span>
            </span>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              autoComplete="name"
              className={`${inputClass} mt-1`}
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-gray-700">
              Địa chỉ giao hàng <span className="text-red-600">*</span>
            </span>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
              autoComplete="street-address"
              rows={3}
              className={`${inputClass} mt-1 resize-y`}
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-gray-700">
              Số điện thoại <span className="text-red-600">*</span>
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912345678"
              autoComplete="tel"
              inputMode="numeric"
              className={`${inputClass} mt-1`}
            />
            <span className="mt-1 block text-xs text-gray-500">
              Số điện thoại gồm đúng 10 chữ số.
            </span>
          </label>

          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white hover:bg-emerald-800"
          >
            Đặt hàng — {formatVND(payable)}
          </button>
        </form>

        <section className="h-fit rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Tóm tắt đơn hàng
          </h2>
          <ul className="mt-4 space-y-3">
            {detailedItems.map((item) => (
              <li
                key={item.productId}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <span className="text-gray-700">
                  {item.product?.name ?? `Sản phẩm #${item.productId}`}
                  <span className="text-gray-500"> × {item.quantity}</span>
                </span>
                <span className="shrink-0 font-medium text-gray-900">
                  {formatVND(item.subtotal)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-gray-200 pt-4">
            {/* #445 Lucian — vé mã giảm giá + ô nhập mã. */}
            <CouponBox
              subtotal={totalPrice}
              applied={appliedCoupon}
              discount={discount}
              onApply={setAppliedCoupon}
              onRemove={() => setAppliedCoupon(null)}
            />
            <p className="mt-4 flex justify-between text-sm text-gray-600">
              <span>Số lượng</span>
              <span>{totalQty} sản phẩm</span>
            </p>
            <p className="mt-2 flex justify-between text-sm text-gray-600">
              <span>Tạm tính</span>
              <span>{formatVND(totalPrice)}</span>
            </p>
            {appliedCoupon && discount > 0 && (
              <p className="mt-2 flex justify-between text-sm font-medium text-emerald-700">
                <span>Giảm giá ({appliedCoupon.code})</span>
                <span>−{formatVND(discount)}</span>
              </p>
            )}
            <p className="mt-2 flex justify-between text-base font-bold text-emerald-800">
              <span>Tổng tiền</span>
              <span>{formatVND(payable)}</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Thanh toán khi nhận hàng (COD).
            </p>
          </div>
          <Link
            to="/cart"
            className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline"
          >
            ← Quay lại giỏ hàng
          </Link>
        </section>
      </div>
    </main>
  )
}
