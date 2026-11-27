/**
 * Tính tiền đơn hàng — dùng chung cho cả 2 chế độ (MySQL và fallback
 * trong bộ nhớ). Frontend có bản mirror trong app/src/lib/pricing.ts
 * CHỈ để hiển thị ước tính; server tính lại khi tạo đơn và con số của
 * server mới là con số cuối cùng.
 *
 * Quy tắc (2026-11-27, theo ý tưởng "nền tảng trước" của Huy):
 * - Mã giảm giá: CAMP10 giảm 10% trên tạm tính, tối đa 200.000₫, làm
 *   tròn xuống nghìn đồng (khớp computeDiscount trong app/src/lib/coupons.ts).
 * - Miễn phí vận chuyển khi TẠM TÍNH (trước khi trừ mã) >= 500.000₫ —
 *   tính trên tạm tính để khớp với thanh freeship trong giỏ hàng
 *   (CartDrawer cũng đo trên tạm tính, tránh trường hợp giỏ báo "đã
 *   miễn phí" nhưng lúc thanh toán lại tính phí vì mã giảm kéo tổng
 *   xuống dưới ngưỡng).
 * - Phí ship khi chưa miễn phí: nội thành Hà Nội / TP.HCM 20.000₫,
 *   tỉnh/thành khác 30.000₫. Chưa tính theo cân nặng/kích thước
 *   (cần API GHN/GHTK + cân nặng từng sản phẩm — làm ở bước sau).
 * - Ngày giao dự kiến: nội thành 1–2 ngày, tỉnh khác 2–4 ngày
 *   (không tính Chủ nhật — ước lượng, admin cập nhật lại khi giao).
 */

const FREE_SHIPPING_THRESHOLD = 500_000;

const COUPONS = {
  CAMP10: { code: 'CAMP10', percent: 10, maxDiscount: 200_000 },
};

/** Phí ship (VND) theo khu vực khi chưa đủ ngưỡng miễn phí. */
const SHIPPING_FEES = {
  hanoi: 20_000,
  hcm: 20_000,
  other: 30_000,
};

/** Số ngày giao dự kiến [sớm nhất, muộn nhất] theo khu vực. */
const SHIPPING_DAYS = {
  hanoi: [1, 2],
  hcm: [1, 2],
  other: [2, 4],
};

const REGIONS = ['hanoi', 'hcm', 'other'];
const PAYMENT_METHODS = ['cod', 'bank_transfer'];

function normalizeRegion(region) {
  return REGIONS.includes(region) ? region : 'other';
}

function normalizePaymentMethod(method) {
  return PAYMENT_METHODS.includes(method) ? method : 'cod';
}

/** Số tiền giảm theo mã (0 khi mã sai/trống). Khớp coupons.ts bên frontend. */
function calcDiscount(couponCode, subtotal) {
  if (!couponCode || subtotal <= 0) return { code: null, amount: 0 };
  const coupon = COUPONS[String(couponCode).trim().toUpperCase()];
  if (!coupon) return { code: null, amount: 0 };
  const raw = (subtotal * coupon.percent) / 100;
  const amount = Math.min(Math.floor(raw / 1000) * 1000, coupon.maxDiscount);
  return { code: coupon.code, amount };
}

function calcShippingFee(subtotal, region) {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_FEES[normalizeRegion(region)];
}

/** Ngày giao dự kiến (ISO yyyy-mm-dd), tính từ hôm nay. */
function estimateDelivery(region, from = new Date()) {
  const [minDays, maxDays] = SHIPPING_DAYS[normalizeRegion(region)];
  // "Hôm nay" theo giờ Việt Nam — server cloud chạy UTC, nếu lấy ngày
  // theo UTC thì vào khoảng 00:00–07:00 giờ VN ngày giao sẽ sớm hơn
  // thực tế 1 ngày. Tính toàn bộ bằng ngày-không-giờ (local getters)
  // để không bị toISOString() đẩy sang UTC.
  const vnToday = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(from);
  const [y, m, d] = vnToday.split('-').map(Number);
  const toISODate = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const max = new Date(y, m - 1, d);
  max.setDate(max.getDate() + maxDays);
  const min = new Date(y, m - 1, d);
  min.setDate(min.getDate() + minDays);
  return { min: toISODate(min), max: toISODate(max), date: toISODate(max) };
}

/**
 * Tính toàn bộ đơn: { subtotal, discount, discount_code, shipping_fee,
 *   shipping_method, shipping_region, total, estimated_delivery }.
 * `subtotal` = tổng giá sản phẩm × số lượng (trước giảm giá).
 */
function calcOrder({ subtotal, coupon_code, shipping_region }) {
  const region = normalizeRegion(shipping_region);
  const { code, amount: discount } = calcDiscount(coupon_code, subtotal);
  const shipping_fee = calcShippingFee(subtotal, region);
  const total = subtotal - discount + shipping_fee;
  const estimated = estimateDelivery(region);
  return {
    subtotal,
    discount_amount: discount,
    coupon_code: code,
    shipping_fee,
    shipping_method: 'standard',
    shipping_region: region,
    total,
    estimated_delivery: estimated.date,
  };
}

module.exports = {
  FREE_SHIPPING_THRESHOLD,
  COUPONS,
  SHIPPING_FEES,
  SHIPPING_DAYS,
  REGIONS,
  PAYMENT_METHODS,
  normalizeRegion,
  normalizePaymentMethod,
  calcDiscount,
  calcShippingFee,
  estimateDelivery,
  calcOrder,
};
