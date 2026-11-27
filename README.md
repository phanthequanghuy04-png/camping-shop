# Website Bán Đồ Cắm Trại — Camping Shop

Tài liệu bàn giao dự án (Bước 7). Mọi số liệu trong file này đều đã được kiểm tra
thật từ code, file SQL và kết quả build — không ghi số liệu ước đoán.

> ⚠️ **Trạng thái thật của dự án (cập nhật 27/11/2026, giai đoạn 2):** đã có
> **backend/API Node + Express** (`server/`, cổng 3001) nối app với **MySQL
> thật** (MariaDB 10.11, DB `camping` đã import đủ 6 bảng / 28 sản phẩm /
> 8 danh mục), hash bcrypt thật trong cả file SQL và DB đang chạy, ảnh riêng
> từng sản phẩm (28 file local), kiểm tra bằng Chrome headless ở 4 cỡ màn
> hình, đo tương phản + dark mode cơ bản, build pass không còn cảnh báo.
> Dự án **vẫn chưa phải hệ thống bán hàng production**: mật khẩu demo vẫn
> yếu (`123456`), JWT secret vẫn là giá trị dev, chưa có đổi trạng thái đơn
> và CRUD sản phẩm cho admin, chưa kiểm tra trên máy thật có GPU.
> Xem mục [Còn thiếu / chưa làm](#7-còn-thiếu--chưa-làm) trước khi đưa lên production.

---

## 1. Giới thiệu dự án

Website bán đồ cắm trại (lều trại, túi ngủ, bếp dã ngoại, đèn pin, ba lô,
bàn ghế, quần áo & giày, phụ kiện) với:

- Trang chủ có cảnh 3D phong cảnh hoàng hôn (ThreeUI `LandscapeScene`).
- Trang cửa hàng (`/shop`): lưới sản phẩm, lọc theo danh mục.
- Trang chi tiết sản phẩm, giỏ hàng, thanh toán (checkout), đăng nhập / đăng ký.
- Trang quản trị (`AdminPage`) xem đơn hàng mẫu.
- 28 sản phẩm mẫu, giá bằng **VND**, chia theo 8 danh mục.
- Thiết kế theo phong cách **Organic Biophilic** (gần gũi thiên nhiên, màu
  rừng / đất / đất nung) — xem chi tiết trong `DESIGN-SYSTEM.md`.

## 2. Công nghệ

| Thành phần | Phiên bản (đã kiểm tra trong `app/package.json`) |
|---|---|
| Vite | 8.4.0 |
| React | 19.3.1 |
| TypeScript | ~7.0.2 |
| react-router-dom | 7.18.7 |
| Tailwind CSS | v4 (`@tailwindcss/vite` 4.3.5, `tailwindcss` 4.3.5) |
| @designcodeio/threeui | 1.2.0 — dùng `LandscapeScene`, variant **sunset** (hoàng hôn) |
| GSAP | 3.15.1 |
| Lenis (cuộn mượt) | 1.3.29 |
| AOS (hiệu ứng khi cuộn) | 2.3.4 (`@types/aos` 3.0.8) |

Cơ sở dữ liệu (file SQL mẫu, chưa nối vào app): **MySQL / MariaDB, utf8mb4**,
tên database thống nhất là **`camping`**.

**Kết quả kiểm tra đã xác minh (ngày 27/11/2026):**

- `npm run build` **pass** (`tsc -b && vite build`).
- Thư mục `app/dist/` đã có, tổng dung lượng **~3,0 MB**
  (trong đó `landscape.html` ~2,4 MB — file runtime của cảnh 3D).
- Dev server trả **HTTP 200** ở `/`, `/landscape.html` và `/shop`.
- Responsive: lưới sản phẩm **1 cột (mobile) → 2 cột (tablet) → 3–4 cột (desktop)**,
  breakpoints **640 / 768 / 1024 / 1280** (xem `DESIGN-SYSTEM.md` mục 5).

## 3. Cấu trúc thư mục

```text
camping-shop/
├── README.md            ← file này (bàn giao, Bước 7)
├── TIEN-DO.md           ← tiến độ từng bước 2–7 (Bước 7)
├── camping.sql          ← database mẫu: 6 bảng, 8 danh mục, 28 sản phẩm,
│                          2 user mẫu, 2 đơn hàng mẫu (MySQL/MariaDB)
├── DESIGN-SYSTEM.md     ← design system Organic Biophilic: màu, font,
│                          component, responsive (file tham khảo, Bước 4a)
├── _staging/            ← file staging, chỉ để tham khảo / tích hợp sau,
│   ├── design-tokens.css    không sửa app trực tiếp từ đây
│   ├── hero-3d.md
│   └── animation.md
├── _old-shopping/       ← bản cũ (shopping_v100 / shopping_v11), KHÔNG dùng,
│                          KHÔNG sửa — chỉ giữ lại để đối chiếu
└── app/                 ← ứng dụng Vite + React + TypeScript
    ├── package.json
    ├── index.html
    ├── public/
    │   └── landscape.html   ← trang runtime của cảnh 3D (đi kèm dist)
    ├── dist/                ← kết quả build (~3,0 MB, đã build sẵn)
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── App.css          ← ⚠️ file thừa, KHÔNG được import ở đâu — xem mục 7
        ├── index.css
        ├── data/
        │   ├── products.ts  ← 28 sản phẩm mẫu (ảnh, giá VND) — sửa giá/ảnh ở đây
        │   ├── types.ts
        │   └── users.ts     ← tài khoản mẫu (bản demo, localStorage)
        ├── context/
        │   └── CartContext.tsx
        ├── components/
        │   ├── Hero3D.tsx       ← cảnh 3D ThreeUI LandscapeScene
        │   └── ProductCard.tsx
        ├── pages/
        │   ├── HomePage.tsx
        │   ├── ShopPage.tsx
        │   ├── ProductDetailPage.tsx
        │   ├── CartPage.tsx
        │   ├── CheckoutPage.tsx
        │   ├── LoginPage.tsx
        │   ├── RegisterPage.tsx
        │   ├── AdminPage.tsx
        │   └── Placeholder.tsx
        ├── assets/
        └── lib/
```

## 4. Cách chạy

Yêu cầu: **Node.js** (đã cài sẵn trên máy phát triển) và **npm**.

```bash
cd ~/workspace/projects/camping-shop/app

npm install     # cài dependencies (chỉ cần chạy 1 lần, hoặc khi đổi package.json)
npm run dev     # chạy dev server → http://localhost:5173
npm run build   # build production: tsc -b && vite build → ra thư mục dist/
npm run preview # chạy thử bản build trong dist/ (mặc định http://localhost:4173)
npm run lint    # kiểm tra lint bằng oxlint
```

Các trang chính để mở thử sau khi chạy dev:

- `/` — trang chủ (hero 3D hoàng hôn)
- `/landscape.html` — trang cảnh 3D độc lập
- `/shop` — cửa hàng, lọc theo 8 danh mục

### Chạy backend/API (server Node + Express, cổng 3001)

```bash
cd ~/workspace/projects/camping-shop/server
npm install   # đã cài (97 packages)
npm start     # chế độ MySQL thật khi MariaDB đang chạy; DB chết thì tự fallback dữ liệu mẫu
curl http://localhost:3001/api/health   # phải trả {"ok":true,"mode":"mysql","db":true}
```

Endpoint chính: `GET /api/categories`, `GET /api/products` (`?q=`, `?category=`,
`?sort=`), `GET /api/products/:id`, `POST /api/auth/login|register`,
`GET/POST /api/cart`, `POST /api/orders`, `GET /api/admin/orders` (cần token
admin). App đọc API qua `VITE_API_URL` (mặc định `http://localhost:3001`),
lỗi thì fallback localStorage. Lưu ý: server đang chạy nền; khởi động lại
máy thì chạy lại `npm start` trong `server/`.

## 5. Cách thay ảnh / giá thật

### 5.1. Thay ảnh và giá trong app (front-end)

Sửa file **`app/src/data/products.ts`** — đây là nguồn dữ liệu thật mà app
đang đọc (app chưa nối database, nên sửa SQL mà không sửa file này thì
giao diện không đổi).

- **Giá:** sửa trường `price` của từng sản phẩm (đơn vị VND, ví dụ `2890000`).
- **Ảnh:** sửa trường ảnh của từng sản phẩm.
  Hiện tại ảnh là **28 file riêng trong `app/public/images/`**
  (`/images/<tên-file>.jpg`, tổng ~2,9 MB), không còn dùng chung URL
  Unsplash. Khi có ảnh thật: thay file trong `app/public/images/` giữ
  nguyên tên là xong, không cần sửa code; tên file khớp 100% với cột
  `image` trong `camping.sql`.
- **Tên / mô tả / số lượng / đánh giá:** sửa cùng trong `products.ts`
  (các trường `name`, `description`, `quantity`, `rating`).

### 5.2. Thay dữ liệu trong database mẫu

Sửa **`camping.sql`** (phần `INSERT INTO products ...` và
`INSERT INTO categories ...`) sao cho khớp với `products.ts` — tên file ảnh
trong SQL hiện chỉ là tên file mẫu (ví dụ `leu-trai-2-nguoi.jpg`), không phải
link ảnh thật. Sau khi sửa, import lại theo mục 6 để kiểm tra.

## 6. Cách import `camping.sql` vào MySQL

> ✅ **Đã import thử lên MySQL thật** (giai đoạn 2, 27/11/2026): MariaDB
> 10.11.14 chạy ở 127.0.0.1:3306, import 1 lần exit 0, đủ 6 bảng /
> 28 sản phẩm / 8 danh mục / 2 user / 2 đơn. `camping.sql` không cần sửa.
> Lệnh dưới đây dùng khi import lại từ đầu hoặc trên máy khác.

```bash
# Cách 1: import từ terminal (cần MySQL/MariaDB đang chạy)
mysql -u root -p < ~/workspace/projects/camping-shop/camping.sql

# Cách 2: đăng nhập MySQL rồi chạy lệnh trong đó
mysql -u root -p
mysql> source ~/workspace/projects/camping-shop/camping.sql
```

File sẽ tự tạo database **`camping`** (utf8mb4, múi giờ `+07:00`) và nạp dữ liệu mẫu:

| Bảng | Dữ liệu mẫu |
|---|---|
| `categories` | 8 danh mục: Lều trại, Túi ngủ, Bếp & dụng cụ nấu, Đèn & pin, Ba lô, Bàn ghế cắm trại, Quần áo & giày, Phụ kiện |
| `products` | 28 sản phẩm, giá VND, mỗi danh mục 3–4 món |
| `users` | 2 user mẫu (xem mục 6.1 — **password_hash chỉ là placeholder**) |
| `orders` | 2 đơn hàng mẫu, tổng tiền đã khớp với chi tiết đơn |
| `order_items` | 4 dòng chi tiết (đơn 1: 3.590.000đ; đơn 2: 1.570.000đ) |
| `cart_items` | 1 giỏ hàng mẫu (user 2, 1 × bếp ga mini) |

Kiểm tra sau khi import:

```sql
USE camping;
SHOW TABLES;                 -- phải có đủ 6 bảng
SELECT COUNT(*) FROM products;    -- phải ra 28
SELECT COUNT(*) FROM categories;  -- phải ra 8
```

### 6.1. Tài khoản mẫu

| Vai trò | Email | Mật khẩu demo |
|---|---|---|
| Admin | `admin@camping.vn` | `123456` |
| User | `user@camping.vn` | `123456` |

> ⚠️ **CẢNH BÁO BẢO MẬT — ĐỌC KỸ TRƯỚC KHI ĐƯA LÊN PRODUCTION:**
>
> - Mật khẩu `123456` **vẫn yếu** (dùng chung cho cả 2 tài khoản demo).
> - Hash bcrypt thật (cost 10, 2 hash khác nhau) **đã có** trong `camping.sql`,
>   `app/src/data/users.ts` **và trong DB đang chạy** (đã UPDATE; login qua
>   API nay trả `demo:false`, sai mật khẩu bị từ chối). Đây là hash của mật
>   khẩu demo, chỉ dùng cho demo.
> - Khi triển khai thật: đổi mật khẩu mạnh, riêng cho từng tài khoản, tạo
>   lại hash bcrypt; đổi `JWT_SECRET` trong `server/.env` (hiện là giá trị
>   dev); **tuyệt đối không ghi mật khẩu thật vào file SQL hay đưa lên git**.

## 7. Còn thiếu / chưa làm

Những điểm này đã được xác minh là **chưa xong** — không giấu, ghi rõ để
người nhận bàn giao xử lý tiếp (chi tiết từng bước xem `TIEN-DO.md`).
Các mục 1–4, 6–8 của bản cũ đã xong ở giai đoạn 2 (27/11/2026); chỉ còn:

1. **Mật khẩu demo `123456` vẫn yếu + JWT secret dev** — hash bcrypt thật
   đã có trong SQL, `users.ts` và DB đang chạy (login qua API trả
   `demo:false`), nhưng mật khẩu demo vẫn là `123456` cho cả 2 tài khoản và
   `JWT_SECRET` trong `server/.env` vẫn là giá trị dev — **phải đổi cả hai
   khi production** (xem mục 6.1).
2. **Chưa có đổi trạng thái đơn + CRUD sản phẩm cho admin** (API mới có
   `GET /api/admin/orders`); chưa có phân trang, rate limit.
3. **Chưa kiểm tra trên máy thật có GPU** — hero 3D variant hoàng hôn sunset
   mới chỉ xác minh engine render bằng Chrome headless; font Google và ảnh
   fallback Unsplash cũng chưa thấy bằng mắt trong Chrome của máy này
   (proxy chặn tunnel). Cần mở trên máy thật để xem.
4. **Ảnh chưa phải ảnh chụp đúng mẫu/thương hiệu** — 28 ảnh local riêng từng
   món đã xong, nhưng ảnh túi ngủ/đèn/bếp/giày/dao chỉ đúng bối cảnh chứ
   chưa phải ảnh đúng mẫu (xem `TIEN-DO.md`); thay file giữ nguyên tên là xong.
5. **Dark mode chưa phủ toàn app** — biến `.dark` + nút `ThemeToggle` đã gắn
   vào Header, nhưng nhiều chỗ trong pages vẫn hardcode hex, cần map sang token.
6. **Chưa bấm thử luồng Mua ngay / thanh toán / đăng nhập** bằng trình duyệt
   (mới bấm thử Thêm vào giỏ); tài khoản tự đăng ký trong localStorage vẫn
   lưu mật khẩu text thường — cần chuyển sang hash phía server khi có backend
   đầy đủ.
7. **Không dùng `AtTheHorizon`.** Tên này không tồn tại trong threeui v1.2.0
   (chỉ có trong README ví dụ của thư viện) — app dùng `LandscapeScene`
   variant sunset, đừng tìm/import `AtTheHorizon`.
8. **Tương phản màu đã đo lại** (`_staging/contrast-check.py`): accent đã
   đổi thành `#A8431A` để đạt ≥ 4.5:1; nút "Xem bộ sưu tập" trên hero đã sửa
   bằng `.btn-outline-light` (9,72:1).

Đã xong ở giai đoạn 2: import MySQL thật; backend/API; hash bcrypt thật;
ảnh riêng từng món; kiểm tra Chrome headless 4 cỡ màn hình; đo tương phản +
dark mode cơ bản; xóa `App.css` thừa; hết cảnh báo build
`[IMPORT_IS_UNDEFINED]` (deep import `LandscapeScene`).

## 8. Cách dùng các công cụ

### 8.1. UI UX Pro Max (`uipro`, v2.15.0)

Công cụ tra cứu style / design system đã dùng để chọn phong cách
Organic Biophilic cho dự án (xem `DESIGN-SYSTEM.md` mục 1). Cách tra cứu lại:

```bash
python3 ~/workspace/custom-skills/ui-ux-pro-max/scripts/search.py \
  "outdoor camping e-commerce store, earthy forest style" --domain style
```

Thêm `--design-system` để tra cứu design system hoàn chỉnh của một truy vấn.
Kết quả tra cứu được ghi lại trong `DESIGN-SYSTEM.md` — khi muốn đổi style,
tra cứu lại rồi cập nhật file đó trước, đừng sửa thẳng màu trong app.

### 8.2. ThreeUI (`@designcodeio/threeui` 1.2.0)

- Component dùng trong app: `LandscapeScene` (import trong
  `app/src/components/Hero3D.tsx`), variant **sunset** (hoàng hôn).
- Cảnh 3D có trang runtime riêng: `app/public/landscape.html`
  (sau build ra `dist/landscape.html`, ~2,4 MB).
- ⚠️ **Không dùng `AtTheHorizon`** — tên này không tồn tại trong threeui
  v1.2.0. Nếu tài liệu/thư viện ví dụ nhắc tới nó, bỏ qua.

### 8.3. GSAP 3.15.1 / Lenis 1.3.29 / AOS 2.3.4

- **GSAP:** animation chuyển động (timeline, ScrollTrigger — xem
  `_staging/animation.md`).
- **Lenis:** cuộn mượt (smooth scroll) cho toàn trang.
- **AOS:** hiệu ứng hiện dần khi cuộn tới (animate on scroll).
- Cả ba đều đã có trong `dependencies` của `app/package.json` và đã được
  tách thành chunk riêng trong `dist/assets/` sau khi build
  (`gsap-*.js`, `lenis-*.js`, `aos-*.js`).
- Khi thêm hiệu ứng mới: tham khảo `_staging/animation.md` trước, giữ đúng
  thời gian chuyển động chuẩn của design system (150ms / 250ms / 400ms,
  `ease-out`) và tôn trọng `prefers-reduced-motion`.

---

*Bàn giao ngày 27/11/2026 — Bước 7. File đi kèm: `TIEN-DO.md` (tiến độ từng
bước 2–7, gồm cả phần chưa làm).*
