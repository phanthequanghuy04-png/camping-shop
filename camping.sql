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
  total DECIMAL(12,0) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  address VARCHAR(500) NULL,
  phone VARCHAR(15) NULL,
  customer_name VARCHAR(250) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL,
  CONSTRAINT chk_orders_status CHECK (status IN ('pending', 'paid', 'shipped', 'done', 'cancelled'))
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
  (1, 'Lều trại 2 người Naturehike Cloud Up 2', 'leu-trai-2-nguoi.jpg', 2890000, 15, 1, 1, 'Lều 2 người siêu nhẹ, chống mưa tốt, dựng nhanh trong 5 phút.', 4.8),
  (2, 'Lều trại 4 người Coleman Sundome 4', 'leu-trai-4-nguoi.jpg', 4500000, 10, 1, 1, 'Lều 4 người rộng rãi, thoáng khí, phù hợp cắm trại gia đình cuối tuần.', 4.7),
  (3, 'Lều trại gia đình 6 người Decathlon Quechua Arpenaz 6.3', 'leu-trai-gia-dinh-6-nguoi.jpg', 6900000, 8, 1, 1, 'Lều gia đình 6 người có 2 phòng ngủ riêng, chống nắng và chống mưa tốt.', 4.6),
  (4, 'Lều cắm trại tự bung 2 người Naturehike', 'leu-trai-tu-bung.jpg', 1590000, 20, 1, 1, 'Lều tự bung tiện lợi, mở ra là dùng ngay, gấp gọn chỉ trong vài giây.', 4.5),
  -- 2. Túi ngủ
  (5, 'Túi ngủ mùa đông Naturehike ULG700', 'tui-ngu-mua-dong.jpg', 2450000, 12, 1, 2, 'Túi ngủ lông vũ chịu lạnh tới -7 độ, nhẹ và ấm cho mùa đông vùng cao.', 4.8),
  (6, 'Túi ngủ 3 mùa Coleman Brazos', 'tui-ngu-3-mua.jpg', 1290000, 18, 1, 2, 'Túi ngủ 3 mùa êm ái, thoáng mát, phù hợp cắm trại xuân hè thu.', 4.6),
  (7, 'Túi ngủ đôi Decathlon Quechua', 'tui-ngu-doi.jpg', 1890000, 9, 1, 2, 'Túi ngủ đôi rộng rãi cho 2 người, có thể tách thành 2 túi đơn khi cần.', 4.5),
  (8, 'Túi ngủ siêu nhẹ Naturehike LW180', 'tui-ngu-sieu-nhe.jpg', 890000, 25, 1, 2, 'Túi ngủ siêu nhẹ chỉ 700g, gọn trong ba lô, lý tưởng cho trekking.', 4.4),
  -- 3. Bếp & dụng cụ nấu
  (9, 'Bếp ga mini dã ngoại Fire-Maple', 'bep-ga-mini.jpg', 650000, 30, 1, 3, 'Bếp ga mini gấp gọn, lửa mạnh và ổn định, nấu nhanh ngoài trời.', 4.7),
  (10, 'Bộ nồi nấu ăn dã ngoại Naturehike 4 món', 'bo-noi-da-ngoai.jpg', 890000, 22, 1, 3, 'Bộ nồi nhôm 4 món nhẹ, chống dính, xếp gọn vào nhau tiết kiệm diện tích.', 4.6),
  (11, 'Bếp củi gấp gọn Lixada', 'bep-cui-gap-gon.jpg', 450000, 28, 1, 3, 'Bếp củi inox gấp gọn, đốt bằng củi khô, tiện mang theo khi trekking.', 4.3),
  (12, 'Bình giữ nhiệt Stanley 1L', 'binh-giu-nhiet.jpg', 990000, 35, 1, 3, 'Bình giữ nhiệt 1 lít giữ nóng 24 giờ, giữ lạnh 24 giờ, bền và chắc chắn.', 4.8),
  -- 4. Đèn & pin
  (13, 'Đèn lồng LED cắm trại Naturehike', 'den-long-led.jpg', 350000, 40, 1, 4, 'Đèn lồng LED sáng dịu, pin dùng 30 giờ, có móc treo tiện lợi trong lều.', 4.6),
  (14, 'Đèn pin đội đầu Petzl Actik', 'den-pin-doi-dau.jpg', 1150000, 20, 1, 4, 'Đèn đội đầu sáng 450 lumen, chống nước, rảnh tay khi đi rừng ban đêm.', 4.8),
  (15, 'Đèn dây trang trí lều 10m', 'den-day-trang-tri.jpg', 290000, 32, 1, 4, 'Dây đèn LED 10m trang trí lều ấm cúng, chống nước, dùng pin sạc USB.', 4.4),
  (16, 'Đèn pin siêu sáng Nitecore', 'den-pin-sieu-sang.jpg', 890000, 15, 1, 4, 'Đèn pin cầm tay siêu sáng 1000 lumen, pin sạc, nhỏ gọn bỏ túi áo.', 4.7),
  -- 5. Ba lô
  (17, 'Ba lô leo núi Osprey Atmos 65L', 'ba-lo-leo-nui-65l.jpg', 5900000, 6, 1, 5, 'Ba lô leo núi 65 lít, lưng lưới thoáng khí, đeo êm cho chuyến đi dài ngày.', 4.9),
  (18, 'Ba lô trekking Deuter Futura 32L', 'ba-lo-trekking-32l.jpg', 3450000, 10, 1, 5, 'Ba lô trekking 32 lít, ôm lưng tốt, đủ đồ cho chuyến đi 2-3 ngày.', 4.7),
  (19, 'Ba lô dã ngoại Naturehike 55L', 'ba-lo-da-ngoai-55l.jpg', 1450000, 16, 1, 5, 'Ba lô dã ngoại 55 lít chống nước nhẹ, nhiều ngăn, giá tốt cho người mới.', 4.5),
  -- 6. Bàn ghế cắm trại
  (20, 'Ghế xếp dã ngoại Naturehike', 'ghe-xep-da-ngoai.jpg', 590000, 24, 1, 6, 'Ghế xếp khung nhôm nhẹ, chịu tải 120kg, gấp gọn mang theo dễ dàng.', 4.6),
  (21, 'Bàn gấp nhôm dã ngoại Coleman', 'ban-gap-nhom.jpg', 1190000, 12, 1, 6, 'Bàn gấp nhôm chắc chắn, mặt bàn rộng, xếp gọn như vali khi di chuyển.', 4.7),
  (22, 'Ghế võng xếp gọn', 'ghe-vong-xep-gon.jpg', 750000, 18, 1, 6, 'Ghế võng xếp gọn thư giãn bên lửa trại, vải bền, khung thép chắc chắn.', 4.2),
  -- 7. Quần áo & giày
  (23, 'Áo khoác chống nước The North Face', 'ao-khoac-chong-nuoc.jpg', 2890000, 14, 1, 7, 'Áo khoác chống nước, chống gió, thoáng khí, mặc được cả đi mưa rừng.', 4.7),
  (24, 'Giày leo núi Salomon X Ultra 4', 'giay-leo-nui.jpg', 3990000, 9, 1, 7, 'Giày leo núi đế bám tốt, chống nước, êm chân trên địa hình đá dốc.', 4.8),
  (25, 'Áo giữ nhiệt Columbia', 'ao-giu-nhiet.jpg', 690000, 26, 1, 7, 'Áo giữ nhiệt mặc lót bên trong, ấm nhẹ, thấm mồ hôi tốt khi vận động.', 4.5),
  -- 8. Phụ kiện
  (26, 'Thảm cách nhiệt Naturehike', 'tham-cach-nhiet.jpg', 390000, 38, 1, 8, 'Thảm cách nhiệt trải lều êm lưng, chống ẩm từ mặt đất, cuộn gọn nhẹ.', 4.5),
  (27, 'Dao đa năng Victorinox', 'dao-da-nang.jpg', 890000, 21, 1, 8, 'Dao đa năng 12 chức năng, thép không gỉ, nhỏ gọn cho mọi chuyến đi rừng.', 4.9),
  (28, 'Bộ dụng cụ sơ cứu dã ngoại', 'bo-so-cuu.jpg', 250000, 45, 1, 8, 'Bộ sơ cứu dã ngoại đầy đủ băng gạc và thuốc cơ bản, túi chống nước.', 4.3);

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
