# Design System — Website Bán Đồ Cắm Trại (Camping Shop)

> File staging — Bước 4a. Chỉ để tham khảo và tích hợp sau, không sửa app trực tiếp.
> Nguồn: tra cứu thật bằng UI UX Pro Max (`python3 ~/workspace/custom-skills/ui-ux-pro-max/scripts/search.py`).

---

## 1. Style đã chọn

### Organic Biophilic — Phong cách Hữu cơ, Gần gũi Thiên nhiên

| Truy vấn | Kết quả đứng đầu | Quyết định |
|---|---|---|
| `outdoor camping e-commerce store, earthy forest style` `--domain style` | **organic-biophilic** (Organic Biophilic) — 3 kết quả | ✅ **CHỌN làm style chính** |
| `camping shop landing page` `--design-system` | Vibrant & Block-based (xanh dương `#2563EB` + tím + hồng `#EC4899`, font Russo One / Chakra Petch) | ❌ **LOẠI** — bảng màu rực rỡ, gaming/esports, không hợp shop ngoài trời đất/rừng. Chỉ giữ lại **pattern Hero + Testimonials + CTA** của nó (bằng chứng xã hội trước CTA) |
| `outdoor gear store product card e-commerce` `--domain style` | 3d-product-preview (xem 360°, AR) | ⏳ **Để dành** — gợi ý nâng cao sau này (xem lều/balo 3D), không làm style chính vì chi phí cao, độ phức tạp High |

**Vì sao chọn Organic Biophilic:**

- Từ khóa khớp đúng brief: *nature, organic shapes, green, sustainable, rounded, earthy, natural textures*.
- Bảng màu gốc đã là đất/rừng: xanh rừng `#228B22`, nâu đất `#8B4513`, xanh trời `#87CEEB`, be `#F5F5DC`.
- Bo góc 16–24px + bóng mềm tự nhiên → cảm giác thân thiện, "đi rừng" chứ không công nghiệp.
- Chi phí thấp, độ phức tạp Low, hỗ trợ cả Light/Dark mode, framework `tailwind|css`.
- Best for: *eco products, sustainability brands* — đúng tệp khách cắm trại, yêu thiên nhiên.
- Yêu cầu accessibility của style: tương phản chữ 4.5:1, bàn phím, focus rõ, tôn trọng `prefers-reduced-motion`.

**Điều chỉnh so với bản gốc:** màu xanh `#228B22` và terracotta `#C67B5C` gốc hơi nhạt, chữ trắng trên đó khó đạt tương phản 4.5:1 nên đã làm đậm lại (xanh `#2D6A4F`, terracotta `#C05621`). ⚠️ Đã đo lại bằng công cụ kiểm tra tương phản ngày 2026-11-27 (việc 6/8, script `_staging/contrast-check.py`): `#C05621` làm chữ trên nền kem chỉ đạt **4.24:1** nên làm đậm thêm cùng tông → **`#A8431A`** (5.59:1 trên kem, 6.03:1 trên trắng). Xem bảng đầy đủ ở §9.

---

## 2. Bảng màu

### 2.1. Màu chính — Rừng (Forest Green)

| Vai trò | Tên | Hex | Dùng cho |
|---|---|---|---|
| Primary | Xanh rừng | `#2D6A4F` | Nút chính, link, icon, giá |
| Primary Dark | Xanh rừng đậm | `#1B4332` | Header, footer, tiêu đề lớn |
| Primary Light | Xanh lá nhạt | `#74C69D` | Badge, hover nhẹ |
| Primary Soft | Nền xanh nhạt | `#D8F3DC` | Highlight, chip danh mục |
| On Primary | Trắng | `#FFFFFF` | Chữ trên nền xanh rừng |

### 2.2. Màu phụ — Đất (Earth Brown)

| Vai trò | Tên | Hex | Dùng cho |
|---|---|---|---|
| Secondary | Nâu đất | `#8B4513` | Viền nhấn, giá cũ (gạch ngang), chi tiết trang trí |
| Secondary Dark | Nâu đất đậm | `#5C2E0E` | Chữ nhấn trên nền kem |
| Secondary Light | Nâu nhạt | `#C68A4B` | Divider ấm, icon phụ |

### 2.3. Màu CTA — Đất nung (Terracotta)

Lấy từ style **nature-distilled** (kết quả thứ 2 của truy vấn 1: terracotta `#C67B5C`, sand, warm clay). Dùng **riêng** cho hành động mua để nổi bật trên nền xanh rừng.

| Vai trò | Tên | Hex | Dùng cho |
|---|---|---|---|
| Accent / CTA | Đất nung | `#A8431A` | **"Mua ngay", "Thêm vào giỏ"** — đo WCAG 2026-11-27: trên kem 5.59:1, trên trắng 6.03:1, chữ trắng trên nền 6.03:1 (đều ≥ 4.5:1). Màu cũ `#C05621` chỉ đạt 4.24:1 khi làm chữ trên kem nên đã làm đậm cùng tông |
| Accent Hover | Đất nung đậm | `#83361A` | CTA khi hover — trắng trên nền 8.37:1. Màu cũ `#9C4221` quá gần accent mới nên cũng làm đậm để hover nhìn rõ |
| Accent Soft | Nền cam nhạt | `#FDEEDE` | Badge khuyến mãi, "Giảm 20%" (chữ `#A8431A` trên nền này 5.30:1) |
| On Accent | Trắng | `#FFFFFF` | Chữ trên nút CTA |

> ⚠️ Quy tắc: **chỉ CTA mua hàng mới dùng terracotta**. Nút phụ (xem chi tiết, bộ lọc) dùng xanh rừng hoặc viền nâu đất — tránh "loạn CTA".

### 2.4. Màu nền & chữ

| Vai trò | Tên | Hex | Dùng cho |
|---|---|---|---|
| Background | Kem ấm | `#FAF6EC` | Nền trang (gốc: beige `#F5F5DC`) |
| Surface | Trắng | `#FFFFFF` | Card, modal, header |
| Muted | Kem xám | `#EFE9D8` | Section xen kẽ, skeleton |
| Border | Viền be | `#DDD5BD` | Viền card, input, divider |
| Foreground | Chữ chính | `#1C2B1F` | Tiêu đề, nội dung (xanh-đen rừng) |
| Muted Foreground | Chữ phụ | `#5A6B5A` | Mô tả, meta, placeholder — đo WCAG 2026-11-27: trên kem 5.28:1, trên trắng 5.70:1, đã đạt ≥ 4.5:1 nên **giữ nguyên, không làm đậm thêm** |
| On Dark | Chữ trên nền tối | `#F5F0E1` | Chữ trên header/footer xanh đậm |
| Sky (hiếm) | Xanh trời | `#87CEEB` | Chỉ điểm nhấn nhỏ: icon thời tiết, badge "Mới" |

### 2.5. Màu trạng thái

| Vai trò | Hex | Dùng cho |
|---|---|---|
| Success | `#2D6A4F` | Còn hàng, đặt hàng thành công |
| Warning | `#B45309` | Sắp hết hàng, lưu ý |
| Destructive | `#B91C1C` | Hết hàng, xóa khỏi giỏ, lỗi |
| Ring (focus) | `#2D6A4F` | Viền focus bàn phím — luôn hiển thị rõ |

---

## 3. Font chữ (Google Fonts — đều hỗ trợ tiếng Việt)

| Vai trò | Font | Weight | Dùng cho |
|---|---|---|---|
| Tiêu đề | **Be Vietnam Pro** | 700, 800 | H1, H2, tên sản phẩm, giá lớn |
| Thân bài | **Inter** | 400, 500, 600 | Mô tả, nội dung, nút, form |

**Vì sao chọn cặp này:** Be Vietnam Pro được thiết kế riêng cho tiếng Việt (dấu thanh chuẩn, không vỡ chữ); Inter gọn, dễ đọc cho đoạn dài và cũng có subset tiếng Việt. Cả hai đều có trên Google Fonts, miễn phí.

```css
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@700;800&family=Inter:wght@400;500;600&display=swap');
```

**Thang cỡ chữ:**

| Cấp | Cỡ | Line-height | Ví dụ |
|---|---|---|---|
| Display (H1 hero) | 40px mobile → 56px desktop | 1.2 | "Cắm trại giữa rừng xanh" |
| H1 | 32px | 1.2 | Tiêu đề trang |
| H2 | 24px | 1.25 | Tiêu đề section |
| H3 | 20px | 1.3 | Tên danh mục |
| Body | 16px | 1.6 | Mô tả sản phẩm |
| Small | 14px | 1.5 | Meta, ghi chú, giá cũ |

---

## 4. Khoảng cách, bo góc, bóng đổ

- **Hệ khoảng cách:** bội số 4px/8px — `4, 8, 12, 16, 24, 32, 48, 64, 96px`.
- **Section:** cách nhau 48px (mobile) → 64px (desktop). Container tối đa `1200px`, padding ngang 16px (mobile) → 24px (desktop).
- **Bo góc (theo Organic Biophilic: 16–24px):**
  - Badge/chip: `8px`
  - Nút, input: `12px`
  - Product card: `20px`
  - Hero, section lớn: `24px`
  - Nút CTA dạng viên nang (tùy chọn): `999px`
  - Bo góc lệch tạo cảm giác hữu cơ: `24px 16px 28px 18px` (dùng sparingly cho ảnh hero)
- **Bóng đổ — mềm, tự nhiên:**
  - Nhỏ: `0 1px 3px rgba(27, 67, 50, 0.08)`
  - Vừa: `0 4px 12px rgba(27, 67, 50, 0.1)`
  - Lớn: `0 8px 32px rgba(27, 67, 50, 0.12)`
  - Card khi hover: `0 12px 32px rgba(27, 67, 50, 0.16)` + nâng lên `translateY(-4px)`
- **Chuyển động:** 150ms (nhanh) / 250ms (chuẩn) / 400ms (chậm), kiểu `ease-out`. Tôn trọng `prefers-reduced-motion` (tắt animation khi người dùng yêu cầu).

---

## 5. Responsive — Mobile-first

Thiết kế từ mobile trước, mở rộng dần. Breakpoints: `640px` (sm), `768px` (md), `1024px` (lg), `1280px` (xl).

| Thành phần | Mobile (< 640px) | Tablet (768px) | Desktop (≥ 1024px) |
|---|---|---|---|
| Lưới sản phẩm | 1 cột | 2 cột | 3–4 cột |
| Hero | Ảnh trên, chữ dưới; H1 40px; CTA full-width | 2 cột | H1 56px, CTA inline |
| Header | Logo + burger menu + giỏ hàng | Menu ngang rút gọn | Menu ngang đầy đủ |
| Section gap | 48px | 56px | 64px |
| Container padding | 16px | 20px | 24px |

**Quy tắc kiểm tra:** phải xem tốt ở `375px, 768px, 1024px, 1440px` (checklist của UI UX Pro Max). Nút bấm trên mobile tối thiểu `44×44px`. Ảnh sản phẩm dùng tỉ lệ `4:3`, lazy-load.

---

## 6. Ví dụ áp dụng cho từng thành phần

### 6.1. Header

- Nền: xanh rừng đậm `#1B4332`, chữ kem `#F5F0E1`.
- Logo: Be Vietnam Pro 800, màu kem, kèm icon lều/cây SVG (không dùng emoji).
- Menu: Inter 500, 16px; mục active gạch dưới terracotta `#A8431A`.
- Icon giỏ hàng: badge số lượng nền terracotta `#A8431A`, chữ trắng.
- Sticky trên mobile, có bóng `shadow-md` khi cuộn.

### 6.2. Hero

- Nền: kem `#FAF6EC` + ảnh rừng/lều lớn, bo góc `24px` (hoặc bo lệch hữu cơ).
- H1: Be Vietnam Pro 800, 40px mobile / 56px desktop, màu `#1B4332`.
- Subtext: Inter 400, 16–18px, màu `#5A6B5A`, tối đa 2 dòng.
- CTA chính: nền terracotta `#A8431A`, chữ trắng, bo `999px`, padding `12px 24px`; hover `#83361A`.
- CTA phụ: viền nâu đất `#8B4513`, chữ `#5C2E0E`, nền trong suốt.
- Theo pattern Hero + Testimonials + CTA: dưới hero đặt 3–4 đánh giá thật (ảnh, tên, vai trò) rồi mới tới CTA mua lớn.

### 6.3. Product Card

- Nền trắng `#FFFFFF`, viền `#DDD5BD`, bo `20px`, bóng `shadow-sm`; hover: bóng lớn + nâng 4px.
- Ảnh: tỉ lệ `4:3`, bo trên `20px`, badge "Mới" (xanh trời) / "Giảm 20%" (nền `#FDEEDE`, chữ `#A8431A`) ở góc trái.
- Tên sản phẩm: Be Vietnam Pro 700, 18px, màu `#1C2B1F`.
- Giá: Be Vietnam Pro 700, 20px, màu xanh rừng `#2D6A4F`; giá cũ Inter 400, 14px, màu `#5A6B5A`, gạch ngang.
- Nút "Thêm vào giỏ": nền xanh rừng `#2D6A4F`, chữ trắng, bo `12px`, full-width trong card.
- Đánh giá sao: màu nâu đất/vàng ấm `#C68A4B`, kèm số lượng đánh giá màu chữ phụ.

### 6.4. Nút (Buttons)

| Loại | Nền | Chữ | Bo góc | Dùng cho |
|---|---|---|---|---|
| CTA mua hàng | `#A8431A` | Trắng | `999px` | Mua ngay, Thêm vào giỏ (hero) |
| Chính | `#2D6A4F` | Trắng | `12px` | Thêm vào giỏ (card), Gửi form |
| Phụ / viền | Trong suốt, viền `#8B4513` | `#5C2E0E` | `12px` | Xem chi tiết, bộ lọc |
| Nguy hiểm | `#B91C1C` | Trắng | `12px` | Xóa khỏi giỏ |
| Disabled | `#EFE9D8` | `#5A6B5A` | `12px` | Hết hàng |

- Hover: đổi màu đậm hơn + transition 250ms. Focus: viền `2px` màu `#2D6A4F` rõ ràng.
- Tất cả nút có `cursor: pointer`.

---

## 7. Hướng dẫn áp dụng (cho agent tích hợp)

1. Copy file `_staging/design-tokens.css` vào app (file CSS global / theme), hoặc map từng biến sang Tailwind config (`colors.primary`, `colors.accent`, `fontFamily.display/body`, `borderRadius`).
2. Thêm Google Fonts import (mục 3) vào `<head>` hoặc CSS global.
3. Áp dụng theo thứ tự: **Header → Hero → Product Card → Nút → Footer** (footer dùng lại màu header).
4. Kiểm tra trước khi giao:
   - [ ] Không dùng emoji làm icon (dùng SVG: Heroicons/Lucide)
   - [ ] `cursor: pointer` trên mọi phần tử bấm được
   - [x] Tương phản chữ ≥ 4.5:1 — đã đo thật 2026-11-27, xem §9 (accent cũ `#C05621` đã sửa thành `#A8431A`; chữ trắng trên `#A8431A` 6.03:1, trên `#2D6A4F` 6.39:1)
   - [ ] Focus bàn phím nhìn thấy rõ
   - [ ] Tôn trọng `prefers-reduced-motion`
   - [ ] Responsive tốt ở 375px, 768px, 1024px, 1440px
   - [ ] CTA terracotta chỉ dùng cho hành động mua
5. Dark mode: đã làm cơ bản (việc 6/8, 2026-11-27) — xem §9: biến `.dark` trong `app/src/index.css` + component `app/src/components/ThemeToggle.tsx` (chưa gắn vào Header, xem hướng dẫn §9.3).

---

## 8. File liên quan

- Tokens CSS: `_staging/design-tokens.css` (cùng thư mục dự án)
- Style gốc UI UX Pro Max: `organic-biophilic` — xem chi tiết bằng `search.py "organic biophilic" --domain style` nếu cần.
- Style tham khảo phụ: `nature-distilled` (terracotta/sand), `3d-product-preview` (xem 3D, giai đoạn sau).

---

## 9. Tương phản WCAG & Dark mode (việc 6/8 — 2026-11-27)

Script đo: `_staging/contrast-check.py` (Python, công thức relative luminance WCAG 2.1). Chạy lại: `python3 _staging/contrast-check.py`. Ngưỡng: ≥ 4.5:1 chữ thường, ≥ 3:1 chữ lớn / thành phần UI.

### 9.1. Bảng tương phản trước → sau

| Cặp màu | Trước | Sau | Kết luận |
|---|---|---|---|
| Xanh rừng `#2D6A4F` trên trắng | 6.39:1 | 6.39:1 (giữ nguyên) | ✅ Đạt |
| Xanh rừng `#2D6A4F` trên kem `#FAF6EC` | 5.92:1 | 5.92:1 (giữ nguyên) | ✅ Đạt |
| Đất nung trên trắng | `#C05621` 4.57:1 | `#A8431A` **6.03:1** | ✅ Đạt (cũ sát ngưỡng) |
| Đất nung trên kem `#FAF6EC` | `#C05621` **4.24:1** | `#A8431A` **5.59:1** | ✅ Đạt sau khi sửa — **cặp duy nhất rớt ở light mode** |
| Trắng trên xanh rừng `#2D6A4F` (nút) | 6.39:1 | 6.39:1 (giữ nguyên) | ✅ Đạt |
| Trắng trên đất nung (nút CTA) | `#C05621` 4.57:1 | `#A8431A` **6.03:1** | ✅ Đạt, biên an toàn lớn hơn |
| Trắng trên hover CTA | `#9C4221` 6.53:1 | `#83361A` **8.37:1** | ✅ Đạt |
| Chữ chính `#1C2B1F` trên kem / trắng | 13.75:1 / 14.84:1 | giữ nguyên | ✅ Đạt |
| Chữ phụ `#5A6B5A` trên kem / trắng | 5.28:1 / 5.70:1 | giữ nguyên | ✅ Đạt — **không cần làm đậm** dù dự kiến ban đầu là chưa đạt |
| Chữ kem `#F5F0E1` trên xanh đậm `#1B4332` (header/footer) | 9.72:1 | giữ nguyên | ✅ Đạt |
| Nâu đất `#8B4513` trên kem / trắng trên `#8B4513` | 6.58:1 / 7.10:1 | giữ nguyên | ✅ Đạt |
| Đất nung `#C05621` trên nền tối `#121A14` | 3.88:1 | — (không dùng làm chữ ở dark; dùng `#E8834A` 6.57:1) | ⚠️ Chỉ đạt chữ lớn/UI |

**Màu đã sửa (chỉ 2 màu, cùng tông, không đổi hẳn sang màu khác):**

| Token | Cũ | Mới | Lý do |
|---|---|---|---|
| `--color-accent` | `#C05621` | `#A8431A` | Làm chữ trên nền kem chỉ 4.24:1 (< 4.5) |
| `--color-accent-hover` | `#9C4221` | `#83361A` | Màu hover cũ quá gần accent mới, hover không nhìn rõ |

Đồng bộ ở 3 chỗ: `_staging/design-tokens.css`, `app/src/index.css` (CSS variables + `@theme inline`), bảng màu §2.3/§6 ở trên. Chưa sửa `products.ts` và không đụng `_old-shopping`.

**Lưu ý chưa xử lý hết:** nhiều file pages/components đang hardcode hex (`text-[#5A6B5A]`, `bg-[#C05621]`, `hover:bg-[#9C4221]`…) thay vì dùng token — các chỗ đó vẫn giữ màu cũ nhưng đều đã đạt tương phản (trắng trên `#C05621` 4.57:1, trắng trên `#9C4221` 6.53:1), chỉ **không đồng bộ màu mới và không tự đổi theo dark mode**. Luồng sở hữu các file đó nên map sang token (`text-muted-foreground`, `bg-accent`, `hover:bg-accent-hover`…) để nhận màu mới + dark mode.

### 9.2. Dark mode cơ bản — đã làm

Bật bằng class `.dark` trên `<html>`. Biến trong `.dark` ở `app/src/index.css` (đồng bộ `_staging/design-tokens.css`):

| Token | Dark | Tương phản đo được |
|---|---|---|
| `--color-background` | `#121A14` | — |
| `--color-surface` | `#1B2A20` | — |
| `--color-muted` / `--color-border` | `#223528` / `#2E4436` | — |
| `--color-foreground` | `#F5F0E1` | 15.57:1 trên nền, 13.18:1 trên surface |
| `--color-muted-foreground` | `#A8B8A8` | 8.52:1 trên nền, 7.21:1 trên surface |
| `--color-primary-text` (mới) | `#74C69D` | 8.71:1 trên nền |
| `--color-accent-text` (mới) | `#E8834A` | 6.57:1 trên nền, 5.56:1 trên surface |
| `--color-secondary` / `--color-secondary-dark` | `#C68A4B` / `#D8AC72` | 6.03:1 / 8.50:1 |
| `--color-warning` / `--color-destructive` | `#F0A832` / `#F87171` | 8.75:1 / 6.41:1 |
| `--color-ring` | `#74C69D` | focus rõ trên nền tối |

**Nguyên tắc quan trọng:** nút giữ nguyên màu nền light (`#2D6A4F`, `#A8431A`) vì chữ trắng trên đó vẫn đạt 6.39:1 / 6.03:1 trên mọi nền; chỉ **chữ/link** mới dùng biến thể sáng (`--color-primary-text`, `--color-accent-text`), vì màu gốc làm chữ trên nền tối sẽ rớt (`#2D6A4F` trên `#121A14` chỉ 2.78:1, `#C05621` cũ 3.88:1). Link `a` trong `index.css` đã đổi sang `var(--color-primary-text)` theo nguyên tắc này. Hai biến mới đã map trong `@theme inline` nên dùng được dạng `text-primary-text`, `text-accent-text` trong Tailwind.

### 9.3. Gắn ThemeToggle vào Header (2 dòng — dành cho luồng đang sửa App.tsx)

File sẵn: `app/src/components/ThemeToggle.tsx` — nút 44×44px, icon SVG mặt trời/mặt trăng, `aria-pressed`, lưu `localStorage` key `camping-theme`, lần đầu tôn trọng `prefers-color-scheme`. **Chưa gắn vào App.tsx** (tránh xung đột với luồng khác đang sửa file này).

```tsx
// App.tsx — thêm 1 dòng import (cùng nhóm import components):
import ThemeToggle from './components/ThemeToggle'

// App.tsx — trong Header(), đặt cạnh nút giỏ hàng (trong <div className="flex items-center gap-3">):
<ThemeToggle />
```

Header nền xanh đậm `#1B4332` ở cả 2 theme nên icon của nút kế thừa màu kem `#F5F0E1` — đúng cả sáng lẫn tối. Muốn dùng ngoài Header thì truyền `className`, vd `<ThemeToggle className="text-foreground hover:bg-muted" />`.

**Còn thiếu / việc tiếp theo:**

- [ ] Gắn `<ThemeToggle />` vào Header theo §9.3 (2 dòng) + build lại để kiểm chứng.
- [ ] Map các hex hardcode trong pages/components sang token (xem §9.1) để dark mode phủ toàn app — hiện tại dark mode chỉ đổi các chỗ dùng `var(--color-*)` (`.card`, `.btn-*`, `.site-header`, `body`, link…); các class `bg-white`, `text-[#5A6B5A]`, `bg-[#C05621]`… trong `HomePage`, `ShopPage`, `ProductDetailPage`, `ProductCard` vẫn giữ màu sáng khi bật dark.
- [ ] Ảnh hero (`Hero3D`/ảnh nền) và iframe `public/landscape.html` chưa có bản dark — giữ nguyên, không vỡ layout.
- [ ] Lần đầu tải trang có thể nháy sáng rồi mới sang tối (theme áp dụng trong `useEffect`); nếu muốn hết nháy, thêm inline script đọc `localStorage` trong `<head>` của `index.html` (luồng sở hữu file đó làm).
- [ ] Chưa kiểm tra bằng mắt trên trình duyệt (máy này không mở GUI); nên xem thử ở 375px / 768px / 1024px sau khi gắn toggle.
