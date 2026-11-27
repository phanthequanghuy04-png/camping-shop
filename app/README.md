# Web Starter — Khung dự án web của Huy

Khung nền Vite + React + TypeScript, để sau này cắm thêm các công cụ đã chuẩn bị cho dự án web.

## Công nghệ nền

- Vite 8.4.0
- React 19.3.1 + React DOM 19.3.1
- TypeScript 7.0.2
- Node 24.22.1, npm 10.9.4 (đã kiểm tra trên máy Muse)

## Cách chạy

```bash
cd ~/workspace/projects/web-starter
npm install   # chỉ cần chạy 1 lần đầu, hoặc sau khi thêm thư viện mới
npm run dev   # chạy dev server, mặc định http://localhost:5173
npm run build # build production, kết quả ra thư mục dist/
npm run preview # xem thử bản build
```

## Cắm thêm công cụ sau này

- **threeui** — ở `~/workspace/projects/threeui`: thư viện UI cho React + Three.js. Khi dùng, cài / import theo hướng dẫn trong README của repo đó, rồi tạo component 3D trong `src/`.
- **UI UX Pro Max (skill v2.15.0)** — ở `~/workspace/projects/ui-ux-pro-max-skill`, skill ở `~/workspace/custom-skills/ui-ux-pro-max`, CLI `uipro`. Dùng để chọn phong cách, màu, font và design system trước khi code giao diện. Khi bắt đầu dự án thật, chạy trong thư mục này: `uipro init --ai universal`. Hướng dẫn tiếng Việt: `~/workspace/projects/ui-ux-pro-max-skill/HUONG-DAN.md`.
- **Web Tools Kit** — ở `~/workspace/projects/web-tools-kit`: 12 thư viện npm đã cài sẵn (Lenis, Anime.js, Barba.js, Three.js, Floating UI, AOS, Luxon, SweetAlert2, GSAP, Babylon.js, A-Frame, PlayCanvas) + hướng dẫn cho Framer, Webflow, Spline (nền tảng web). Khi cần thư viện nào, cài từ kit đó vào dự án này, ví dụ: `npm install three gsap aos` (xem phiên bản và cách import trong `HUONG-DAN.md` của kit).

## Cấu trúc

- `src/App.tsx` — điểm bắt đầu, sửa file này để làm trang đầu tiên.
- `src/main.tsx` — điểm vào của app.
- `index.html` — tiêu đề trang, sửa `<title>` tại đây.
- `public/` — ảnh / file tĩnh.

## Lưu ý

- Đây chỉ là khung nền tối thiểu, chưa cài đè thư viện nào trong web-tools-kit.
- Chưa chọn router, CSS framework hay state management — thêm sau khi Huy quyết định.
