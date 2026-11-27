import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LandscapeScene } from '@designcodeio/threeui/components/LandscapeScene'
import '@designcodeio/threeui/style.css'

// NOTE (2026-11-27): import sâu (deep import) thay vì barrel '@designcodeio/threeui'.
// Barrel lib-dist/index.js import tĩnh toàn bộ shader (Gallery, TempleNightScene,
// SkeuomorphicToggle/glassToggleScene) dùng API three cũ đã bị xóa từ r152
// (sRGBEncoding/LinearEncoding) nên Vite báo 6 cảnh báo [IMPORT_IS_UNDEFINED]
// dù app chỉ dùng LandscapeScene (chỉ là iframe, không dùng three). Deep import
// được package exports map hỗ trợ ('./components/*') nên không kéo các shader kia vào build.

/**
 * Hero3D — Hero trang Home với cảnh 3D hoàng hôn (ThreeUI v1.2.0).
 *
 * Component chính: `LandscapeScene` (đã xác minh có thật trong threeui v1.2.0).
 * KHÔNG dùng `AtTheHorizon` — tên này chỉ có trong README ví dụ, không tồn tại
 * trong source bản Community v1.2.0, import sẽ lỗi build.
 *
 * ⚠️ BƯỚC TÍCH HỢP BẮT BUỘC (agent tích hợp thực hiện, KHÔNG làm ở đây):
 *   1. Cài package trong thư mục app:
 *        npm install @designcodeio/threeui   (phiên bản 1.2.0)
 *   2. Copy file runtime của cảnh 3D vào public/ (LandscapeScene nhúng file
 *      này qua <iframe src="/landscape.html" sandbox="allow-scripts">):
 *        cp node_modules/@designcodeio/threeui/lib-dist/assets/landscape.html public/landscape.html
 *      File ~2,4 MB, tự chứa runtime Three.js r149, không cần copy thêm asset nào.
 *      Kiểm tra sau khi copy: mở http://localhost:PORT/landscape.html trực tiếp,
 *      phải thấy cảnh núi chạy được rồi mới kiểm tra hero.
 *   3. Nếu quên copy landscape.html, iframe sẽ trống nền — class `.hero` trong
 *      index.css đã có lớp lót (gradient tối + ảnh Unsplash) phía dưới iframe
 *      nên hero không lộ nền trắng.
 *
 * Fallback tĩnh: KHÔNG cần file public/hero-fallback.jpg — component dùng trực
 * tiếp URL ảnh Unsplash hoàng hôn cắm trại (xem HERO_FALLBACK_IMAGE_URL).
 * Ảnh này cũng là lớp lót của `.hero` trong index.css để 2 nhánh 3D/tĩnh
 * không bị "nhảy" giao diện.
 */

// Ảnh hoàng hôn cắm trại (Unsplash, dùng trực tiếp — không cần tải về public/).
const HERO_FALLBACK_IMAGE_URL =
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1920&auto=format&fit=crop'

/**
 * Kiểm tra WebGL trước khi render cảnh 3D.
 * LandscapeScene không có fallback tích hợp (iframe chỉ có trạng thái
 * loading/ready, không báo lỗi WebGL) nên hero phải tự kiểm tra và tự đổi
 * sang ảnh tĩnh. Xem _staging/hero-3d.md §6.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

export default function Hero3D() {
  // Ép về ảnh tĩnh khi: WebGL không chạy, hoặc người dùng bật
  // prefers-reduced-motion (design system yêu cầu tôn trọng cài đặt này).
  const [webglOK] = useState(() => {
    if (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false
    }
    return isWebGLAvailable()
  })

  return (
    <section className="hero" aria-label="Giới thiệu Camping Shop">
      {webglOK ? (
        <LandscapeScene variant="sunset" className="hero__scene" />
      ) : (
        <div
          className="hero__scene hero__scene--static"
          role="img"
          aria-label="Hoàng hôn trên núi — cắm trại dưới bầu trời sao"
          style={{ backgroundImage: `url(${HERO_FALLBACK_IMAGE_URL})` }}
        />
      )}

      <div className="hero__content">
        <p className="hero__eyebrow">
          Đồ cắm trại — Chuẩn bị cho chuyến đi tiếp theo
        </p>
        <h1>Ra ngoài trời, sống trọn từng khoảnh khắc</h1>
        <p className="hero__sub">
          Lều, bếp, đèn và mọi thứ bạn cần cho một đêm dưới bầu trời sao.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/shop" className="btn-primary">
            Mua sắm ngay
          </Link>
          <Link to="/shop" className="btn-outline btn-outline-light">
            Xem bộ sưu tập
          </Link>
        </div>
      </div>
    </section>
  )
}
