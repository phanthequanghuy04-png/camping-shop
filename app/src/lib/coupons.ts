/* Lucian UX/UI Prompt #445 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#445
   Mã giảm giá của shop + ngưỡng miễn phí vận chuyển (dùng chung cho
   CouponBox ở trang Thanh toán và thanh tiến trình trong CartDrawer). */

/** Đơn từ 500.000₫ được miễn phí vận chuyển (ngưỡng cho thanh #240). */
export const FREE_SHIPPING_THRESHOLD = 500_000

export interface Coupon {
  code: string
  /** % giảm trên tạm tính. */
  percent: number
  /** Số tiền giảm tối đa (VND). */
  maxDiscount: number
  /** Tiêu đề in trên vé mã (phần trái của vé #445). */
  title: string
  /** Ghi chú in trên vé (phần phải của vé #445). */
  note: string
}

export const COUPONS: Record<string, Coupon> = {
  CAMP10: {
    code: 'CAMP10',
    percent: 10,
    maxDiscount: 200_000,
    title: 'Mã thành viên mới',
    note: 'Giảm tối đa 200.000₫ · HSD 31/12/2026',
  },
}

/** Tìm mã (không phân biệt hoa/thường, bỏ khoảng trắng). */
export function getCoupon(rawCode: string): Coupon | undefined {
  const code = rawCode.trim().toUpperCase().replace(/\s/g, '')
  return code ? COUPONS[code] : undefined
}

/** Số tiền được giảm trên tạm tính (làm tròn xuống nghìn đồng). */
export function computeDiscount(coupon: Coupon, subtotal: number): number {
  if (subtotal <= 0) return 0
  const raw = (subtotal * coupon.percent) / 100
  return Math.min(Math.floor(raw / 1000) * 1000, coupon.maxDiscount)
}
