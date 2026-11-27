// Ước tính tiền đơn hàng ở phía client — MIRROR của server/src/pricing.js.
// CHỈ để hiển thị lúc checkout; server tính lại khi tạo đơn và con số của
// server mới là cuối cùng (đơn API trả về subtotal/discount_amount/
// shipping_fee/total đã tính sẵn — trang thành công dùng số đó).
import {
  computeDiscount,
  FREE_SHIPPING_THRESHOLD,
  type Coupon,
} from './coupons'

export type ShippingRegion = 'hanoi' | 'hcm' | 'other'
export type PaymentMethod = 'cod' | 'bank_transfer'

export const PAYMENT_METHODS: {
  value: PaymentMethod
  label: string
  note: string
}[] = [
  {
    value: 'cod',
    label: 'Thanh toán khi nhận hàng (COD)',
    note: 'Nhận hàng rồi mới trả tiền — shop gọi điện xác nhận trước khi giao.',
  },
  {
    value: 'bank_transfer',
    label: 'Chuyển khoản ngân hàng / VietQR',
    note: 'Quét mã VietQR sau khi đặt hàng — đơn được ưu tiên đóng gói sớm.',
  },
]

export const SHIPPING_REGIONS: {
  value: ShippingRegion
  label: string
  fee: number
  days: string
}[] = [
  {
    value: 'hanoi',
    label: 'Nội thành Hà Nội',
    fee: 20_000,
    days: '1–2 ngày',
  },
  {
    value: 'hcm',
    label: 'Nội thành TP. Hồ Chí Minh',
    fee: 20_000,
    days: '1–2 ngày',
  },
  { value: 'other', label: 'Tỉnh/thành khác', fee: 30_000, days: '2–4 ngày' },
]

/** Phí ship ước tính: miễn phí khi tạm tính (trước giảm giá) đủ ngưỡng. */
export function calcShippingFee(
  subtotal: number,
  region: ShippingRegion,
): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0
  return (
    SHIPPING_REGIONS.find((r) => r.value === region)?.fee ?? 30_000
  )
}

/** Ngày giao dự kiến (muộn nhất), dạng dd/mm/yyyy — ước tính. */
export function estimateDeliveryDate(
  region: ShippingRegion,
  from = new Date(),
): string {
  const days = region === 'other' ? 4 : 2
  const date = new Date(from)
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('vi-VN')
}

/** Ngày giao dự kiến dạng ISO yyyy-mm-dd (để lưu đơn local). */
export function estimateDeliveryISO(
  region: ShippingRegion,
  from = new Date(),
): string {
  const days = region === 'other' ? 4 : 2
  const date = new Date(from)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function calcDiscountAmount(
  coupon: Coupon | null,
  subtotal: number,
): number {
  return coupon ? computeDiscount(coupon, subtotal) : 0
}
