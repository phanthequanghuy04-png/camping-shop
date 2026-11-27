# Camping Shop — Backend API

Backend Node.js + Express nối app React với DB MySQL `camping`
(6 bảng trong `../camping.sql`). Khi MySQL chưa chạy được, server tự
chuyển sang **chế độ fallback** (dữ liệu mẫu trong bộ nhớ, sao chép đúng
`camping.sql`) để frontend vẫn gọi API được.

## Chạy

```bash
cd ~/workspace/projects/camping-shop/server
npm install
cp .env.example .env   # sửa DB_USER/DB_PASSWORD/JWT_SECRET nếu cần
npm start              # http://localhost:3001
```

Kiểm tra nhanh: `curl http://localhost:3001/api/health` — trường `mode`
cho biết đang dùng `mysql` hay `fallback`. Sau khi luồng khác cài xong
MySQL + import `../camping.sql`, chỉ cần khởi động lại server là dùng
DB thật (không cần sửa code).

## Cấu hình (.env)

| Biến | Mặc định | Ghi chú |
| --- | --- | --- |
| `DB_HOST` / `DB_PORT` | `127.0.0.1` / `3306` | MySQL local |
| `DB_USER` / `DB_PASSWORD` | `root` / _(trống)_ | Theo máy hiện tại |
| `DB_NAME` | `camping` | |
| `PORT` | `3001` | |
| `JWT_SECRET` | `dev-only-change-me…` | **Đổi khi chạy production** |
| `JWT_EXPIRES_IN` | `7d` | |

## Endpoints

| Method | Endpoint | Ghi chú |
| --- | --- | --- |
| GET | `/api/health` | `{ ok, mode: 'mysql' \| 'fallback', db }` |
| GET | `/api/categories` | 8 danh mục |
| GET | `/api/products?q=&category=&sort=` | `q` tìm không dấu; `sort=price_asc` / `price_desc`; chỉ `status=1` |
| GET | `/api/products/:id` | 404 khi không có |
| POST | `/api/auth/register` | `{ name, email, phone?, password }` → hash bcrypt thật, trả `{ user, token }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ user, token }` |
| GET | `/api/cart?session_id=` hoặc `?user_id=` | Giỏ kèm thông tin sản phẩm |
| POST | `/api/cart` | `{ session_id? \| user_id?, product_id, quantity }` (upsert, chặn vượt tồn kho) |
| POST | `/api/cart/sync` | Đồng bộ toàn bộ giỏ từ frontend |
| DELETE | `/api/cart/:product_id?session_id=` | Xóa 1 dòng giỏ |
| POST | `/api/orders` | Tạo đơn + `order_items`, trừ tồn kho (transaction ở chế độ MySQL), xóa giỏ |
| GET | `/api/orders?user_id=` | Đơn của 1 user |
| GET | `/api/admin/orders` | Cần `Authorization: Bearer <token>` của tài khoản `role=admin` |

## Còn thiếu / chưa xong

- **Hash mật khẩu mẫu chưa phải hash thật**: `password_hash` trong
  `camping.sql` vẫn là placeholder `$2y$10$PLACEHOLDER…`. Login tài khoản
  mẫu (`admin@camping.vn` / `user@camping.vn`) tạm chấp nhận mật khẩu
  demo `123456` và trả về `demo: true` (xem `src/auth.js`). Luồng khác
  tạo hash bcrypt thật thì login tự dùng bcrypt, không cần sửa code.
  Tài khoản đăng ký mới qua API đã được hash bcrypt thật.
- **JWT còn đơn giản**: token lưu ở `localStorage` phía frontend, chưa có
  refresh token / httpOnly cookie / đăng xuất phía server.
- **Chưa có**: đổi trạng thái đơn (admin), CRUD sản phẩm cho admin,
  phân trang, giới hạn tốc độ (rate limit), kiểm tra quyền sở hữu giỏ/đơn
  của user thường (hiện `GET /api/orders?user_id=` chưa kiểm tra token).

## Cấu trúc

```
server/
  server.js        Express app + toàn bộ route
  src/db.js        Pool MySQL + phát hiện chế độ fallback
  src/store.js     Kho dữ liệu trong bộ nhớ (chế độ fallback)
  src/seed.js      Dữ liệu mẫu sao chép từ camping.sql
  src/auth.js      bcrypt + JWT + middleware requireAuth/requireAdmin
  src/utils.js     Tìm kiếm không dấu, lọc/sắp xếp sản phẩm
  .env.example     Mẫu cấu hình
```
