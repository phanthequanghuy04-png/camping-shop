-- ============================================================
-- Website bán đồ cắm trại — Database: camping
-- MySQL / MariaDB — utf8mb4
-- Bước 2: Thiết kế DB
-- Lưu ý: tên DB thống nhất là `camping` (sửa lỗi cũ dùng
-- lệch tên shopping / store ở các bản trước).
-- Chỉ import file này, không chạy MySQL thật trong bước này.
-- ============================================================

CREATE DATABASE IF NOT EXISTS camping
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE camping;

SET NAMES utf8mb4;
SET time_zone = '+07:00';

-- ============================================================
-- 1. categories — danh mục sản phẩm
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. products — sản phẩm
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(250) NOT NULL,
  image VARCHAR(250) NULL,
  price DECIMAL(12,0) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  status TINYINT(1) NOT NULL DEFAULT 1,
  id_category INT NULL,
  description TEXT NULL,
  rating DECIMAL(2,1) NOT NULL DEFAULT 4.5,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (id_category) REFERENCES categories (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. users — người dùng
-- KHÔNG lưu mật khẩu dạng text thường như dự án cũ ('123').
-- Chỉ lưu password_hash bằng bcrypt / argon2.
-- password_hash bên dưới là hash bcrypt thật (cost 10)
-- của mật khẩu DEMO mới (xem DEPLOY.md mục 1) cho cả 2 tài khoản mẫu
-- (salt khác nhau nên 2 hash khác nhau). CHỈ DÙNG CHO DEMO — production
-- phải đổi mật khẩu mạnh riêng từng tài khoản.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(250) NOT NULL,
  email VARCHAR(250) NOT NULL UNIQUE,
  phone VARCHAR(15) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_role CHECK (role IN ('user', 'admin'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. orders — đơn hàng
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  -- total = số tiền khách phải trả = subtotal - discount_amount + shipping_fee.
  total DECIMAL(12,0) NOT NULL DEFAULT 0,
  -- Tạm tính trước giảm giá (tổng giá sản phẩm × số lượng).
  subtotal DECIMAL(12,0) NOT NULL DEFAULT 0,
  -- Số tiền đã giảm theo mã (vd CAMP10: 10%, tối đa 200.000₫).
  discount_amount DECIMAL(12,0) NOT NULL DEFAULT 0,
  coupon_code VARCHAR(20) NULL,
  -- Phí vận chuyển (0 = miễn phí khi tạm tính >= 500.000₫).
  shipping_fee DECIMAL(12,0) NOT NULL DEFAULT 0,
  shipping_method VARCHAR(20) NOT NULL DEFAULT 'standard',
  -- Khu vực giao: 'hanoi' | 'hcm' (nội thành, phí 20.000₫) | 'other' (30.000₫).
  shipping_region VARCHAR(20) NULL,
  -- Cách thanh toán: 'cod' (khi nhận hàng) | 'bank_transfer' (chuyển khoản/VietQR).
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cod',
  -- 'unpaid' (chưa thanh toán) | 'paid' (đã thanh toán/đã nhận tiền).
  payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
  -- Mã vận đơn do admin nhập khi giao hàng (GHN/GHTK/Viettel Post...).
  tracking_code VARCHAR(100) NULL,
  -- Ngày giao dự kiến (server tự tính theo khu vực lúc tạo đơn).
  estimated_delivery DATE NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  address VARCHAR(500) NULL,
  phone VARCHAR(15) NULL,
  customer_name VARCHAR(250) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL,
  CONSTRAINT chk_orders_status CHECK (status IN ('pending', 'paid', 'shipped', 'done', 'cancelled')),
  CONSTRAINT chk_orders_payment_method CHECK (payment_method IN ('cod', 'bank_transfer')),
  CONSTRAINT chk_orders_payment_status CHECK (payment_status IN ('unpaid', 'paid'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. order_items — chi tiết đơn hàng
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(12,0) NOT NULL,
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. cart_items — giỏ hàng
-- user_id dùng cho khách đã đăng nhập, session_id dùng cho
-- khách vãng lai (chưa đăng nhập); một trong hai có thể NULL.
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  session_id VARCHAR(100) NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_items_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DỮ LIỆU MẪU
-- ============================================================

-- 8 danh mục, đúng thứ tự yêu cầu
INSERT INTO categories (id, name) VALUES
  (1, 'Lều trại'),
  (2, 'Túi ngủ'),
  (3, 'Bếp & dụng cụ nấu'),
  (4, 'Đèn & pin'),
  (5, 'Ba lô'),
  (6, 'Bàn ghế cắm trại'),
  (7, 'Quần áo & giày'),
  (8, 'Phụ kiện');

-- 28 sản phẩm: mỗi danh mục 3-4 món
-- (1) Lều trại: 4 món | (2) Túi ngủ: 4 món | (3) Bếp: 4 món
-- (4) Đèn & pin: 4 món | (5) Ba lô: 3 món | (6) Bàn ghế: 3 món
-- (7) Quần áo & giày: 3 món | (8) Phụ kiện: 3 món
-- image chỉ là tên file ảnh mẫu, không cần file thật.
INSERT INTO products (id, name, image, price, quantity, status, id_category, description, rating) VALUES
  -- 1. Lều trại
  (1, 'Lều trại 2 người Naturehike Cloud Up 2', 'leu-trai-2-nguoi.webp', 2890000, 15, 1, 1, 'Lều 2 người siêu nhẹ, chống mưa tốt, dựng nhanh trong 5 phút.', 4.8),
  (2, 'Lều trại 4 người Coleman Sundome 4', 'leu-trai-4-nguoi.webp', 4500000, 10, 1, 1, 'Lều 4 người rộng rãi, thoáng khí, phù hợp cắm trại gia đình cuối tuần.', 4.7),
  (3, 'Lều trại gia đình 6 người Decathlon Quechua Arpenaz 6.3', 'leu-trai-gia-dinh-6-nguoi.webp', 6900000, 8, 1, 1, 'Lều gia đình 6 người có 2 phòng ngủ riêng, chống nắng và chống mưa tốt.', 4.6),
  (4, 'Lều cắm trại tự bung 2 người Naturehike', 'leu-trai-tu-bung.webp', 1590000, 20, 1, 1, 'Lều tự bung tiện lợi, mở ra là dùng ngay, gấp gọn chỉ trong vài giây.', 4.5),
  -- 2. Túi ngủ
  (5, 'Túi ngủ mùa đông Naturehike ULG700', 'tui-ngu-mua-dong.webp', 2450000, 12, 1, 2, 'Túi ngủ lông vũ chịu lạnh tới -7 độ, nhẹ và ấm cho mùa đông vùng cao.', 4.8),
  (6, 'Túi ngủ 3 mùa Coleman Brazos', 'tui-ngu-3-mua.webp', 1290000, 18, 1, 2, 'Túi ngủ 3 mùa êm ái, thoáng mát, phù hợp cắm trại xuân hè thu.', 4.6),
  (7, 'Túi ngủ đôi Decathlon Quechua', 'tui-ngu-doi.webp', 1890000, 9, 1, 2, 'Túi ngủ đôi rộng rãi cho 2 người, có thể tách thành 2 túi đơn khi cần.', 4.5),
  (8, 'Túi ngủ siêu nhẹ Naturehike LW180', 'tui-ngu-sieu-nhe.webp', 890000, 25, 1, 2, 'Túi ngủ siêu nhẹ chỉ 700g, gọn trong ba lô, lý tưởng cho trekking.', 4.4),
  -- 3. Bếp & dụng cụ nấu
  (9, 'Bếp ga mini dã ngoại Fire-Maple', 'bep-ga-mini.webp', 650000, 30, 1, 3, 'Bếp ga mini gấp gọn, lửa mạnh và ổn định, nấu nhanh ngoài trời.', 4.7),
  (10, 'Bộ nồi nấu ăn dã ngoại Naturehike 4 món', 'bo-noi-da-ngoai.webp', 890000, 22, 1, 3, 'Bộ nồi nhôm 4 món nhẹ, chống dính, xếp gọn vào nhau tiết kiệm diện tích.', 4.6),
  (11, 'Bếp củi gấp gọn Lixada', 'bep-cui-gap-gon.webp', 450000, 28, 1, 3, 'Bếp củi inox gấp gọn, đốt bằng củi khô, tiện mang theo khi trekking.', 4.3),
  (12, 'Bình giữ nhiệt Stanley 1L', 'binh-giu-nhiet.webp', 990000, 35, 1, 3, 'Bình giữ nhiệt 1 lít giữ nóng 24 giờ, giữ lạnh 24 giờ, bền và chắc chắn.', 4.8),
  -- 4. Đèn & pin
  (13, 'Đèn lồng LED cắm trại Naturehike', 'den-long-led.webp', 350000, 40, 1, 4, 'Đèn lồng LED sáng dịu, pin dùng 30 giờ, có móc treo tiện lợi trong lều.', 4.6),
  (14, 'Đèn pin đội đầu Petzl Actik', 'den-pin-doi-dau.webp', 1150000, 20, 1, 4, 'Đèn đội đầu sáng 450 lumen, chống nước, rảnh tay khi đi rừng ban đêm.', 4.8),
  (15, 'Đèn dây trang trí lều 10m', 'den-day-trang-tri.webp', 290000, 32, 1, 4, 'Dây đèn LED 10m trang trí lều ấm cúng, chống nước, dùng pin sạc USB.', 4.4),
  (16, 'Đèn pin siêu sáng Nitecore', 'den-pin-sieu-sang.webp', 890000, 15, 1, 4, 'Đèn pin cầm tay siêu sáng 1000 lumen, pin sạc, nhỏ gọn bỏ túi áo.', 4.7),
  -- 5. Ba lô
  (17, 'Ba lô leo núi Osprey Atmos 65L', 'ba-lo-leo-nui-65l.webp', 5900000, 6, 1, 5, 'Ba lô leo núi 65 lít, lưng lưới thoáng khí, đeo êm cho chuyến đi dài ngày.', 4.9),
  (18, 'Ba lô trekking Deuter Futura 32L', 'ba-lo-trekking-32l.webp', 3450000, 10, 1, 5, 'Ba lô trekking 32 lít, ôm lưng tốt, đủ đồ cho chuyến đi 2-3 ngày.', 4.7),
  (19, 'Ba lô dã ngoại Naturehike 55L', 'ba-lo-da-ngoai-55l.webp', 1450000, 16, 1, 5, 'Ba lô dã ngoại 55 lít chống nước nhẹ, nhiều ngăn, giá tốt cho người mới.', 4.5),
  -- 6. Bàn ghế cắm trại
  (20, 'Ghế xếp dã ngoại Naturehike', 'ghe-xep-da-ngoai.webp', 590000, 24, 1, 6, 'Ghế xếp khung nhôm nhẹ, chịu tải 120kg, gấp gọn mang theo dễ dàng.', 4.6),
  (21, 'Bàn gấp nhôm dã ngoại Coleman', 'ban-gap-nhom.webp', 1190000, 12, 1, 6, 'Bàn gấp nhôm chắc chắn, mặt bàn rộng, xếp gọn như vali khi di chuyển.', 4.7),
  (22, 'Ghế võng xếp gọn', 'ghe-vong-xep-gon.webp', 750000, 18, 1, 6, 'Ghế võng xếp gọn thư giãn bên lửa trại, vải bền, khung thép chắc chắn.', 4.2),
  -- 7. Quần áo & giày
  (23, 'Áo khoác chống nước The North Face', 'ao-khoac-chong-nuoc.webp', 2890000, 14, 1, 7, 'Áo khoác chống nước, chống gió, thoáng khí, mặc được cả đi mưa rừng.', 4.7),
  (24, 'Giày leo núi Salomon X Ultra 4', 'giay-leo-nui.webp', 3990000, 9, 1, 7, 'Giày leo núi đế bám tốt, chống nước, êm chân trên địa hình đá dốc.', 4.8),
  (25, 'Áo giữ nhiệt Columbia', 'ao-giu-nhiet.webp', 690000, 26, 1, 7, 'Áo giữ nhiệt mặc lót bên trong, ấm nhẹ, thấm mồ hôi tốt khi vận động.', 4.5),
  -- 8. Phụ kiện
  (26, 'Thảm cách nhiệt Naturehike', 'tham-cach-nhiet.webp', 390000, 38, 1, 8, 'Thảm cách nhiệt trải lều êm lưng, chống ẩm từ mặt đất, cuộn gọn nhẹ.', 4.5),
  (27, 'Dao đa năng Victorinox', 'dao-da-nang.webp', 890000, 21, 1, 8, 'Dao đa năng 12 chức năng, thép không gỉ, nhỏ gọn cho mọi chuyến đi rừng.', 4.9),
  (28, 'Bộ dụng cụ sơ cứu dã ngoại', 'bo-so-cuu.webp', 250000, 45, 1, 8, 'Bộ sơ cứu dã ngoại đầy đủ băng gạc và thuốc cơ bản, túi chống nước.', 4.3);

-- 50 sản phẩm mới (id 29–78), ảnh studio AI từ ảnh tham chiếu thật (2026-11-28)
INSERT INTO products (id, name, image, price, quantity, status, id_category, description, rating) VALUES
  -- 1. Lều trại
  (29, 'Lều trại 3 người Naturehike Mongar 3', 'leu-trai-3-nguoi-mongar.webp', 3890000, 12, 1, 1, 'Lều 3 người 2 lớp siêu nhẹ, chống mưa tốt, dựng nhanh cho chuyến trekking dài ngày.', 4.7),
  (30, 'Lều trại 2 người Decathlon Quechua MH100', 'leu-trai-2-nguoi-mh100.webp', 1990000, 18, 1, 1, 'Lều 2 người giá tốt, dựng trong 5 phút, thoáng khí, phù hợp cắm trại cuối tuần.', 4.6),
  (31, 'Lều trại 4 người Naturehike Village 5.0', 'leu-trai-4-nguoi-village.webp', 5490000, 8, 1, 1, 'Lều cabin 4 người rộng rãi có mái hiên trước, chống nắng mưa tốt cho gia đình.', 4.7),
  (32, 'Lều cắm trại mái vòm Coleman Pop-Up', 'leu-trai-mai-vom-coleman.webp', 2490000, 15, 1, 1, 'Lều pop-up mở ra là dùng ngay, gấp gọn nhanh, tiện cho chuyến đi ngắn ngày.', 4.5),
  (33, 'Lều trại 1 người Naturehike Cloud Up 1', 'leu-trai-1-nguoi-cloud-up.webp', 2390000, 14, 1, 1, 'Lều 1 người siêu nhẹ chỉ hơn 1kg, chống mưa tốt, lý tưởng cho trekking một mình.', 4.8),
  (34, 'Tăng che nắng Naturehike 3x3m', 'tang-che-nang-3x3.webp', 1190000, 20, 1, 1, 'Tăng che nắng 3x3m chống UV và chống mưa nhẹ, dựng nhanh làm mái hiên trại.', 4.6),
  (35, 'Lều trại 6 người Coleman Montana 6', 'leu-trai-6-nguoi-montana.webp', 6490000, 7, 1, 1, 'Lều 6 người 2 phòng rộng rãi, cửa sổ lưới thoáng, phù hợp đại gia đình.', 4.6),
  -- 2. Túi ngủ
  (36, 'Túi ngủ Naturehike CW280', 'tui-ngu-cw280.webp', 1490000, 16, 1, 2, 'Túi ngủ bông chịu lạnh tới -5 độ, ấm nhẹ, phù hợp cắm trại mùa đông vùng cao.', 4.7),
  (37, 'Túi ngủ Decathlon Quechua MH500', 'tui-ngu-mh500.webp', 990000, 22, 1, 2, 'Túi ngủ 2 trong 1 dùng được cả mùa hè lẫn mùa đông, ấm và thoáng.', 4.6),
  (38, 'Túi ngủ mùa hè Naturehike LW280', 'tui-ngu-mua-he-lw280.webp', 690000, 28, 1, 2, 'Túi ngủ mùa hè nhẹ và thoáng, gọn trong ba lô, dùng tốt cho đêm hè oi bức.', 4.5),
  (39, 'Túi ngủ đôi Naturehike ULG800', 'tui-ngu-doi-ulg800.webp', 2890000, 10, 1, 2, 'Túi ngủ đôi lông vũ ấm tới -8 độ, rộng rãi cho 2 người ôm nhau ngủ.', 4.7),
  (40, 'Túi ngủ trẻ em Coleman', 'tui-ngu-tre-em.webp', 590000, 25, 1, 2, 'Túi ngủ trẻ em êm ái, họa tiết vui nhộn, ấm vừa cho bé cắm trại cùng gia đình.', 4.5),
  (41, 'Túi ngủ siêu nhẹ Sea to Summit Spark', 'tui-ngu-sea-to-summit-spark.webp', 4900000, 8, 1, 2, 'Túi ngủ lông vũ siêu nhẹ chỉ 500g, nén nhỏ bằng chai nước, cho trekker chuyên nghiệp.', 4.9),
  (42, 'Lót túi ngủ Naturehike', 'lot-tui-ngu.webp', 350000, 35, 1, 2, 'Lót túi ngủ lụa mềm giữ ấm thêm, giặt dễ, tăng tuổi thọ cho túi ngủ chính.', 4.4),
  -- 3. Bếp & dụng cụ nấu
  (43, 'Bếp ga dã ngoại Soto WindMaster', 'bep-ga-soto-windmaster.webp', 1890000, 12, 1, 3, 'Bếp ga chống gió cực tốt, lửa mạnh ổn định, nấu nhanh ngay cả khi gió lớn.', 4.8),
  (44, 'Bếp ga MSR PocketRocket Deluxe', 'bo-noi-msr-pocketrocket.webp', 1290000, 15, 1, 3, 'Bếp ga siêu nhẹ kèm nồi nhỏ, gấp gọn bằng lòng bàn tay, nấu nhanh ngoài trời.', 4.7),
  (45, 'Cốc titan Naturehike 450ml', 'coc-titan-450ml.webp', 290000, 40, 1, 3, 'Cốc titan 450ml siêu nhẹ, bền, không gỉ, dùng uống nước hay nấu mì đều tiện.', 4.6),
  (46, 'Bình giữ nhiệt Stanley Classic 1.9L', 'binh-giu-nhiet-1-9l.webp', 1490000, 18, 1, 3, 'Bình giữ nhiệt 1.9 lít giữ nóng 28 giờ, giữ lạnh 36 giờ, bền bỉ huyền thoại.', 4.8),
  (47, 'Bộ chén đĩa dã ngoại Naturehike', 'bo-chen-dia-da-ngoai.webp', 450000, 24, 1, 3, 'Bộ chén đĩa titan 3 món nhẹ, xếp gọn, đủ dùng cho bữa ăn ngoài trời.', 4.5),
  (48, 'Bếp cồn dã ngoại Trangia', 'bep-con-trangia.webp', 890000, 14, 1, 3, 'Bếp cồn đồng thau bền bỉ, đốt êm, không khói, dùng cồn khô dễ tìm.', 4.6),
  (49, 'Ấm đun nước dã ngoại Fire-Maple', 'am-dun-nuoc-fire-maple.webp', 390000, 26, 1, 3, 'Ấm nhôm nhẹ đun nước nhanh, quai gấp gọn, tiện pha trà cà phê ngoài trại.', 4.5),
  -- 4. Đèn & pin
  (50, 'Đèn lồng LED Goal Zero Lighthouse', 'den-long-goal-zero.webp', 1290000, 14, 1, 4, 'Đèn lồng LED 600 lumen sạc USB, sáng ấm, pin dùng 200 giờ ở chế độ thấp.', 4.8),
  (51, 'Đèn pin đội đầu Nitecore NU25', 'den-pin-doi-dau-nu25.webp', 890000, 20, 1, 4, 'Đèn đội đầu 400 lumen siêu nhẹ 28g, sạc USB-C, có đèn đỏ bảo vệ mắt ban đêm.', 4.7),
  (52, 'Đèn pin cầm tay Fenix PD36R', 'den-pin-fenix-pd36r.webp', 1990000, 10, 1, 4, 'Đèn pin 1600 lumen sạc USB-C, chống nước, xa tới 283m, nhỏ gọn bỏ túi.', 4.8),
  (53, 'Đèn dây LED trang trí Naturehike 5m', 'den-day-led-5m.webp', 190000, 38, 1, 4, 'Dây đèn LED 5m trang trí lều ấm cúng, chống nước, pin sạc USB tiện lợi.', 4.4),
  (54, 'Đèn pin đội đầu Black Diamond Spot', 'den-pin-doi-dau-black-diamond.webp', 1490000, 12, 1, 4, 'Đèn đội đầu 400 lumen chống nước, nhớ chế độ sáng, rảnh tay đi rừng ban đêm.', 4.7),
  (55, 'Đèn lồng sạc USB Coleman', 'den-long-sac-usb-coleman.webp', 490000, 22, 1, 4, 'Đèn lồng sạc USB sáng dịu, pin dùng 20 giờ, có móc treo tiện lợi trong lều.', 4.5),
  -- 5. Ba lô
  (56, 'Ba lô Osprey Talon 22L', 'ba-lo-osprey-talon-22l.webp', 3490000, 9, 1, 5, 'Ba lô 22 lít ôm lưng tốt, lưng lưới thoáng, đủ đồ cho chuyến đi trong ngày.', 4.8),
  (57, 'Ba lô Deuter Speed Lite 24L', 'ba-lo-deuter-speed-lite.webp', 2890000, 11, 1, 5, 'Ba lô 24 lít nhẹ, ôm sát lưng, leo núi và đạp xe đều thoải mái.', 4.7),
  (58, 'Ba lô dã ngoại Decathlon Quechua MH500 40L', 'ba-lo-quechua-mh500-40l.webp', 1290000, 18, 1, 5, 'Ba lô 40 lít chống mưa, nhiều ngăn, giá tốt cho chuyến đi 2-3 ngày.', 4.6),
  (59, 'Túi đeo hông Naturehike', 'tui-deo-hong.webp', 390000, 30, 1, 5, 'Túi đeo hông đựng bình nước và điện thoại, rảnh tay khi đi bộ đường dài.', 4.4),
  (60, 'Ba lô leo núi Gregory Zulu 55L', 'ba-lo-gregory-zulu-55l.webp', 5900000, 7, 1, 5, 'Ba lô 55 lít lưng lưới thoáng khí, đeo êm cho chuyến đi dài ngày nhiều đồ.', 4.8),
  (61, 'Ba lô chống nước Naturehike 25L', 'ba-lo-chong-nuoc-25l.webp', 890000, 16, 1, 5, 'Ba lô chống nước 25 lít dạng túi khô, bảo vệ đồ khô ráo khi đi mưa hay chèo thuyền.', 4.5),
  -- 6. Bàn ghế cắm trại
  (62, 'Ghế xếp Helinox Chair One', 'ghe-xep-helinox-chair-one.webp', 2490000, 10, 1, 6, 'Ghế xếp Helinox nhẹ chỉ 900g, khung nhôm chắc, ngồi êm, gấp gọn bằng chai nước.', 4.9),
  (63, 'Bàn gấp Naturehike nhôm', 'ban-gap-naturehike.webp', 890000, 16, 1, 6, 'Bàn gấp nhôm nhẹ, mặt nan chắc chắn, xếp gọn mang theo dễ dàng.', 4.6),
  (64, 'Ghế xếp có tựa đầu Coleman', 'ghe-xep-co-tua-dau-coleman.webp', 990000, 14, 1, 6, 'Ghế xếp có tựa đầu và tay vịn êm, ngồi thư giãn cả buổi bên lửa trại.', 4.6),
  (65, 'Võng dã ngoại Naturehike', 'vong-da-ngoai.webp', 590000, 20, 1, 6, 'Võng vải dù bền, chịu tải 150kg, mắc nhanh giữa 2 cây, ngủ trưa cực đã.', 4.5),
  (66, 'Bàn ghế xếp gọn 4 người Naturehike', 'ban-ghe-xep-4-nguoi.webp', 1890000, 9, 1, 6, 'Bộ bàn gấp kèm 4 ghế đẩu, xếp gọn thành một kiện, đủ chỗ cho cả nhóm.', 4.6),
  (67, 'Ghế đẩu gấp gọn', 'ghe-dau-gap-gon.webp', 290000, 32, 1, 6, 'Ghế đẩu gấp gọn nhẹ, ngồi vững, tiện mang theo câu cá hay ngồi bếp.', 4.3),
  -- 7. Quần áo & giày
  (68, 'Áo mưa dã ngoại Decathlon Quechua', 'ao-mua-da-ngoai.webp', 690000, 22, 1, 7, 'Áo mưa chống nước 5000mm, nhẹ, gấp gọn vào túi riêng, đi mưa rừng vẫn khô.', 4.5),
  (69, 'Giày leo núi Merrell Moab 3', 'giay-leo-nui-merrell-moab.webp', 3490000, 10, 1, 7, 'Giày leo núi đế Vibram bám tốt, chống nước, êm chân trên địa hình đá dốc.', 4.8),
  (70, 'Áo khoác gió Naturehike', 'ao-khoac-gio.webp', 890000, 18, 1, 7, 'Áo khoác gió nhẹ chống nước nhẹ, có mũ, mặc ngoài chống gió lạnh buổi sáng.', 4.6),
  (71, 'Quần trekking chống nước Columbia', 'quan-trekking-columbia.webp', 1290000, 14, 1, 7, 'Quần trekking chống nước, co giãn tốt, khô nhanh, leo núi thoải mái cả ngày.', 4.6),
  (72, 'Mũ chống nắng dã ngoại', 'mu-chong-nang.webp', 250000, 40, 1, 7, 'Mũ rộng vành chống nắng, có tấm che gáy và dây quai cằm, đội mát cả ngày.', 4.4),
  (73, 'Găng tay leo núi The North Face', 'gang-tay-leo-nui.webp', 590000, 20, 1, 7, 'Găng tay da bền, chống lạnh và chống trầy, bám tốt khi cầm gậy hay dây.', 4.6),
  -- 8. Phụ kiện
  (74, 'Thảm trải lều Therm-a-Rest', 'tham-trai-leu-therm-a-rest.webp', 1890000, 12, 1, 8, 'Thảm tự phồng êm ái, cách nhiệt tốt, ngủ ngon như ở nhà ngay giữa rừng.', 4.8),
  (75, 'Gậy trekking Naturehike (cặp)', 'gay-trekking.webp', 690000, 22, 1, 8, 'Cặp gậy trekking nhôm nhẹ, khóa gài chắc, giảm tải cho đầu gối khi leo dốc.', 4.6),
  (76, 'Bật lửa chống gió Zippo', 'bat-lua-chong-gio.webp', 490000, 28, 1, 8, 'Bật lửa Zippo chống gió kinh điển, vỏ kim loại bền, dùng bền cả chục năm.', 4.7),
  (77, 'Túi đựng nước dã ngoại 3L', 'tui-dung-nuoc-3l.webp', 390000, 30, 1, 8, 'Túi đựng nước 3 lít có ống uống tiện lợi, gắn vừa ba lô, uống nước không cần dừng.', 4.5),
  (78, 'La bàn dã ngoại', 'la-ban-da-ngoai.webp', 290000, 35, 1, 8, 'La bàn kim dạ quang chính xác, vỏ chống sốc, xác định hướng nhanh khi đi rừng.', 4.4);

-- 2 user mẫu
-- password_hash bên dưới là hash bcrypt thật (cost 10) của mật khẩu
-- của mật khẩu DEMO mới (xem DEPLOY.md mục 1 — KHÔNG ghi mật khẩu text vào file này).
-- CHỈ DÙNG CHO DEMO. Production phải đổi mật khẩu mạnh riêng từng
-- tài khoản; tuyệt đối không ghi mật khẩu thật vào file SQL / git.
INSERT INTO users (id, name, email, phone, password_hash, role) VALUES
  (1, 'Admin Camping', 'admin@camping.vn', '0901234567', '$2a$10$fszm16X4ha07LNsfk25CweksyRbXaXhpVDjHHVmsZIku4G2PdBG0.', 'admin'),
  (2, 'Nguyễn Văn An', 'user@camping.vn', '0912345678', '$2a$10$lEDUhevukBCWumbq2X6hPuwXDANkfZBPe2pT3V..HIJigQCe61gGu', 'user');

-- 2 đơn hàng mẫu + chi tiết (tổng tiền khớp với items)
-- Đơn 1: 1 x Lều Cloud Up 2 (2.890.000) + 2 x Đèn lồng LED (350.000) = 3.590.000
INSERT INTO orders (id, user_id, total, status, address, phone, customer_name) VALUES
  (1, 2, 3590000, 'paid', '123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh', '0912345678', 'Nguyễn Văn An'),
  (2, 2, 1570000, 'pending', '45 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội', '0912345678', 'Nguyễn Văn An');
-- Đơn 2: 2 x Ghế xếp dã ngoại (590.000) + 1 x Thảm cách nhiệt (390.000) = 1.570.000

INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES
  (1, 1, 1, 1, 2890000),
  (2, 1, 13, 2, 350000),
  (3, 2, 20, 2, 590000),
  (4, 2, 26, 1, 390000);

-- 1 giỏ hàng mẫu (user đã đăng nhập)
INSERT INTO cart_items (id, user_id, session_id, product_id, quantity) VALUES
  (1, 2, NULL, 9, 1);

-- Đặt lại AUTO_INCREMENT cho các bảng có id chỉ định sẵn
ALTER TABLE categories AUTO_INCREMENT = 9;
ALTER TABLE products AUTO_INCREMENT = 29;
ALTER TABLE users AUTO_INCREMENT = 3;
ALTER TABLE orders AUTO_INCREMENT = 3;
ALTER TABLE order_items AUTO_INCREMENT = 5;
ALTER TABLE cart_items AUTO_INCREMENT = 2;
