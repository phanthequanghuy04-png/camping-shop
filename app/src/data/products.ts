import type { Category, Product } from './types'

export type { Category, Product } from './types'

/**
 * Dữ liệu mẫu khớp đúng camping.sql (8 danh mục, 78 sản phẩm).
 * - id / name / price (VND) / quantity / status / id_category /
 *   description / rating: sao chép đúng từ câu INSERT trong camping.sql.
 * - created_at: trong SQL không ghi rõ nên dùng DEFAULT CURRENT_TIMESTAMP;
 *   ở đây ghi thống nhất '2026-11-27T00:00:00+07:00' (ngày import dữ liệu mẫu).
 * - image: ảnh riêng từng sản phẩm, file local trong `public/images/`,
 *   tên file khớp đúng cột `image` trong camping.sql
 *   (vd '/images/leu-trai-2-nguoi.webp'). Ảnh studio AI tạo từ ảnh tham
 *   chiếu thật đúng mẫu sản phẩm (làm lại toàn bộ 28 ảnh cũ + 50 ảnh mới
 *   ngày 2026-11-28): sản phẩm to, căn giữa, nền trắng ấm sáng, tương
 *   phản mạnh với nền, không chữ/watermark. Ảnh tham chiếu lưu tại
 *   `_staging/product-refs/`, ảnh cũ sao lưu tại
 *   `_staging/product-images-backup-20261128/`.
 */

const CREATED_AT = '2026-11-27T00:00:00+07:00'

/**
 * Đường dẫn ảnh dùng trong app là đường dẫn tuyệt đối từ gốc web
 * (vd '/images/leu-trai-2-nguoi.webp', khớp cột `image` trong camping.sql).
 * Khi web chạy ở đường dẫn con (vd GitHub Pages '/camping-shop/'),
 * phải thêm BASE_URL vào trước thì trình duyệt mới tải đúng file.
 * Dùng hàm này ở mọi chỗ render <img> của sản phẩm.
 */
/**
 * Ảnh giữ chỗ cho sản phẩm chưa có ảnh (vd thêm ở quản trị mà không tải
 * ảnh lên): SVG vẽ sẵn — nền kem, khung nét đứt, lều xanh rừng + chữ
 * "Chưa có ảnh". Đặt ở đây vì mọi chỗ render <img> của sản phẩm đều đi
 * qua resolveImage, nên thẻ sản phẩm, trang chi tiết, giỏ, tìm kiếm,
 * thanh mua dính đều tự có ảnh giữ chỗ mà không cần sửa từng chỗ.
 * (Huy duyệt 2026-11-28 sau đợt test thêm sản phẩm 0/3 — món không ảnh
 * trước đây hiện ô ảnh trống trên /shop.)
 */
const NO_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768" viewBox="0 0 1024 768"><rect width="1024" height="768" fill="#F7F2E6"/><rect x="24" y="24" width="976" height="720" rx="24" fill="none" stroke="#2D6A4F" stroke-opacity="0.25" stroke-width="3" stroke-dasharray="14 12"/><g fill="none" stroke="#2D6A4F" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"><path d="M512 240 L716 560 L308 560 Z"/><path d="M512 420 L584 560 L440 560 Z"/></g><text x="512" y="652" font-family="sans-serif" font-size="46" fill="#2D6A4F" text-anchor="middle">Chưa có ảnh</text></svg>`
const NO_IMAGE_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(NO_IMAGE_SVG)}`

export function resolveImage(path: string | null | undefined): string {
  if (!path) return NO_IMAGE_PLACEHOLDER
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  // DB lưu tên file trần (vd 'leu-trai-2-nguoi.webp') hoặc 'images/...':
  // đều là file trong thư mục /images của web. Đường dẫn bắt đầu '/'
  // thì giữ nguyên (vd '/images/leu-trai-2-nguoi.webp'). Trước đây tên
  // trần bị map thành '/camping-shop/<tên file>' (thiếu /images/) nên
  // ảnh nhỏ ở form Sửa quản trị bị vỡ (kiểm tra live 2026-11-28).
  if (path.startsWith('/')) return `${base}${path}`
  if (path.startsWith('images/')) return `${base}/${path}`
  return `${base}/images/${path}`
}

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
  { id: 1, name: 'Lều trại 2 người Naturehike Cloud Up 2', image: '/images/leu-trai-2-nguoi.webp', price: 2890000, quantity: 12, status: 1, id_category: 1, description: 'Lều 2 người siêu nhẹ, chống mưa tốt, dựng nhanh trong 5 phút.', rating: 4.8, created_at: CREATED_AT },
  { id: 2, name: 'Lều trại 4 người Coleman Sundome 4', image: '/images/leu-trai-4-nguoi.webp', price: 4500000, quantity: 10, status: 1, id_category: 1, description: 'Lều 4 người rộng rãi, thoáng khí, phù hợp cắm trại gia đình cuối tuần.', rating: 4.7, created_at: CREATED_AT },
  { id: 3, name: 'Lều trại gia đình 6 người Decathlon Quechua Arpenaz 6.3', image: '/images/leu-trai-gia-dinh-6-nguoi.webp', price: 6900000, quantity: 8, status: 1, id_category: 1, description: 'Lều gia đình 6 người có 2 phòng ngủ riêng, chống nắng và chống mưa tốt.', rating: 4.6, created_at: CREATED_AT },
  { id: 4, name: 'Lều cắm trại tự bung 2 người Naturehike', image: '/images/leu-trai-tu-bung.webp', price: 1590000, quantity: 20, status: 1, id_category: 1, description: 'Lều tự bung tiện lợi, mở ra là dùng ngay, gấp gọn chỉ trong vài giây.', rating: 4.5, created_at: CREATED_AT },
  // 2. Túi ngủ (file gốc: tui-ngu-*.jpg)
  { id: 5, name: 'Túi ngủ mùa đông Naturehike ULG700', image: '/images/tui-ngu-mua-dong.webp', price: 2450000, quantity: 10, status: 1, id_category: 2, description: 'Túi ngủ lông vũ chịu lạnh tới -7 độ, nhẹ và ấm cho mùa đông vùng cao.', rating: 4.8, created_at: CREATED_AT },
  { id: 6, name: 'Túi ngủ 3 mùa Coleman Brazos', image: '/images/tui-ngu-3-mua.webp', price: 1290000, quantity: 18, status: 1, id_category: 2, description: 'Túi ngủ 3 mùa êm ái, thoáng mát, phù hợp cắm trại xuân hè thu.', rating: 4.6, created_at: CREATED_AT },
  { id: 7, name: 'Túi ngủ đôi Decathlon Quechua', image: '/images/tui-ngu-doi.webp', price: 1890000, quantity: 9, status: 1, id_category: 2, description: 'Túi ngủ đôi rộng rãi cho 2 người, có thể tách thành 2 túi đơn khi cần.', rating: 4.5, created_at: CREATED_AT },
  { id: 8, name: 'Túi ngủ siêu nhẹ Naturehike LW180', image: '/images/tui-ngu-sieu-nhe.webp', price: 890000, quantity: 25, status: 1, id_category: 2, description: 'Túi ngủ siêu nhẹ chỉ 700g, gọn trong ba lô, lý tưởng cho trekking.', rating: 4.4, created_at: CREATED_AT },
  // 3. Bếp & dụng cụ nấu (file gốc: bep-ga-mini.jpg, bo-noi-da-ngoai.jpg, bep-cui-gap-gon.jpg, binh-giu-nhiet.jpg)
  { id: 9, name: 'Bếp ga mini dã ngoại Fire-Maple', image: '/images/bep-ga-mini.webp', price: 650000, quantity: 30, status: 1, id_category: 3, description: 'Bếp ga mini gấp gọn, lửa mạnh và ổn định, nấu nhanh ngoài trời.', rating: 4.7, created_at: CREATED_AT },
  { id: 10, name: 'Bộ nồi nấu ăn dã ngoại Naturehike 4 món', image: '/images/bo-noi-da-ngoai.webp', price: 890000, quantity: 22, status: 1, id_category: 3, description: 'Bộ nồi nhôm 4 món nhẹ, chống dính, xếp gọn vào nhau tiết kiệm diện tích.', rating: 4.6, created_at: CREATED_AT },
  { id: 11, name: 'Bếp củi gấp gọn Lixada', image: '/images/bep-cui-gap-gon.webp', price: 450000, quantity: 28, status: 1, id_category: 3, description: 'Bếp củi inox gấp gọn, đốt bằng củi khô, tiện mang theo khi trekking.', rating: 4.3, created_at: CREATED_AT },
  { id: 12, name: 'Bình giữ nhiệt Stanley 1L', image: '/images/binh-giu-nhiet.webp', price: 990000, quantity: 35, status: 1, id_category: 3, description: 'Bình giữ nhiệt 1 lít giữ nóng 24 giờ, giữ lạnh 24 giờ, bền và chắc chắn.', rating: 4.8, created_at: CREATED_AT },
  // 4. Đèn & pin (file gốc: den-*.jpg)
  { id: 13, name: 'Đèn lồng LED cắm trại Naturehike', image: '/images/den-long-led.webp', price: 350000, quantity: 40, status: 1, id_category: 4, description: 'Đèn lồng LED sáng dịu, pin dùng 30 giờ, có móc treo tiện lợi trong lều.', rating: 4.6, created_at: CREATED_AT },
  { id: 14, name: 'Đèn pin đội đầu Petzl Actik', image: '/images/den-pin-doi-dau.webp', price: 1150000, quantity: 20, status: 1, id_category: 4, description: 'Đèn đội đầu sáng 450 lumen, chống nước, rảnh tay khi đi rừng ban đêm.', rating: 4.8, created_at: CREATED_AT },
  { id: 15, name: 'Đèn dây trang trí lều 10m', image: '/images/den-day-trang-tri.webp', price: 290000, quantity: 32, status: 1, id_category: 4, description: 'Dây đèn LED 10m trang trí lều ấm cúng, chống nước, dùng pin sạc USB.', rating: 4.4, created_at: CREATED_AT },
  { id: 16, name: 'Đèn pin siêu sáng Nitecore', image: '/images/den-pin-sieu-sang.webp', price: 890000, quantity: 15, status: 1, id_category: 4, description: 'Đèn pin cầm tay siêu sáng 1000 lumen, pin sạc, nhỏ gọn bỏ túi áo.', rating: 4.7, created_at: CREATED_AT },
  // 5. Ba lô (file gốc: ba-lo-*.jpg)
  { id: 17, name: 'Ba lô leo núi Osprey Atmos 65L', image: '/images/ba-lo-leo-nui-65l.webp', price: 5900000, quantity: 6, status: 1, id_category: 5, description: 'Ba lô leo núi 65 lít, lưng lưới thoáng khí, đeo êm cho chuyến đi dài ngày.', rating: 4.9, created_at: CREATED_AT },
  { id: 18, name: 'Ba lô trekking Deuter Futura 32L', image: '/images/ba-lo-trekking-32l.webp', price: 3450000, quantity: 10, status: 1, id_category: 5, description: 'Ba lô trekking 32 lít, ôm lưng tốt, đủ đồ cho chuyến đi 2-3 ngày.', rating: 4.7, created_at: CREATED_AT },
  { id: 19, name: 'Ba lô dã ngoại Naturehike 55L', image: '/images/ba-lo-da-ngoai-55l.webp', price: 1450000, quantity: 16, status: 1, id_category: 5, description: 'Ba lô dã ngoại 55 lít chống nước nhẹ, nhiều ngăn, giá tốt cho người mới.', rating: 4.5, created_at: CREATED_AT },
  // 6. Bàn ghế cắm trại (file gốc: ghe-xep-da-ngoai.jpg, ban-gap-nhom.jpg, ghe-vong-xep-gon.jpg)
  { id: 20, name: 'Ghế xếp dã ngoại Naturehike', image: '/images/ghe-xep-da-ngoai.webp', price: 590000, quantity: 24, status: 1, id_category: 6, description: 'Ghế xếp khung nhôm nhẹ, chịu tải 120kg, gấp gọn mang theo dễ dàng.', rating: 4.6, created_at: CREATED_AT },
  { id: 21, name: 'Bàn gấp nhôm dã ngoại Coleman', image: '/images/ban-gap-nhom.webp', price: 1190000, quantity: 12, status: 1, id_category: 6, description: 'Bàn gấp nhôm chắc chắn, mặt bàn rộng, xếp gọn như vali khi di chuyển.', rating: 4.7, created_at: CREATED_AT },
  { id: 22, name: 'Ghế võng xếp gọn', image: '/images/ghe-vong-xep-gon.webp', price: 750000, quantity: 18, status: 1, id_category: 6, description: 'Ghế võng xếp gọn thư giãn bên lửa trại, vải bền, khung thép chắc chắn.', rating: 4.2, created_at: CREATED_AT },
  // 7. Quần áo & giày (file gốc: ao-khoac-chong-nuoc.jpg, giay-leo-nui.jpg, ao-giu-nhiet.jpg)
  { id: 23, name: 'Áo khoác chống nước The North Face', image: '/images/ao-khoac-chong-nuoc.webp', price: 2890000, quantity: 14, status: 1, id_category: 7, description: 'Áo khoác chống nước, chống gió, thoáng khí, mặc được cả đi mưa rừng.', rating: 4.7, created_at: CREATED_AT },
  { id: 24, name: 'Giày leo núi Salomon X Ultra 4', image: '/images/giay-leo-nui.webp', price: 3990000, quantity: 7, status: 1, id_category: 7, description: 'Giày leo núi đế bám tốt, chống nước, êm chân trên địa hình đá dốc.', rating: 4.8, created_at: CREATED_AT },
  { id: 25, name: 'Áo giữ nhiệt Columbia', image: '/images/ao-giu-nhiet.webp', price: 690000, quantity: 26, status: 1, id_category: 7, description: 'Áo giữ nhiệt mặc lót bên trong, ấm nhẹ, thấm mồ hôi tốt khi vận động.', rating: 4.5, created_at: CREATED_AT },
  // 8. Phụ kiện (file gốc: tham-cach-nhiet.jpg, dao-da-nang.jpg, bo-so-cuu.jpg)
  { id: 26, name: 'Thảm cách nhiệt Naturehike', image: '/images/tham-cach-nhiet.webp', price: 390000, quantity: 38, status: 1, id_category: 8, description: 'Thảm cách nhiệt trải lều êm lưng, chống ẩm từ mặt đất, cuộn gọn nhẹ.', rating: 4.5, created_at: CREATED_AT },
  { id: 27, name: 'Dao đa năng Victorinox', image: '/images/dao-da-nang.webp', price: 890000, quantity: 21, status: 1, id_category: 8, description: 'Dao đa năng 12 chức năng, thép không gỉ, nhỏ gọn cho mọi chuyến đi rừng.', rating: 4.9, created_at: CREATED_AT },
  { id: 28, name: 'Bộ dụng cụ sơ cứu dã ngoại', image: '/images/bo-so-cuu.webp', price: 250000, quantity: 45, status: 1, id_category: 8, description: 'Bộ sơ cứu dã ngoại đầy đủ băng gạc và thuốc cơ bản, túi chống nước.', rating: 4.3, created_at: CREATED_AT },
  // Sản phẩm mới (id 29–78, thêm ngày 2026-11-28, ảnh studio AI)
  // 1. Lều trại
  { id: 29, name: 'Lều trại 3 người Naturehike Mongar 3', image: '/images/leu-trai-3-nguoi-mongar.webp', price: 3890000, quantity: 12, status: 1, id_category: 1, description: 'Lều 3 người 2 lớp siêu nhẹ, chống mưa tốt, dựng nhanh cho chuyến trekking dài ngày.', rating: 4.7, created_at: CREATED_AT },
  { id: 30, name: 'Lều trại 2 người Decathlon Quechua MH100', image: '/images/leu-trai-2-nguoi-mh100.webp', price: 1990000, quantity: 18, status: 1, id_category: 1, description: 'Lều 2 người giá tốt, dựng trong 5 phút, thoáng khí, phù hợp cắm trại cuối tuần.', rating: 4.6, created_at: CREATED_AT },
  { id: 31, name: 'Lều trại 4 người Naturehike Village 5.0', image: '/images/leu-trai-4-nguoi-village.webp', price: 5490000, quantity: 8, status: 1, id_category: 1, description: 'Lều cabin 4 người rộng rãi có mái hiên trước, chống nắng mưa tốt cho gia đình.', rating: 4.7, created_at: CREATED_AT },
  { id: 32, name: 'Lều cắm trại mái vòm Coleman Pop-Up', image: '/images/leu-trai-mai-vom-coleman.webp', price: 2490000, quantity: 15, status: 1, id_category: 1, description: 'Lều pop-up mở ra là dùng ngay, gấp gọn nhanh, tiện cho chuyến đi ngắn ngày.', rating: 4.5, created_at: CREATED_AT },
  { id: 33, name: 'Lều trại 1 người Naturehike Cloud Up 1', image: '/images/leu-trai-1-nguoi-cloud-up.webp', price: 2390000, quantity: 14, status: 1, id_category: 1, description: 'Lều 1 người siêu nhẹ chỉ hơn 1kg, chống mưa tốt, lý tưởng cho trekking một mình.', rating: 4.8, created_at: CREATED_AT },
  { id: 34, name: 'Tăng che nắng Naturehike 3x3m', image: '/images/tang-che-nang-3x3.webp', price: 1190000, quantity: 20, status: 1, id_category: 1, description: 'Tăng che nắng 3x3m chống UV và chống mưa nhẹ, dựng nhanh làm mái hiên trại.', rating: 4.6, created_at: CREATED_AT },
  { id: 35, name: 'Lều trại 6 người Coleman Montana 6', image: '/images/leu-trai-6-nguoi-montana.webp', price: 6490000, quantity: 7, status: 1, id_category: 1, description: 'Lều 6 người 2 phòng rộng rãi, cửa sổ lưới thoáng, phù hợp đại gia đình.', rating: 4.6, created_at: CREATED_AT },
  // 2. Túi ngủ
  { id: 36, name: 'Túi ngủ Naturehike CW280', image: '/images/tui-ngu-cw280.webp', price: 1490000, quantity: 16, status: 1, id_category: 2, description: 'Túi ngủ bông chịu lạnh tới -5 độ, ấm nhẹ, phù hợp cắm trại mùa đông vùng cao.', rating: 4.7, created_at: CREATED_AT },
  { id: 37, name: 'Túi ngủ Decathlon Quechua MH500', image: '/images/tui-ngu-mh500.webp', price: 990000, quantity: 22, status: 1, id_category: 2, description: 'Túi ngủ 2 trong 1 dùng được cả mùa hè lẫn mùa đông, ấm và thoáng.', rating: 4.6, created_at: CREATED_AT },
  { id: 38, name: 'Túi ngủ mùa hè Naturehike LW280', image: '/images/tui-ngu-mua-he-lw280.webp', price: 690000, quantity: 28, status: 1, id_category: 2, description: 'Túi ngủ mùa hè nhẹ và thoáng, gọn trong ba lô, dùng tốt cho đêm hè oi bức.', rating: 4.5, created_at: CREATED_AT },
  { id: 39, name: 'Túi ngủ đôi Naturehike ULG800', image: '/images/tui-ngu-doi-ulg800.webp', price: 2890000, quantity: 10, status: 1, id_category: 2, description: 'Túi ngủ đôi lông vũ ấm tới -8 độ, rộng rãi cho 2 người ôm nhau ngủ.', rating: 4.7, created_at: CREATED_AT },
  { id: 40, name: 'Túi ngủ trẻ em Coleman', image: '/images/tui-ngu-tre-em.webp', price: 590000, quantity: 25, status: 1, id_category: 2, description: 'Túi ngủ trẻ em êm ái, họa tiết vui nhộn, ấm vừa cho bé cắm trại cùng gia đình.', rating: 4.5, created_at: CREATED_AT },
  { id: 41, name: 'Túi ngủ siêu nhẹ Sea to Summit Spark', image: '/images/tui-ngu-sea-to-summit-spark.webp', price: 4900000, quantity: 8, status: 1, id_category: 2, description: 'Túi ngủ lông vũ siêu nhẹ chỉ 500g, nén nhỏ bằng chai nước, cho trekker chuyên nghiệp.', rating: 4.9, created_at: CREATED_AT },
  { id: 42, name: 'Lót túi ngủ Naturehike', image: '/images/lot-tui-ngu.webp', price: 350000, quantity: 35, status: 1, id_category: 2, description: 'Lót túi ngủ lụa mềm giữ ấm thêm, giặt dễ, tăng tuổi thọ cho túi ngủ chính.', rating: 4.4, created_at: CREATED_AT },
  // 3. Bếp & dụng cụ nấu
  { id: 43, name: 'Bếp ga dã ngoại Soto WindMaster', image: '/images/bep-ga-soto-windmaster.webp', price: 1890000, quantity: 12, status: 1, id_category: 3, description: 'Bếp ga chống gió cực tốt, lửa mạnh ổn định, nấu nhanh ngay cả khi gió lớn.', rating: 4.8, created_at: CREATED_AT },
  { id: 44, name: 'Bếp ga MSR PocketRocket Deluxe', image: '/images/bo-noi-msr-pocketrocket.webp', price: 1290000, quantity: 15, status: 1, id_category: 3, description: 'Bếp ga siêu nhẹ kèm nồi nhỏ, gấp gọn bằng lòng bàn tay, nấu nhanh ngoài trời.', rating: 4.7, created_at: CREATED_AT },
  { id: 45, name: 'Cốc titan Naturehike 450ml', image: '/images/coc-titan-450ml.webp', price: 290000, quantity: 40, status: 1, id_category: 3, description: 'Cốc titan 450ml siêu nhẹ, bền, không gỉ, dùng uống nước hay nấu mì đều tiện.', rating: 4.6, created_at: CREATED_AT },
  { id: 46, name: 'Bình giữ nhiệt Stanley Classic 1.9L', image: '/images/binh-giu-nhiet-1-9l.webp', price: 1490000, quantity: 18, status: 1, id_category: 3, description: 'Bình giữ nhiệt 1.9 lít giữ nóng 28 giờ, giữ lạnh 36 giờ, bền bỉ huyền thoại.', rating: 4.8, created_at: CREATED_AT },
  { id: 47, name: 'Bộ chén đĩa dã ngoại Naturehike', image: '/images/bo-chen-dia-da-ngoai.webp', price: 450000, quantity: 24, status: 1, id_category: 3, description: 'Bộ chén đĩa titan 3 món nhẹ, xếp gọn, đủ dùng cho bữa ăn ngoài trời.', rating: 4.5, created_at: CREATED_AT },
  { id: 48, name: 'Bếp cồn dã ngoại Trangia', image: '/images/bep-con-trangia.webp', price: 890000, quantity: 14, status: 1, id_category: 3, description: 'Bếp cồn đồng thau bền bỉ, đốt êm, không khói, dùng cồn khô dễ tìm.', rating: 4.6, created_at: CREATED_AT },
  { id: 49, name: 'Ấm đun nước dã ngoại Fire-Maple', image: '/images/am-dun-nuoc-fire-maple.webp', price: 390000, quantity: 26, status: 1, id_category: 3, description: 'Ấm nhôm nhẹ đun nước nhanh, quai gấp gọn, tiện pha trà cà phê ngoài trại.', rating: 4.5, created_at: CREATED_AT },
  // 4. Đèn & pin
  { id: 50, name: 'Đèn lồng LED Goal Zero Lighthouse', image: '/images/den-long-goal-zero.webp', price: 1290000, quantity: 14, status: 1, id_category: 4, description: 'Đèn lồng LED 600 lumen sạc USB, sáng ấm, pin dùng 200 giờ ở chế độ thấp.', rating: 4.8, created_at: CREATED_AT },
  { id: 51, name: 'Đèn pin đội đầu Nitecore NU25', image: '/images/den-pin-doi-dau-nu25.webp', price: 890000, quantity: 20, status: 1, id_category: 4, description: 'Đèn đội đầu 400 lumen siêu nhẹ 28g, sạc USB-C, có đèn đỏ bảo vệ mắt ban đêm.', rating: 4.7, created_at: CREATED_AT },
  { id: 52, name: 'Đèn pin cầm tay Fenix PD36R', image: '/images/den-pin-fenix-pd36r.webp', price: 1990000, quantity: 10, status: 1, id_category: 4, description: 'Đèn pin 1600 lumen sạc USB-C, chống nước, xa tới 283m, nhỏ gọn bỏ túi.', rating: 4.8, created_at: CREATED_AT },
  { id: 53, name: 'Đèn dây LED trang trí Naturehike 5m', image: '/images/den-day-led-5m.webp', price: 190000, quantity: 38, status: 1, id_category: 4, description: 'Dây đèn LED 5m trang trí lều ấm cúng, chống nước, pin sạc USB tiện lợi.', rating: 4.4, created_at: CREATED_AT },
  { id: 54, name: 'Đèn pin đội đầu Black Diamond Spot', image: '/images/den-pin-doi-dau-black-diamond.webp', price: 1490000, quantity: 12, status: 1, id_category: 4, description: 'Đèn đội đầu 400 lumen chống nước, nhớ chế độ sáng, rảnh tay đi rừng ban đêm.', rating: 4.7, created_at: CREATED_AT },
  { id: 55, name: 'Đèn lồng sạc USB Coleman', image: '/images/den-long-sac-usb-coleman.webp', price: 490000, quantity: 22, status: 1, id_category: 4, description: 'Đèn lồng sạc USB sáng dịu, pin dùng 20 giờ, có móc treo tiện lợi trong lều.', rating: 4.5, created_at: CREATED_AT },
  // 5. Ba lô
  { id: 56, name: 'Ba lô Osprey Talon 22L', image: '/images/ba-lo-osprey-talon-22l.webp', price: 3490000, quantity: 9, status: 1, id_category: 5, description: 'Ba lô 22 lít ôm lưng tốt, lưng lưới thoáng, đủ đồ cho chuyến đi trong ngày.', rating: 4.8, created_at: CREATED_AT },
  { id: 57, name: 'Ba lô Deuter Speed Lite 24L', image: '/images/ba-lo-deuter-speed-lite.webp', price: 2890000, quantity: 11, status: 1, id_category: 5, description: 'Ba lô 24 lít nhẹ, ôm sát lưng, leo núi và đạp xe đều thoải mái.', rating: 4.7, created_at: CREATED_AT },
  { id: 58, name: 'Ba lô dã ngoại Decathlon Quechua MH500 40L', image: '/images/ba-lo-quechua-mh500-40l.webp', price: 1290000, quantity: 18, status: 1, id_category: 5, description: 'Ba lô 40 lít chống mưa, nhiều ngăn, giá tốt cho chuyến đi 2-3 ngày.', rating: 4.6, created_at: CREATED_AT },
  { id: 59, name: 'Túi đeo hông Naturehike', image: '/images/tui-deo-hong.webp', price: 390000, quantity: 30, status: 1, id_category: 5, description: 'Túi đeo hông đựng bình nước và điện thoại, rảnh tay khi đi bộ đường dài.', rating: 4.4, created_at: CREATED_AT },
  { id: 60, name: 'Ba lô leo núi Gregory Zulu 55L', image: '/images/ba-lo-gregory-zulu-55l.webp', price: 5900000, quantity: 7, status: 1, id_category: 5, description: 'Ba lô 55 lít lưng lưới thoáng khí, đeo êm cho chuyến đi dài ngày nhiều đồ.', rating: 4.8, created_at: CREATED_AT },
  { id: 61, name: 'Ba lô chống nước Naturehike 25L', image: '/images/ba-lo-chong-nuoc-25l.webp', price: 890000, quantity: 16, status: 1, id_category: 5, description: 'Ba lô chống nước 25 lít dạng túi khô, bảo vệ đồ khô ráo khi đi mưa hay chèo thuyền.', rating: 4.5, created_at: CREATED_AT },
  // 6. Bàn ghế cắm trại
  { id: 62, name: 'Ghế xếp Helinox Chair One', image: '/images/ghe-xep-helinox-chair-one.webp', price: 2490000, quantity: 10, status: 1, id_category: 6, description: 'Ghế xếp Helinox nhẹ chỉ 900g, khung nhôm chắc, ngồi êm, gấp gọn bằng chai nước.', rating: 4.9, created_at: CREATED_AT },
  { id: 63, name: 'Bàn gấp Naturehike nhôm', image: '/images/ban-gap-naturehike.webp', price: 890000, quantity: 16, status: 1, id_category: 6, description: 'Bàn gấp nhôm nhẹ, mặt nan chắc chắn, xếp gọn mang theo dễ dàng.', rating: 4.6, created_at: CREATED_AT },
  { id: 64, name: 'Ghế xếp có tựa đầu Coleman', image: '/images/ghe-xep-co-tua-dau-coleman.webp', price: 990000, quantity: 14, status: 1, id_category: 6, description: 'Ghế xếp có tựa đầu và tay vịn êm, ngồi thư giãn cả buổi bên lửa trại.', rating: 4.6, created_at: CREATED_AT },
  { id: 65, name: 'Võng dã ngoại Naturehike', image: '/images/vong-da-ngoai.webp', price: 590000, quantity: 20, status: 1, id_category: 6, description: 'Võng vải dù bền, chịu tải 150kg, mắc nhanh giữa 2 cây, ngủ trưa cực đã.', rating: 4.5, created_at: CREATED_AT },
  { id: 66, name: 'Bàn ghế xếp gọn 4 người Naturehike', image: '/images/ban-ghe-xep-4-nguoi.webp', price: 1890000, quantity: 9, status: 1, id_category: 6, description: 'Bộ bàn gấp kèm 4 ghế đẩu, xếp gọn thành một kiện, đủ chỗ cho cả nhóm.', rating: 4.6, created_at: CREATED_AT },
  { id: 67, name: 'Ghế đẩu gấp gọn', image: '/images/ghe-dau-gap-gon.webp', price: 290000, quantity: 32, status: 1, id_category: 6, description: 'Ghế đẩu gấp gọn nhẹ, ngồi vững, tiện mang theo câu cá hay ngồi bếp.', rating: 4.3, created_at: CREATED_AT },
  // 7. Quần áo & giày
  { id: 68, name: 'Áo mưa dã ngoại Decathlon Quechua', image: '/images/ao-mua-da-ngoai.webp', price: 690000, quantity: 22, status: 1, id_category: 7, description: 'Áo mưa chống nước 5000mm, nhẹ, gấp gọn vào túi riêng, đi mưa rừng vẫn khô.', rating: 4.5, created_at: CREATED_AT },
  { id: 69, name: 'Giày leo núi Merrell Moab 3', image: '/images/giay-leo-nui-merrell-moab.webp', price: 3490000, quantity: 10, status: 1, id_category: 7, description: 'Giày leo núi đế Vibram bám tốt, chống nước, êm chân trên địa hình đá dốc.', rating: 4.8, created_at: CREATED_AT },
  { id: 70, name: 'Áo khoác gió Naturehike', image: '/images/ao-khoac-gio.webp', price: 890000, quantity: 18, status: 1, id_category: 7, description: 'Áo khoác gió nhẹ chống nước nhẹ, có mũ, mặc ngoài chống gió lạnh buổi sáng.', rating: 4.6, created_at: CREATED_AT },
  { id: 71, name: 'Quần trekking chống nước Columbia', image: '/images/quan-trekking-columbia.webp', price: 1290000, quantity: 14, status: 1, id_category: 7, description: 'Quần trekking chống nước, co giãn tốt, khô nhanh, leo núi thoải mái cả ngày.', rating: 4.6, created_at: CREATED_AT },
  { id: 72, name: 'Mũ chống nắng dã ngoại', image: '/images/mu-chong-nang.webp', price: 250000, quantity: 40, status: 1, id_category: 7, description: 'Mũ rộng vành chống nắng, có tấm che gáy và dây quai cằm, đội mát cả ngày.', rating: 4.4, created_at: CREATED_AT },
  { id: 73, name: 'Găng tay leo núi The North Face', image: '/images/gang-tay-leo-nui.webp', price: 590000, quantity: 20, status: 1, id_category: 7, description: 'Găng tay da bền, chống lạnh và chống trầy, bám tốt khi cầm gậy hay dây.', rating: 4.6, created_at: CREATED_AT },
  // 8. Phụ kiện
  { id: 74, name: 'Thảm trải lều Therm-a-Rest', image: '/images/tham-trai-leu-therm-a-rest.webp', price: 1890000, quantity: 12, status: 1, id_category: 8, description: 'Thảm tự phồng êm ái, cách nhiệt tốt, ngủ ngon như ở nhà ngay giữa rừng.', rating: 4.8, created_at: CREATED_AT },
  { id: 75, name: 'Gậy trekking Naturehike (cặp)', image: '/images/gay-trekking.webp', price: 690000, quantity: 22, status: 1, id_category: 8, description: 'Cặp gậy trekking nhôm nhẹ, khóa gài chắc, giảm tải cho đầu gối khi leo dốc.', rating: 4.6, created_at: CREATED_AT },
  { id: 76, name: 'Bật lửa chống gió Zippo', image: '/images/bat-lua-chong-gio.webp', price: 490000, quantity: 28, status: 1, id_category: 8, description: 'Bật lửa Zippo chống gió kinh điển, vỏ kim loại bền, dùng bền cả chục năm.', rating: 4.7, created_at: CREATED_AT },
  { id: 77, name: 'Túi đựng nước dã ngoại 3L', image: '/images/tui-dung-nuoc-3l.webp', price: 390000, quantity: 30, status: 1, id_category: 8, description: 'Túi đựng nước 3 lít có ống uống tiện lợi, gắn vừa ba lô, uống nước không cần dừng.', rating: 4.5, created_at: CREATED_AT },
  { id: 78, name: 'La bàn dã ngoại', image: '/images/la-ban-da-ngoai.webp', price: 290000, quantity: 35, status: 1, id_category: 8, description: 'La bàn kim dạ quang chính xác, vỏ chống sốc, xác định hướng nhanh khi đi rừng.', rating: 4.4, created_at: CREATED_AT },
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

/** Chỉ lấy sản phẩm đang bán hoặc hết hàng (status = 1 hoặc 2, như API). */
export function getActiveProducts(): Product[] {
  return PRODUCTS.filter((p) => p.status === 1 || p.status === 2)
}

export function getCategoryById(id: number): Category | undefined {
  return CATEGORIES.find((c) => c.id === id)
}

export function getProductById(id: number): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

/** Sản phẩm đang bán hoặc hết hàng thuộc một danh mục. */
export function getProductsByCategory(categoryId: number): Product[] {
  return PRODUCTS.filter(
    (p) =>
      p.id_category === categoryId && (p.status === 1 || p.status === 2),
  )
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
 * Tìm theo tên sản phẩm, chỉ lấy sản phẩm đang bán hoặc hết hàng
 * (status = 1 hoặc 2, như API).
 * Trả về toàn bộ sản phẩm đang bán khi từ khóa rỗng.
 */
export function searchProducts(q: string): Product[] {
  const keyword = removeDiacritics(q.trim())
  if (!keyword) return getActiveProducts()
  return PRODUCTS.filter(
    (p) =>
      (p.status === 1 || p.status === 2) &&
      removeDiacritics(p.name).includes(keyword),
  )
}
