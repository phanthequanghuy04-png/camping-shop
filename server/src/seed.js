/**
 * Dữ liệu mẫu dùng khi MySQL chưa chạy được (chế độ FALLBACK).
 *
 * Sao chép đúng từ camping.sql (8 danh mục, 28 sản phẩm, 2 user mẫu,
 * 2 đơn hàng mẫu + chi tiết). Trường `image` giữ đúng tên file trong SQL.
 * Frontend (app/src/lib/api.ts) sẽ tự thay ảnh bằng URL trong
 * app/src/data/products.ts theo id, nên ảnh vẫn hiển thị đúng.
 *
 * Khi MySQL chạy + đã import camping.sql, server dùng DB thật và
 * KHÔNG dùng dữ liệu trong file này nữa (xem src/db.js).
 */

// Mật khẩu demo của 2 tài khoản mẫu trong users.ts là '123456'.
// Hash dưới đây là PLACEHOLDER y như camping.sql — KHÔNG phải hash thật.
// Luồng khác sẽ tạo hash bcrypt thật; tới lúc đó login dùng bcrypt.
const PLACEHOLDER_HASH = '$2y$10$PLACEHOLDER_DO_NOT_USE_IN_PROD';

const categories = [
  { id: 1, name: 'Lều trại' },
  { id: 2, name: 'Túi ngủ' },
  { id: 3, name: 'Bếp & dụng cụ nấu' },
  { id: 4, name: 'Đèn & pin' },
  { id: 5, name: 'Ba lô' },
  { id: 6, name: 'Bàn ghế cắm trại' },
  { id: 7, name: 'Quần áo & giày' },
  { id: 8, name: 'Phụ kiện' },
];

const CREATED_AT = '2026-11-27T00:00:00+07:00';

// [id, name, image, price, quantity, id_category, description, rating]
const PRODUCT_ROWS = [
  [1, 'Lều trại 2 người Naturehike Cloud Up 2', 'leu-trai-2-nguoi.jpg', 2890000, 15, 1, 'Lều 2 người siêu nhẹ, chống mưa tốt, dựng nhanh trong 5 phút.', 4.8],
  [2, 'Lều trại 4 người Coleman Sundome 4', 'leu-trai-4-nguoi.jpg', 4500000, 10, 1, 'Lều 4 người rộng rãi, thoáng khí, phù hợp cắm trại gia đình cuối tuần.', 4.7],
  [3, 'Lều trại gia đình 6 người Decathlon Quechua Arpenaz 6.3', 'leu-trai-gia-dinh-6-nguoi.jpg', 6900000, 8, 1, 'Lều gia đình 6 người có 2 phòng ngủ riêng, chống nắng và chống mưa tốt.', 4.6],
  [4, 'Lều cắm trại tự bung 2 người Naturehike', 'leu-trai-tu-bung.jpg', 1590000, 20, 1, 'Lều tự bung tiện lợi, mở ra là dùng ngay, gấp gọn chỉ trong vài giây.', 4.5],
  [5, 'Túi ngủ mùa đông Naturehike ULG700', 'tui-ngu-mua-dong.jpg', 2450000, 12, 2, 'Túi ngủ lông vũ chịu lạnh tới -7 độ, nhẹ và ấm cho mùa đông vùng cao.', 4.8],
  [6, 'Túi ngủ 3 mùa Coleman Brazos', 'tui-ngu-3-mua.jpg', 1290000, 18, 2, 'Túi ngủ 3 mùa êm ái, thoáng mát, phù hợp cắm trại xuân hè thu.', 4.6],
  [7, 'Túi ngủ đôi Decathlon Quechua', 'tui-ngu-doi.jpg', 1890000, 9, 2, 'Túi ngủ đôi rộng rãi cho 2 người, có thể tách thành 2 túi đơn khi cần.', 4.5],
  [8, 'Túi ngủ siêu nhẹ Naturehike LW180', 'tui-ngu-sieu-nhe.jpg', 890000, 25, 2, 'Túi ngủ siêu nhẹ chỉ 700g, gọn trong ba lô, lý tưởng cho trekking.', 4.4],
  [9, 'Bếp ga mini dã ngoại Fire-Maple', 'bep-ga-mini.jpg', 650000, 30, 3, 'Bếp ga mini gấp gọn, lửa mạnh và ổn định, nấu nhanh ngoài trời.', 4.7],
  [10, 'Bộ nồi nấu ăn dã ngoại Naturehike 4 món', 'bo-noi-da-ngoai.jpg', 890000, 22, 3, 'Bộ nồi nhôm 4 món nhẹ, chống dính, xếp gọn vào nhau tiết kiệm diện tích.', 4.6],
  [11, 'Bếp củi gấp gọn Lixada', 'bep-cui-gap-gon.jpg', 450000, 28, 3, 'Bếp củi inox gấp gọn, đốt bằng củi khô, tiện mang theo khi trekking.', 4.3],
  [12, 'Bình giữ nhiệt Stanley 1L', 'binh-giu-nhiet.jpg', 990000, 35, 3, 'Bình giữ nhiệt 1 lít giữ nóng 24 giờ, giữ lạnh 24 giờ, bền và chắc chắn.', 4.8],
  [13, 'Đèn lồng LED cắm trại Naturehike', 'den-long-led.jpg', 350000, 40, 4, 'Đèn lồng LED sáng dịu, pin dùng 30 giờ, có móc treo tiện lợi trong lều.', 4.6],
  [14, 'Đèn pin đội đầu Petzl Actik', 'den-pin-doi-dau.jpg', 1150000, 20, 4, 'Đèn đội đầu sáng 450 lumen, chống nước, rảnh tay khi đi rừng ban đêm.', 4.8],
  [15, 'Đèn dây trang trí lều 10m', 'den-day-trang-tri.jpg', 290000, 32, 4, 'Dây đèn LED 10m trang trí lều ấm cúng, chống nước, dùng pin sạc USB.', 4.4],
  [16, 'Đèn pin siêu sáng Nitecore', 'den-pin-sieu-sang.jpg', 890000, 15, 4, 'Đèn pin cầm tay siêu sáng 1000 lumen, pin sạc, nhỏ gọn bỏ túi áo.', 4.7],
  [17, 'Ba lô leo núi Osprey Atmos 65L', 'ba-lo-leo-nui-65l.jpg', 5900000, 6, 5, 'Ba lô leo núi 65 lít, lưng lưới thoáng khí, đeo êm cho chuyến đi dài ngày.', 4.9],
  [18, 'Ba lô trekking Deuter Futura 32L', 'ba-lo-trekking-32l.jpg', 3450000, 10, 5, 'Ba lô trekking 32 lít, ôm lưng tốt, đủ đồ cho chuyến đi 2-3 ngày.', 4.7],
  [19, 'Ba lô dã ngoại Naturehike 55L', 'ba-lo-da-ngoai-55l.jpg', 1450000, 16, 5, 'Ba lô dã ngoại 55 lít chống nước nhẹ, nhiều ngăn, giá tốt cho người mới.', 4.5],
  [20, 'Ghế xếp dã ngoại Naturehike', 'ghe-xep-da-ngoai.jpg', 590000, 24, 6, 'Ghế xếp khung nhôm nhẹ, chịu tải 120kg, gấp gọn mang theo dễ dàng.', 4.6],
  [21, 'Bàn gấp nhôm dã ngoại Coleman', 'ban-gap-nhom.jpg', 1190000, 12, 6, 'Bàn gấp nhôm chắc chắn, mặt bàn rộng, xếp gọn như vali khi di chuyển.', 4.7],
  [22, 'Ghế võng xếp gọn', 'ghe-vong-xep-gon.jpg', 750000, 18, 6, 'Ghế võng xếp gọn thư giãn bên lửa trại, vải bền, khung thép chắc chắn.', 4.2],
  [23, 'Áo khoác chống nước The North Face', 'ao-khoac-chong-nuoc.jpg', 2890000, 14, 7, 'Áo khoác chống nước, chống gió, thoáng khí, mặc được cả đi mưa rừng.', 4.7],
  [24, 'Giày leo núi Salomon X Ultra 4', 'giay-leo-nui.jpg', 3990000, 9, 7, 'Giày leo núi đế bám tốt, chống nước, êm chân trên địa hình đá dốc.', 4.8],
  [25, 'Áo giữ nhiệt Columbia', 'ao-giu-nhiet.jpg', 690000, 26, 7, 'Áo giữ nhiệt mặc lót bên trong, ấm nhẹ, thấm mồ hôi tốt khi vận động.', 4.5],
  [26, 'Thảm cách nhiệt Naturehike', 'tham-cach-nhiet.jpg', 390000, 38, 8, 'Thảm cách nhiệt trải lều êm lưng, chống ẩm từ mặt đất, cuộn gọn nhẹ.', 4.5],
  [27, 'Dao đa năng Victorinox', 'dao-da-nang.jpg', 890000, 21, 8, 'Dao đa năng 12 chức năng, thép không gỉ, nhỏ gọn cho mọi chuyến đi rừng.', 4.9],
  [28, 'Bộ dụng cụ sơ cứu dã ngoại', 'bo-so-cuu.jpg', 250000, 45, 8, 'Bộ sơ cứu dã ngoại đầy đủ băng gạc và thuốc cơ bản, túi chống nước.', 4.3],
];

const products = PRODUCT_ROWS.map(
  ([id, name, image, price, quantity, id_category, description, rating]) => ({
    id,
    name,
    image,
    price,
    quantity,
    status: 1,
    id_category,
    description,
    rating,
    created_at: CREATED_AT,
  }),
);

// password_hash là PLACEHOLDER (xem chú thích đầu file) — xem src/auth.js.
const users = [
  { id: 1, name: 'Admin Camping', email: 'admin@camping.vn', phone: '0901234567', password_hash: PLACEHOLDER_HASH, role: 'admin', created_at: CREATED_AT },
  { id: 2, name: 'Nguyễn Văn An', email: 'user@camping.vn', phone: '0912345678', password_hash: PLACEHOLDER_HASH, role: 'user', created_at: CREATED_AT },
];

const orders = [
  { id: 1, user_id: 2, subtotal: 3590000, discount_amount: 0, coupon_code: null, shipping_fee: 0, shipping_method: 'standard', shipping_region: 'hcm', payment_method: 'cod', payment_status: 'paid', tracking_code: null, estimated_delivery: null, total: 3590000, status: 'paid', address: '123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh', phone: '0912345678', customer_name: 'Nguyễn Văn An', created_at: CREATED_AT },
  { id: 2, user_id: 2, subtotal: 1570000, discount_amount: 0, coupon_code: null, shipping_fee: 0, shipping_method: 'standard', shipping_region: 'hanoi', payment_method: 'cod', payment_status: 'unpaid', tracking_code: null, estimated_delivery: null, total: 1570000, status: 'pending', address: '45 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội', phone: '0912345678', customer_name: 'Nguyễn Văn An', created_at: CREATED_AT },
];

const orderItems = [
  { id: 1, order_id: 1, product_id: 1, quantity: 1, price: 2890000 },
  { id: 2, order_id: 1, product_id: 13, quantity: 2, price: 350000 },
  { id: 3, order_id: 2, product_id: 20, quantity: 2, price: 590000 },
  { id: 4, order_id: 2, product_id: 26, quantity: 1, price: 390000 },
];

const cartItems = [
  { id: 1, user_id: 2, session_id: null, product_id: 9, quantity: 1 },
];

module.exports = { categories, products, users, orders, orderItems, cartItems, PLACEHOLDER_HASH };
