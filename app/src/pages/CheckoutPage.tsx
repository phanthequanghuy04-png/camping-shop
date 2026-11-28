import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatVND, useCart } from '../context/CartContext'
import { getSessionUser } from '../data/users'
import { showToast } from '../lib/toast'
import type { Order, OrderItem, OrderStatus } from '../data/types'
import { createOrderApi } from '../lib/api'
import CheckoutSteps from '../components/CheckoutSteps'
import CouponBox from '../components/CouponBox'
import { computeDiscount, type Coupon } from '../lib/coupons'
import {
  calcShippingFee,
  estimateDeliveryDate,
  estimateDeliveryISO,
  PAYMENT_METHODS,
  SHIPPING_REGIONS,
  type PaymentMethod,
  type ShippingRegion,
} from '../lib/pricing'
import { getBankConfig, vietQrUrl } from '../lib/bankTransfer'

/** Key lưu đơn hàng trong localStorage. */
export const ORDERS_STORAGE_KEY = 'camping-orders'

/** Đơn hàng đã lưu: khớp kiểu Order trong types.ts + chi tiết items. */
export interface StoredOrder extends Order {
  items: OrderItem[]
  /** Số tiền đã giảm — chỉ lưu local (trùng discount_amount của Order). */
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

  // Thanh toán cần đăng nhập: khách vãng lai được chuyển sang /login,
  // đăng nhập xong quay lại /checkout (giỏ cũ vẫn còn trong localStorage).
  useEffect(() => {
    if (!getSessionUser()) {
      showToast('Bạn cần đăng nhập để thanh toán.')
      navigate('/login', { state: { from: '/checkout' } })
    }
  }, [navigate])

  // #445 Lucian — mã giảm giá: CAMP10 giảm 10% (tối đa 200.000₫).
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const discount = appliedCoupon
    ? computeDiscount(appliedCoupon, totalPrice)
    : 0
  // Thanh toán + giao hàng: phí ship tính trên tạm tính (khớp server),
  // miễn phí khi tạm tính >= 500.000₫ (xem lib/pricing.ts).
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [shippingRegion, setShippingRegion] =
    useState<ShippingRegion>('other')
  const shippingFee = calcShippingFee(totalPrice, shippingRegion)
  const deliveryDateText = estimateDeliveryDate(shippingRegion)
  const payable = totalPrice - discount + shippingFee

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
    // Server đã tính sẵn toàn bộ (tạm tính, giảm giá, phí ship, tổng cuối)
    // khi đơn qua API; đơn local fallback cũng lưu đủ các trường này lúc tạo.
    const successSubtotal =
      placedOrder.subtotal ?? placedOrder.total + orderDiscount
    const successDiscount =
      placedOrder.discount_amount ?? orderDiscount
    const successShipping = placedOrder.shipping_fee ?? 0
    const successPayable = placedOrder.total
    const successPaymentMethod = placedOrder.payment_method ?? 'cod'
    const successDelivery = placedOrder.estimated_delivery
      ? new Date(placedOrder.estimated_delivery).toLocaleDateString('vi-VN')
      : null
    const bankConfig =
      successPaymentMethod === 'bank_transfer' ? getBankConfig() : null
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
            Tạm tính:{' '}
            <span className="font-bold text-emerald-800">
              {formatVND(successSubtotal)}
            </span>
            <br />
            {successDiscount > 0 && (
              <>
                Giảm giá ({orderCoupon?.code ?? placedOrder.coupon_code ?? 'mã giảm giá'}):{' '}
                <span className="font-bold text-emerald-800">
                  −{formatVND(successDiscount)}
                </span>
                <br />
              </>
            )}
            Phí vận chuyển:{' '}
            <span className="font-bold text-emerald-800">
              {successShipping === 0
                ? 'Miễn phí'
                : formatVND(successShipping)}
            </span>
            <br />
            Tổng tiền:{' '}
            <span className="font-bold text-emerald-800">
              {formatVND(successPayable)}
            </span>
            <br />
            Thanh toán:{' '}
            {successPaymentMethod === 'bank_transfer'
              ? 'Chuyển khoản ngân hàng / VietQR'
              : 'Thanh toán khi nhận hàng (COD)'}
            <br />
            {successDelivery && (
              <>
                Giao dự kiến: {successDelivery}
                <br />
              </>
            )}
            Trạng thái: Chờ xử lý
            <br />
            <span className="text-xs text-gray-500">
              {orderSource === 'api'
                ? 'Đơn đã lưu vào hệ thống qua API.'
                : 'API chưa chạy nên đơn tạm lưu trên trình duyệt này.'}
            </span>
          </p>
          {successPaymentMethod === 'bank_transfer' && (
            <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-left text-sm text-gray-700">
              {bankConfig ? (
                <>
                  <p className="font-semibold text-sky-900">
                    Chuyển khoản để shop đóng gói sớm:
                  </p>
                  <img
                    src={vietQrUrl(
                      bankConfig,
                      successPayable,
                      placedOrder.id,
                    )}
                    alt="Mã VietQR thanh toán đơn hàng"
                    className="mx-auto mt-3 h-48 w-48 rounded-lg bg-white p-2"
                  />
                  <p className="mt-3">
                    Ngân hàng: {bankConfig.bankName}
                    <br />
                    Số tài khoản:{' '}
                    <span className="font-bold">{bankConfig.accountNumber}</span>
                    <br />
                    Chủ tài khoản: {bankConfig.accountName}
                    <br />
                    Số tiền:{' '}
                    <span className="font-bold">
                      {formatVND(successPayable)}
                    </span>
                    <br />
                    Nội dung: CampingShop DH{placedOrder.id}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Quét mã bằng app ngân hàng bất kỳ. Shop xác nhận tiền
                    về rồi mới giao hàng.
                  </p>
                </>
              ) : (
                <p>
                  Bạn đã chọn chuyển khoản. Shop sẽ liên hệ qua số{' '}
                  {placedOrder.phone} để gửi thông tin chuyển khoản và xác
                  nhận đơn hàng.
                </p>
              )}
            </div>
          )}
          {successPaymentMethod === 'cod' && (
            <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-left text-sm text-gray-700">
              Bạn đã chọn thanh toán khi nhận hàng. Vui lòng chuẩn bị đủ{' '}
              <span className="font-bold">{formatVND(successPayable)}</span>{' '}
              và kiểm tra hàng trước khi trả tiền.
            </p>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/shop"
              className="btn-white rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800"
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
        <p className="mt-3 text-muted-foreground">
          Bạn cần thêm sản phẩm vào giỏ trước khi thanh toán.
        </p>
        <Link
          to="/shop"
          className="btn-white mt-8 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800"
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
    // Server tự tính giảm giá + phí ship + tổng cuối (không tin con số
    // client gửi lên); client chỉ gửi mã giảm giá, cách thanh toán và
    // khu vực giao hàng.
    try {
      const created = await createOrderApi({
        user_id: sessionUser?.id ?? null,
        customer_name: name,
        phone: phoneDigits,
        address: addr,
        coupon_code: appliedCoupon?.code,
        payment_method: paymentMethod,
        shipping_region: shippingRegion,
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
      subtotal: totalPrice,
      discount_amount: discount,
      coupon_code: appliedCoupon?.code ?? null,
      shipping_fee: shippingFee,
      shipping_method: 'standard',
      shipping_region: shippingRegion,
      payment_method: paymentMethod,
      payment_status: 'unpaid',
      tracking_code: null,
      estimated_delivery: estimateDeliveryISO(shippingRegion),
      total: payable,
      status: 'pending' as OrderStatus,
      address: addr,
      phone: phoneDigits,
      customer_name: name,
      created_at: new Date().toISOString(),
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
    <main className="checkout-page mx-auto max-w-4xl px-4 py-8">
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

          <label className="mt-4 block">
            <span className="text-sm font-medium text-gray-700">
              Khu vực giao hàng <span className="text-red-600">*</span>
            </span>
            <select
              value={shippingRegion}
              onChange={(e) =>
                setShippingRegion(e.target.value as ShippingRegion)
              }
              className={`${inputClass} mt-1`}
            >
              {SHIPPING_REGIONS.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label} — phí {formatVND(region.fee)} · giao{' '}
                  {region.days}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-gray-500">
              Miễn phí vận chuyển cho đơn từ 500.000₫.
            </span>
          </label>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-gray-700">
              Phương thức thanh toán <span className="text-red-600">*</span>
            </legend>
            <div className="mt-2 space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 ${
                    paymentMethod === method.value
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                    className="mt-1 accent-emerald-700"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">
                      {method.label}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {method.note}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

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
            <p className="mt-2 flex justify-between text-sm text-gray-600">
              <span>Phí vận chuyển</span>
              <span>
                {shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)}
              </span>
            </p>
            <p className="mt-2 flex justify-between text-sm text-gray-600">
              <span>Giao dự kiến</span>
              <span>{deliveryDateText}</span>
            </p>
            <p className="mt-2 flex justify-between text-base font-bold text-emerald-800">
              <span>Tổng tiền</span>
              <span>{formatVND(payable)}</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {paymentMethod === 'bank_transfer'
                ? 'Chuyển khoản ngân hàng / VietQR — quét mã sau khi đặt hàng.'
                : 'Thanh toán khi nhận hàng (COD).'}
            </p>
          </div>
          <Link
            to="/cart"
            className="checkout-back mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline"
          >
            ← Quay lại giỏ hàng
          </Link>
        </section>
      </div>
    </main>
  )
}
