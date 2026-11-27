import type { Category, Product } from './types'

export type { Category, Product } from './types'

/**
 * Dữ liệu mẫu khớp đúng camping.sql (8 danh mục, 28 sản phẩm).
 * - id / name / price (VND) / quantity / status / id_category /
 *   description / rating: sao chép đúng từ câu INSERT trong camping.sql.
 * - created_at: trong SQL không ghi rõ nên dùng DEFAULT CURRENT_TIMESTAMP;
 *   ở đây ghi thống nhất '2026-11-27T00:00:00+07:00' (ngày import dữ liệu mẫu).
 * - image: ảnh riêng từng sản phẩm, file local trong `public/images/`,
 *   tên file khớp đúng cột `image` trong camping.sql
 *   (vd '/images/leu-trai-2-nguoi.jpg'). Ảnh nguồn Unsplash (miễn phí),
 *   tải về ngày 2026-11-27, mỗi sản phẩm 1 file riêng, không dùng chung.
 *   Một số ảnh là ảnh minh họa đúng bối cảnh (lều/trại/đèn...) thay vì
 *   ảnh chụp đúng mẫu sản phẩm — xem ghi chú trong báo cáo việc 4/8.
 */

const CREATED_AT = '2026-11-27T00:00:00+07:00'

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Lều trại' },
  { id: 2, name: 'Túi ngủ' },
  { id: 3, name: 'Bếp & dụng cụ nấu' },
  { id: 4, name: 'Đèn & pin' },
  { id: 5, name: 'Ba lô' },
  { id: 6, name: 'Bàn ghế cắm trại' },
  { id: 7, name: 'Quần áo & giày' },
  { id: 8, name: 'Phụ kiện' },
]

/** Bí danh giữ tương thích với code cũ dùng tên thường. */
export const categories: Category[] = CATEGORIES

export const PRODUCTS: Product[] = [
  // 1. Lều trại (file gốc: leu-trai-*.jpg)
  { id: 1, name: 'Lều trại 2 người Naturehike Cloud Up 2', image: '/images/leu-trai-2-nguoi.jpg', price: 2890000, quantity: 15, status: 1, id_category: 1, description: 'Lều 2 người siêu nhẹ, chống mưa tốt, dựng nhanh trong 5 phút.', rating: 4.8, created_at: CREATED_AT },
  { id: 2, name: 'Lều trại 4 người Coleman Sundome 4', image: '/images/leu-trai-4-nguoi.jpg', price: 4500000, quantity: 10, status: 1, id_category: 1, description: 'Lều 4 người rộng rãi, thoáng khí, phù hợp cắm trại gia đình cuối tuần.', rating: 4.7, created_at: CREATED_AT },
  { id: 3, name: 'Lều trại gia đình 6 người Decathlon Quechua Arpenaz 6.3', image: '/images/leu-trai-gia-dinh-6-nguoi.jpg', price: 6900000, quantity: 8, status: 1, id_category: 1, description: 'Lều gia đình 6 người có 2 phòng ngủ riêng, chống nắng và chống mưa tốt.', rating: 4.6, created_at: CREATED_AT },
  { id: 4, name: 'Lều cắm trại tự bung 2 người Naturehike', image: '/images/leu-trai-tu-bung.jpg', price: 1590000, quantity: 20, status: 1, id_category: 1, description: 'Lều tự bung tiện lợi, mở ra là dùng ngay, gấp gọn chỉ trong vài giây.', rating: 4.5, created_at: CREATED_AT },
  // 2. Túi ngủ (file gốc: tui-ngu-*.jpg)
  { id: 5, name: 'Túi ngủ mùa đông Naturehike ULG700', image: '/images/tui-ngu-mua-dong.jpg', price: 2450000, quantity: 12, status: 1, id_category: 2, description: 'Túi ngủ lông vũ chịu lạnh tới -7 độ, nhẹ và ấm cho mùa đông vùng cao.', rating: 4.8, created_at: CREATED_AT },
  { id: 6, name: 'Túi ngủ 3 mùa Coleman Brazos', image: '/images/tui-ngu-3-mua.jpg', price: 1290000, quantity: 18, status: 1, id_category: 2, description: 'Túi ngủ 3 mùa êm ái, thoáng mát, phù hợp cắm trại xuân hè thu.', rating: 4.6, created_at: CREATED_AT },
  { id: 7, name: 'Túi ngủ đôi Decathlon Quechua', image: '/images/tui-ngu-doi.jpg', price: 1890000, quantity: 9, status: 1, id_category: 2, description: 'Túi ngủ đôi rộng rãi cho 2 người, có thể tách thành 2 túi đơn khi cần.', rating: 4.5, created_at: CREATED_AT },
  { id: 8, name: 'Túi ngủ siêu nhẹ Naturehike LW180', image: '/images/tui-ngu-sieu-nhe.jpg', price: 890000, quantity: 25, status: 1, id_category: 2, description: 'Túi ngủ siêu nhẹ chỉ 700g, gọn trong ba lô, lý tưởng cho trekking.', rating: 4.4, created_at: CREATED_AT },
  // 3. Bếp & dụng cụ nấu (file gốc: bep-ga-mini.jpg, bo-noi-da-ngoai.jpg, bep-cui-gap-gon.jpg, binh-giu-nhiet.jpg)
  { id: 9, name: 'Bếp ga mini dã ngoại Fire-Maple', image: '/images/bep-ga-mini.jpg', price: 650000, quantity: 30, status: 1, id_category: 3, description: 'Bếp ga mini gấp gọn, lửa mạnh và ổn định, nấu nhanh ngoài trời.', rating: 4.7, created_at: CREATED_AT },
  { id: 10, name: 'Bộ nồi nấu ăn dã ngoại Naturehike 4 món', image: '/images/bo-noi-da-ngoai.jpg', price: 890000, quantity: 22, status: 1, id_category: 3, description: 'Bộ nồi nhôm 4 món nhẹ, chống dính, xếp gọn vào nhau tiết kiệm diện tích.', rating: 4.6, created_at: CREATED_AT },
  { id: 11, name: 'Bếp củi gấp gọn Lixada', image: '/images/bep-cui-gap-gon.jpg', price: 450000, quantity: 28, status: 1, id_category: 3, description: 'Bếp củi inox gấp gọn, đốt bằng củi khô, tiện mang theo khi trekking.', rating: 4.3, created_at: CREATED_AT },
  { id: 12, name: 'Bình giữ nhiệt Stanley 1L', image: '/images/binh-giu-nhiet.jpg', price: 990000, quantity: 35, status: 1, id_category: 3, description: 'Bình giữ nhiệt 1 lít giữ nóng 24 giờ, giữ lạnh 24 giờ, bền và chắc chắn.', rating: 4.8, created_at: CREATED_AT },
  // 4. Đèn & pin (file gốc: den-*.jpg)
  { id: 13, name: 'Đèn lồng LED cắm trại Naturehike', image: '/images/den-long-led.jpg', price: 350000, quantity: 40, status: 1, id_category: 4, description: 'Đèn lồng LED sáng dịu, pin dùng 30 giờ, có móc treo tiện lợi trong lều.', rating: 4.6, created_at: CREATED_AT },
  { id: 14, name: 'Đèn pin đội đầu Petzl Actik', image: '/images/den-pin-doi-dau.jpg', price: 1150000, quantity: 20, status: 1, id_category: 4, description: 'Đèn đội đầu sáng 450 lumen, chống nước, rảnh tay khi đi rừng ban đêm.', rating: 4.8, created_at: CREATED_AT },
  { id: 15, name: 'Đèn dây trang trí lều 10m', image: '/images/den-day-trang-tri.jpg', price: 290000, quantity: 32, status: 1, id_category: 4, description: 'Dây đèn LED 10m trang trí lều ấm cúng, chống nước, dùng pin sạc USB.', rating: 4.4, created_at: CREATED_AT },
  { id: 16, name: 'Đèn pin siêu sáng Nitecore', image: '/images/den-pin-sieu-sang.jpg', price: 890000, quantity: 15, status: 1, id_category: 4, description: 'Đèn pin cầm tay siêu sáng 1000 lumen, pin sạc, nhỏ gọn bỏ túi áo.', rating: 4.7, created_at: CREATED_AT },
  // 5. Ba lô (file gốc: ba-lo-*.jpg)
  { id: 17, name: 'Ba lô leo núi Osprey Atmos 65L', image: '/images/ba-lo-leo-nui-65l.jpg', price: 5900000, quantity: 6, status: 1, id_category: 5, description: 'Ba lô leo núi 65 lít, lưng lưới thoáng khí, đeo êm cho chuyến đi dài ngày.', rating: 4.9, created_at: CREATED_AT },
  { id: 18, name: 'Ba lô trekking Deuter Futura 32L', image: '/images/ba-lo-trekking-32l.jpg', price: 3450000, quantity: 10, status: 1, id_category: 5, description: 'Ba lô trekking 32 lít, ôm lưng tốt, đủ đồ cho chuyến đi 2-3 ngày.', rating: 4.7, created_at: CREATED_AT },
  { id: 19, name: 'Ba lô dã ngoại Naturehike 55L', image: '/images/ba-lo-da-ngoai-55l.jpg', price: 1450000, quantity: 16, status: 1, id_category: 5, description: 'Ba lô dã ngoại 55 lít chống nước nhẹ, nhiều ngăn, giá tốt cho người mới.', rating: 4.5, created_at: CREATED_AT },
  // 6. Bàn ghế cắm trại (file gốc: ghe-xep-da-ngoai.jpg, ban-gap-nhom.jpg, ghe-vong-xep-gon.jpg)
  { id: 20, name: 'Ghế xếp dã ngoại Naturehike', image: '/images/ghe-xep-da-ngoai.jpg', price: 590000, quantity: 24, status: 1, id_category: 6, description: 'Ghế xếp khung nhôm nhẹ, chịu tải 120kg, gấp gọn mang theo dễ dàng.', rating: 4.6, created_at: CREATED_AT },
  { id: 21, name: 'Bàn gấp nhôm dã ngoại Coleman', image: '/images/ban-gap-nhom.jpg', price: 1190000, quantity: 12, status: 1, id_category: 6, description: 'Bàn gấp nhôm chắc chắn, mặt bàn rộng, xếp gọn như vali khi di chuyển.', rating: 4.7, created_at: CREATED_AT },
  { id: 22, name: 'Ghế võng xếp gọn', image: '/images/ghe-vong-xep-gon.jpg', price: 750000, quantity: 18, status: 1, id_category: 6, description: 'Ghế võng xếp gọn thư giãn bên lửa trại, vải bền, khung thép chắc chắn.', rating: 4.2, created_at: CREATED_AT },
  // 7. Quần áo & giày (file gốc: ao-khoac-chong-nuoc.jpg, giay-leo-nui.jpg, ao-giu-nhiet.jpg)
  { id: 23, name: 'Áo khoác chống nước The North Face', image: '/images/ao-khoac-chong-nuoc.jpg', price: 2890000, quantity: 14, status: 1, id_category: 7, description: 'Áo khoác chống nước, chống gió, thoáng khí, mặc được cả đi mưa rừng.', rating: 4.7, created_at: CREATED_AT },
  { id: 24, name: 'Giày leo núi Salomon X Ultra 4', image: '/images/giay-leo-nui.jpg', price: 3990000, quantity: 9, status: 1, id_category: 7, description: 'Giày leo núi đế bám tốt, chống nước, êm chân trên địa hình đá dốc.', rating: 4.8, created_at: CREATED_AT },
  { id: 25, name: 'Áo giữ nhiệt Columbia', image: '/images/ao-giu-nhiet.jpg', price: 690000, quantity: 26, status: 1, id_category: 7, description: 'Áo giữ nhiệt mặc lót bên trong, ấm nhẹ, thấm mồ hôi tốt khi vận động.', rating: 4.5, created_at: CREATED_AT },
  // 8. Phụ kiện (file gốc: tham-cach-nhiet.jpg, dao-da-nang.jpg, bo-so-cuu.jpg)
  { id: 26, name: 'Thảm cách nhiệt Naturehike', image: '/images/tham-cach-nhiet.jpg', price: 390000, quantity: 38, status: 1, id_category: 8, description: 'Thảm cách nhiệt trải lều êm lưng, chống ẩm từ mặt đất, cuộn gọn nhẹ.', rating: 4.5, created_at: CREATED_AT },
  { id: 27, name: 'Dao đa năng Victorinox', image: '/images/dao-da-nang.jpg', price: 890000, quantity: 21, status: 1, id_category: 8, description: 'Dao đa năng 12 chức năng, thép không gỉ, nhỏ gọn cho mọi chuyến đi rừng.', rating: 4.9, created_at: CREATED_AT },
  { id: 28, name: 'Bộ dụng cụ sơ cứu dã ngoại', image: '/images/bo-so-cuu.jpg', price: 250000, quantity: 45, status: 1, id_category: 8, description: 'Bộ sơ cứu dã ngoại đầy đủ băng gạc và thuốc cơ bản, túi chống nước.', rating: 4.3, created_at: CREATED_AT },
]

/** Bí danh giữ tương thích với code cũ dùng tên thường. */
export const products: Product[] = PRODUCTS

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Định dạng giá VND theo chuẩn vi-VN, vd: 2.890.000 ₫ */
export function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}

/** Chỉ lấy sản phẩm đang bán (status = 1, như dự án cũ). */
export function getActiveProducts(): Product[] {
  return PRODUCTS.filter((p) => p.status === 1)
}

export function getCategoryById(id: number): Category | undefined {
  return CATEGORIES.find((c) => c.id === id)
}

export function getProductById(id: number): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

/** Sản phẩm đang bán thuộc một danh mục. */
export function getProductsByCategory(categoryId: number): Product[] {
  return PRODUCTS.filter((p) => p.id_category === categoryId && p.status === 1)
}

/** Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu, vd: "leu" khớp "Lều". */
function removeDiacritics(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

/**
 * Tìm theo tên sản phẩm, chỉ lấy sản phẩm đang bán (status = 1, như dự án cũ).
 * Trả về toàn bộ sản phẩm đang bán khi từ khóa rỗng.
 */
export function searchProducts(q: string): Product[] {
  const keyword = removeDiacritics(q.trim())
  if (!keyword) return getActiveProducts()
  return PRODUCTS.filter(
    (p) => p.status === 1 && removeDiacritics(p.name).includes(keyword),
  )
}
