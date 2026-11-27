// Lucian UX/UI Prompt #288 — Expandable product details (MIT License (c) 2026 Seokwoooo).
// Port sang React cho Camping Shop: https://lucianlabs.dev/uxui-prompt/#288
// Khối chi tiết đóng ở 170px, phần dưới mờ dần; bấm "Xem thêm chi tiết" thì
// khối nở mượt tới chiều cao thật (.65s cubic-bezier(.3,.8,.25,1)), fade
// biến mất, nút đổi thành "Thu gọn" + mũi tên xoay 180°; bấm thu gọn thì
// khối co lại và trang cuộn về đầu khối chi tiết.
// Khác bản gốc: gốc là khung điện thoại 300×480 có vùng cuộn riêng (ảnh,
// giá, màu, cỡ, review mẫu) — ở đây chỉ lấy khối chi tiết làm section thật
// trên trang chi tiết sản phẩm, cuộn bằng window.scrollTo; nội dung là dữ
// liệu thật của shop (mô tả, thông số, giao hàng & thanh toán); cỡ chữ
// tăng từ 10.5–13px (khung 300px) lên 14px cho trang thật; nút rộng 100%
// thay vì calc(100% - 28px); tiêu đề section là h2 20px thay cho h4 13px.
// CSS ở _staging/u288.css (chưa append vào lucian.css — do luồng tích hợp làm).
import { useId, useRef, useState } from 'react'
import type { Product } from '../data/types'

/** Chiều cao khi đóng, đúng thông số gốc (170px). */
const SHUT_HEIGHT = 170

export type ProductDetailsProps = {
  product: Product
  categoryName?: string
}

/** Tình trạng kho — cùng logic với ProductDetailPage.tsx. */
function stockText(quantity: number): string {
  if (quantity <= 0) return 'Hết hàng'
  if (quantity <= 5) return `Sắp hết — chỉ còn ${quantity} sản phẩm`
  return `Còn hàng — ${quantity} sản phẩm`
}

export default function ProductDetails({ product, categoryName }: ProductDetailsProps) {
  const [open, setOpen] = useState(false)
  const detailsRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  // useId() trả về dạng ":r0:" — bỏ dấu hai chấm để id dùng được an toàn.
  const detailsId = `u288-${useId().replace(/:/g, '')}`

  const toggle = () => {
    const next = !open
    setOpen(next)
    const details = detailsRef.current
    if (next) {
      // Mở: nở tới chiều cao thật của nội dung (không nhỏ hơn 170px).
      const inner = innerRef.current
      if (details && inner) {
        details.style.height = `${Math.max(inner.offsetHeight, SHUT_HEIGHT)}px`
      }
      return
    }
    // Đóng: co về 170px rồi cuộn trang về đầu khối chi tiết (như gốc
    // cuộn vùng .u288-sc về st.offsetTop - 12 trong 650ms).
    if (details) details.style.height = `${SHUT_HEIGHT}px`
    const heading = headingRef.current
    if (heading) {
      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      const y = heading.getBoundingClientRect().top + window.scrollY - 12
      window.scrollTo({ top: Math.max(0, y), behavior: reducedMotion ? 'auto' : 'smooth' })
    }
  }

  return (
    <section
      className={open ? 'ux u288 is-open' : 'ux u288'}
      aria-labelledby={`${detailsId}-heading`}
    >
      <h2 ref={headingRef} id={`${detailsId}-heading`} className="u288-st">
        Chi tiết sản phẩm
      </h2>
      <div ref={detailsRef} id={detailsId} className="u288-dt">
        <div ref={innerRef} className="u288-in">
          <p className="u288-desc">
            {product.description ?? 'Chưa có mô tả cho sản phẩm này.'}
          </p>

          <div className="u288-bk">
            <h3>Thông số</h3>
            <table className="u288-tb">
              <tbody>
                <tr>
                  <th scope="row">Danh mục</th>
                  <td>{categoryName ?? 'Chưa phân loại'}</td>
                </tr>
                <tr>
                  <th scope="row">Tình trạng</th>
                  <td>{stockText(product.quantity)}</td>
                </tr>
                <tr>
                  <th scope="row">Đánh giá</th>
                  <td>{product.rating.toFixed(1)} / 5</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="u288-bk">
            <h3>Giao hàng &amp; thanh toán</h3>
            <ul className="u288-ship">
              <li>Miễn phí vận chuyển cho đơn từ 500.000₫.</li>
              <li>
                Phí ship 20.000₫ (Hà Nội / TP.HCM) hoặc 30.000₫ (tỉnh khác).
              </li>
              <li>
                Giao 1–2 ngày (Hà Nội / TP.HCM) hoặc 2–4 ngày (tỉnh khác).
              </li>
              <li>Thanh toán khi nhận hàng (COD) hoặc chuyển khoản / VietQR.</li>
            </ul>
            <p className="u288-support">
              Cần hỗ trợ đổi trả? Liên hệ shop qua khung chat hỗ trợ.
            </p>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="u288-mr"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={toggle}
      >
        <span>{open ? 'Thu gọn' : 'Xem thêm chi tiết'}</span>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M2.5 4.5L6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </section>
  )
}
