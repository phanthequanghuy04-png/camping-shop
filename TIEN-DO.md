# Tiến độ dự án — Website Bán Đồ Cắm Trại

Cập nhật ngày **27/11/2026** (Bước 7 — bàn giao).
File này ghi đúng sự thật đã kiểm tra được; phần **chưa xong ghi rõ, không giấu**.

Tóm tắt nhanh: **Bước 2–7 đã làm xong ở mức demo** (database mẫu + app build
được + design system + tài liệu bàn giao). **Giai đoạn 2 (27/11/2026) đã làm
xong 8 việc còn lại:** import MySQL thật, backend/API Node + Express nối DB
`camping`, hash bcrypt thật (cả trong file SQL và trong DB đang chạy), ảnh
riêng từng sản phẩm (28 file local), kiểm tra bằng Chrome headless ở 4 cỡ màn
hình, đo tương phản + dark mode cơ bản, xóa `App.css` thừa + hết cảnh báo
build. Dự án **vẫn chưa phải bản production** (xem mục còn thiếu bên dưới):
mật khẩu demo vẫn yếu, JWT secret vẫn là giá trị dev, chưa có CRUD admin đầy
đủ, chưa kiểm tra trên máy thật có GPU.

---

## Bảng tiến độ từng bước

| Bước | Nội dung | Trạng thái |
|---|---|---|
| 2 | Thiết kế CSDL (`camping.sql`) | ✅ Xong (file mẫu, chưa import thử lên MySQL thật) |
| 3 | Khởi tạo app Vite + React + TypeScript | ✅ Xong (build pass) |
| 4 | Design System — Organic Biophilic | ✅ Xong (file tham khảo/staging, chưa tích hợp hết vào app) |
| 5 | Trang 3D Landscape + animation (ThreeUI, GSAP/Lenis/AOS) | ✅ Xong (build pass, `LandscapeScene` variant sunset) |
| 6 | Kiểm tra build, chạy thử, responsive | ✅ Xong ở mức build + curl + đọc code (chưa kiểm tra bằng trình duyệt thật) |
| 7 | Tài liệu bàn giao (`README.md`, `TIEN-DO.md`) | ✅ Xong (2 file này) |

---

## Bước 2 — Thiết kế CSDL

**Đã làm xong:**

- File: `camping.sql` (MySQL/MariaDB, utf8mb4, múi giờ `+07:00`, database
  thống nhất tên **`camping`** — đã sửa lỗi cũ dùng lệch tên `shopping`/`store`).
- **6 bảng:** `categories`, `products`, `users`, `orders`, `order_items`,
  `cart_items` — có khóa ngoại đầy đủ (`products → categories`,
  `orders → users`, `order_items → orders/products`,
  `cart_items → users/products`).
- Dữ liệu mẫu đã kiểm tra bằng đọc file:
  - **8 danh mục:** Lều trại, Túi ngủ, Bếp & dụng cụ nấu, Đèn & pin, Ba lô,
    Bàn ghế cắm trại, Quần áo & giày, Phụ kiện.
  - **28 sản phẩm, giá VND**, mỗi danh mục 3–4 món.
  - **2 user mẫu:** `admin@camping.vn` (admin), `user@camping.vn` (user).
  - **2 đơn hàng mẫu**, tổng tiền khớp với chi tiết:
    đơn 1 = 3.590.000đ (1 × lều Cloud Up 2 + 2 × đèn lồng LED),
    đơn 2 = 1.570.000đ (2 × ghế xếp + 1 × thảm cách nhiệt).
  - 1 giỏ hàng mẫu (user 2, 1 × bếp ga mini).
- Mật khẩu trong SQL **không lưu dạng text thường** như dự án cũ (`'123'`) —
  cột `password_hash` dùng placeholder bcrypt (xem phần còn thiếu).

**Kết quả kiểm tra:** đọc toàn bộ file, số liệu khớp. **Giai đoạn 2 đã import
thử:** MariaDB 10.11.14, import 1 lần exit 0, đủ 6 bảng / 28 sản phẩm /
8 danh mục / 2 user / 2 đơn / 4 order_items / 1 cart_item; tổng 2 đơn khớp
(3.590.000đ paid, 1.570.000đ pending). `camping.sql` không cần sửa.

**Còn thiếu (đã xong ở giai đoạn 2):**

- ✅ **Đã import thử `camping.sql` lên MySQL thật** — xem số liệu trên.
- ✅ `password_hash` đã thay bằng **hash bcrypt thật** (cost 10, 2 hash khác
  nhau) trong `camping.sql`, `app/src/data/users.ts` và **trong DB đang
  chạy** (đã UPDATE; login qua API trả `demo:false`).

## Bước 3 — Khởi tạo app Vite + React + TypeScript

**Đã làm xong:**

- File: `app/package.json` — **Vite 8.4.0 + React 19.3.1 + TypeScript ~7.0.2**,
  `react-router-dom` 7.18.7, **Tailwind CSS v4** (`@tailwindcss/vite` 4.3.5).
- Cấu trúc `app/src/` đã có đủ: `pages/` (9 trang: Home, Shop, ProductDetail,
  Cart, Checkout, Login, Register, Admin, Placeholder), `components/`
  (Hero3D, ProductCard), `context/CartContext.tsx`, `data/` (products, types,
  users), `assets/`, `lib/`.
- Dữ liệu mẫu trong app: `app/src/data/products.ts` (28 sản phẩm),
  `app/src/data/users.ts` (tài khoản mẫu).

**Kết quả kiểm tra:** `npm run build` **pass** (`tsc -b && vite build`),
thư mục `app/dist/` đã có, tổng **~3,0 MB**.

**Còn thiếu (đã xong ở giai đoạn 2):**

- ✅ App **đã nối database** qua backend/API Node + Express (`server/`,
  cổng 3001, chế độ MySQL thật): categories, products, auth, cart, orders,
  admin orders; `app/src/lib/api.ts` gọi API, fallback localStorage khi API
  chết (đã test cả 2 chế độ). Còn thiếu: đổi trạng thái đơn + CRUD sản phẩm
  cho admin, phân trang, rate limit, JWT secret dev cần đổi khi production.
- ✅ File `app/src/App.css` **đã xóa** sau khi grep xác nhận 0 file import.

## Bước 4 — Design System (Organic Biophilic)

**Đã làm xong:**

- File: `DESIGN-SYSTEM.md` — phong cách **Organic Biophilic** đã chọn sau
  khi tra cứu thật bằng UI UX Pro Max (`uipro` 2.15.0).
- Đã chốt: bảng màu rừng `#2D6A4F` / `#1B4332`, đất `#8B4513`, CTA đất nung
  `#C05621`, nền kem `#FAF6EC`; font **Be Vietnam Pro** (tiêu đề) + **Inter**
  (thân bài), cả hai đều hỗ trợ tiếng Việt; bo góc 16–24px; bóng mềm.
- File tokens: `_staging/design-tokens.css` (staging, chỉ để tham khảo và
  tích hợp sau, không sửa app trực tiếp).
- Style **Vibrant & Block-based** đã loại (không hợp shop ngoài trời);
  **3d-product-preview** (xem 360°/AR) để dành giai đoạn sau.
- Responsive: breakpoints **640 / 768 / 1024 / 1280**; lưới sản phẩm
  1 → 2 → 3–4 cột; kiểm tra ở 375px / 768px / 1024px / 1440px.

**Kết quả kiểm tra:** file design system đầy đủ, có ghi rõ nguồn tra cứu
và lý do chọn/loại từng style.

**Còn thiếu (đã xong ở giai đoạn 2, còn caveat):**

- ✅ Tương phản màu **đã đo lại bằng công cụ** (`_staging/contrast-check.py`):
  chỉ 1 cặp rớt là `#C05621` trên kem (4,24:1) → đã đổi accent thành
  `#A8431A` (6,03:1 trên trắng, 5,59:1 trên kem). Các cặp còn lại đều đạt.
- ✅ **Dark mode cơ bản đã làm** (biến `.dark` + `ThemeToggle.tsx`, **đã gắn
  vào Header**); nhiều chỗ trong pages vẫn hardcode hex nên dark chưa phủ
  toàn app — cần map sang token ở đợt sau.
- ⚠️ Design system đã áp dụng vào app qua `index.css` (variables + `@theme
  inline`); còn một số class hardcode hex trong pages chưa map sang token.

## Bước 5 — Trang 3D Landscape + animation

**Đã làm xong:**

- File: `app/src/components/Hero3D.tsx` dùng **`LandscapeScene`** của
  `@designcodeio/threeui` **1.2.0**, variant **sunset** (hoàng hôn).
- Trang runtime 3D riêng: `app/public/landscape.html` → sau build ra
  `dist/landscape.html` (~2,4 MB).
- Tài liệu staging: `_staging/hero-3d.md`, `_staging/animation.md`.
- Thư viện animation đã có trong `app/package.json` và đã tách chunk riêng
  trong `dist/assets/`: **GSAP 3.15.1, Lenis 1.3.29, AOS 2.3.4**
  (`@types/aos` 3.0.8).

**Kết quả kiểm tra:** build pass; `dist/assets/` có đủ chunk
`gsap-*.js`, `lenis-*.js`, `aos-*.js`; dev server trả HTTP 200 ở
`/landscape.html`.

**Còn thiếu:**

- ❌ **Không dùng `AtTheHorizon`** — tên này không tồn tại trong threeui
  v1.2.0 (chỉ có trong README ví dụ của thư viện), đừng tìm/import nó.
  (Đây là lưu ý, không phải lỗi — app đã dùng đúng `LandscapeScene`.)
- ❌ Chưa kiểm tra cảnh 3D hiển thị thật bằng trình duyệt (xem Bước 6).

## Bước 6 — Kiểm tra build, chạy thử, responsive

**Đã làm xong:**

- `npm run build` **pass**; `app/dist/` ~3,0 MB đã có sẵn.
- Dev server trả **HTTP 200** ở `/`, `/landscape.html` và `/shop`.
- Responsive theo code: lưới sản phẩm 1 → 2 → 3–4 cột, breakpoints
  640 / 768 / 1024 / 1280 (theo `DESIGN-SYSTEM.md` mục 5).
- Tài khoản mẫu đăng nhập demo: `admin@camping.vn` / `user@camping.vn`,
  mật khẩu demo `123456` (xem cảnh báo ở dưới).

**Kết quả kiểm tra:** build + curl + đọc code đều đạt. **Giai đoạn 2 đã kiểm
tra bằng Chrome headless thật** (Chrome for Testing 159): ảnh chụp 9 file
trong `_staging/screenshots/` ở 375/768/1024/1440px cho `/` và `/shop`,
lưới đúng breakpoint, không tràn ngang, burger menu và Thêm vào giỏ bấm
được thật (badge 0 → 1), 0 lỗi JS. Tìm thấy 1 lỗi thật (nút "Xem bộ sưu
tập" trên hero chỉ 1,02:1) — **đã sửa** bằng `.btn-outline-light` (9,72:1).

**Còn thiếu (đã xong ở giai đoạn 2, còn caveat):**

- ✅ **Đã kiểm tra bằng trình duyệt headless thật** — xem kết quả trên.
  Chưa kiểm tra được: variant hoàng hôn sunset trên máy có GPU, font Google
  và ảnh fallback Unsplash trong Chrome của máy này (proxy chặn tunnel),
  chưa bấm thử Mua ngay / thanh toán / đăng nhập.
- ✅ **Ảnh sản phẩm đã là ảnh riêng từng món** (28 file local trong
  `app/public/images/`, không còn dùng chung URL Unsplash). Hạn chế: ảnh
  túi ngủ/đèn/bếp/giày/dao chỉ đúng bối cảnh chứ chưa phải ảnh chụp đúng
  mẫu/thương hiệu.
- ✅ Mật khẩu demo **`123456` đã có hash bcrypt thật** trong SQL, TS và DB
  đang chạy; login qua API trả `demo:false`. Mật khẩu vẫn yếu — production
  phải đổi mật khẩu mạnh, riêng từng tài khoản.

## Bước 7 — Tài liệu bàn giao

**Đã làm xong:**

- File: `README.md` — giới thiệu dự án, công nghệ, cấu trúc thư mục
  (`camping.sql`, `app/`, `DESIGN-SYSTEM.md`, `_staging/`, `_old-shopping/`),
  cách chạy (`npm install`, `npm run dev` → http://localhost:5173,
  `npm run build`, `npm run preview`), cách thay ảnh/giá thật
  (`src/data/products.ts` + `camping.sql`), cách import `camping.sql` vào
  MySQL, tài khoản mẫu, cách dùng `uipro` / threeui / GSAP / Lenis / AOS.
- File: `TIEN-DO.md` — chính file này.
- Cả hai file viết bằng tiếng Việt, số liệu lấy từ file gốc đã đọc và kết quả
  kiểm tra thật, không bịa số liệu.

**Còn thiếu:**

- ❌ Đây là bước cuối của giai đoạn demo — các mục "còn thiếu" ở Bước 2–6
  vẫn còn nguyên, chuyển sang giai đoạn tiếp theo (backend + ảnh thật +
  kiểm tra trình duyệt thật).

---

## Danh sách việc còn lại (tổng hợp, theo thứ tự nên làm)

8 việc của giai đoạn 2 đã làm xong ngày 27/11/2026 (kiểm tra thật, số liệu bên dưới):

1. ✅ **Import `camping.sql` lên MySQL thật** — MariaDB 10.11.14 chạy ở
   127.0.0.1:3306, import 1 lần exit 0, đủ 6 bảng / 28 sản phẩm / 8 danh mục /
   2 user / 2 đơn / 4 order_items / 1 cart_item; tổng 2 đơn khớp (3.590.000đ
   paid, 1.570.000đ pending). `camping.sql` không cần sửa.
2. ✅ **Backend/API Node + Express** (`server/`, cổng 3001, chế độ MySQL thật):
   categories, products (tìm không dấu, lọc, sắp xếp), login/register,
   cart (kèm session_id khách vãng lai), tạo đơn trừ tồn kho, admin xem đơn;
   app gọi API qua `app/src/lib/api.ts`, fallback localStorage khi API chết
   (đã test cả 2 chế độ). Build app pass.
3. ✅ **Hash bcrypt thật** — 2 hash cost 10 khác nhau (salt khác nhau) cho
   mật khẩu demo `123456`, đã thay trong `camping.sql`, `app/src/data/users.ts`
   (dùng `bcrypt.compareSync`) **và trong DB đang chạy** (đã UPDATE, login
   qua API trả `demo:false`, sai mật khẩu bị từ chối).
4. ✅ **Ảnh riêng từng sản phẩm** — 28 file JPG riêng trong
   `app/public/images/` (tổng ~2,9 MB, mỗi file 53–273 KB), `products.ts`
   trỏ `/images/<tên-file>.jpg`, `camping.sql` khớp 100% tên file, build pass.
   Hạn chế: ảnh túi ngủ/đèn/bếp ga/bếp củi/giày/dao chỉ đúng bối cảnh chứ
   chưa phải ảnh chụp đúng mẫu/thương hiệu — thay file giữ nguyên tên là xong.
5. ✅ **Kiểm tra bằng Chrome headless thật** — Chrome for Testing 159,
   ảnh chụp ở 375/768/1024/1440px cho `/` và `/shop` trong
   `_staging/screenshots/` (9 file). Lưới đúng breakpoint, không tràn ngang,
   burger menu và Thêm vào giỏ bấm được thật (badge 0 → 1), 0 lỗi JS.
   Tìm thấy 1 lỗi thật: nút "Xem bộ sưu tập" trên hero chỉ 1,02:1 — **đã sửa**
   bằng class `.btn-outline-light` (chữ kem trên nền hero đạt 9,72:1).
   Chưa kiểm tra được: variant hoàng hôn sunset trên máy có GPU, font Google
   và ảnh fallback Unsplash trong Chrome của máy này (proxy chặn tunnel),
   chưa bấm thử Mua ngay / thanh toán / đăng nhập.
6. ✅ **Đo tương phản + dark mode** — script `_staging/contrast-check.py`:
   chỉ 1 cặp rớt là `#C05621` trên kem (4,24:1) → đã đổi accent thành
   `#A8431A` (6,03:1 trên trắng, 5,59:1 trên kem), hover `#83361A`, đồng bộ
   3 chỗ. Dark mode cơ bản xong (biến `.dark` + component `ThemeToggle.tsx`),
   **đã gắn vào Header** và build pass; nhiều chỗ trong pages vẫn hardcode
   hex nên dark chưa phủ toàn app.
7. ✅ **Xóa `App.css` thừa + hết cảnh báo build** — grep 0 import rồi xóa;
   6 cảnh báo `[IMPORT_IS_UNDEFINED]` (LinearEncoding/sRGBEncoding) đã sửa
   bằng deep import `LandscapeScene`, build cuối pass 746ms, 53 modules,
   0 cảnh báo, dist 5,9 MB.
8. ✅ **Cập nhật README.md + TIEN-DO.md** — chính đợt cập nhật này.

Việc tiếp theo nên làm (theo thứ tự): đổi mật khẩu demo yếu + JWT secret dev
sang giá trị production; thêm đổi trạng thái đơn + CRUD sản phẩm cho admin;
kiểm tra trên máy thật có GPU (hero sunset, font, ảnh fallback); thay ảnh
đúng mẫu cho túi ngủ/đèn/bếp/giày/dao; phủ dark mode hết các page hardcode
hex; bấm thử luồng Mua ngay / thanh toán / đăng nhập.

## Ghi chú về thư mục `_old-shopping/`

`_old-shopping/shopping_v100/shopping_v11` là **bản cũ, không dùng, không sửa**
— chỉ giữ lại để đối chiếu. Mọi công việc mới làm trên `app/` và `camping.sql`,
không sửa bản cũ này.
