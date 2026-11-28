/* Lucian UX/UI Prompt #423 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#423
   Plan switch — thích ứng cho shop cắm trại (Huy yêu cầu 2026-11-28:
   thay cụm tile 2×2 ở hero bằng Plan switch #423).
   Gốc: công tắc Tháng/Năm trên thẻ gói Pro — gạt sang Năm thì nút trượt,
   giá lăn như đồng hồ odometer, huy hiệu "2 months free" nảy vào.
   Bản shop: công tắc "Mua lẻ / Mua combo" trên thẻ gói nổi bật —
   gạt sang Combo thì giá lăn từ 2.890.000₫ lên 4.780.000₫, huy hiệu
   "Đủ bộ · 4 món" nảy vào. Giá và món đều lấy thật từ products.ts
   (lều Cloud Up 2 + Combo 2 ngày 1 đêm Đà Lạt), không ghi cứng tổng.
   Nút "Thêm vào giỏ" thêm thật vào giỏ (cần đăng nhập, như HomeCombos);
   ngăn giỏ KHÔNG tự mở (Huy yêu cầu 2026-11-28), chỉ hiện toast. */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProductById } from '../data/products'
import { dispatchAddToCart } from './ProductCard'
import { showToast } from '../lib/toast'
import { requireLogin } from '../lib/requireLogin'

const SINGLE_ID = 1 // Lều trại 2 người Naturehike Cloud Up 2
const COMBO_IDS = [1, 8, 9, 13] as const // Combo 2 ngày 1 đêm (Đà Lạt)

/** "2.890.000 ₫" — dấu chấm + ₫ là ký tự tĩnh, chữ số lăn odometer. */
function fmt(v: number): string {
  return `${v.toLocaleString('vi-VN')} ₫`
}

export default function PlanSwitch() {
  const navigate = useNavigate()
  const [combo, setCombo] = useState(false)
  const numRef = useRef<HTMLSpanElement>(null)
  const srRef = useRef<HTMLSpanElement>(null)

  const tent = getProductById(SINGLE_ID)
  const comboItems = COMBO_IDS.map((id) => getProductById(id)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  )
  const singlePrice = tent?.price ?? 0
  const comboPrice = comboItems.reduce((sum, p) => sum + p.price, 0)

  // Odometer: 1 cột/chữ số (dải 0–9 trượt dọc), ký tự khác là <i> tĩnh.
  // Cả 2 giá đều 7 chữ số nên cùng 1 bộ cột; nếu lệch thì hiện số thường.
  const singleDigits = String(singlePrice)
  const comboDigits = String(comboPrice)
  const odometerOk = singleDigits.length === comboDigits.length

  useEffect(() => {
    const num = numRef.current
    if (!num || !odometerOk) return
    // Dựng cột 1 lần từ giá lẻ (như bản gốc).
    num.innerHTML = ''
    const cols: HTMLElement[] = []
    let k = 0
    fmt(singlePrice)
      .split('')
      .forEach((ch) => {
        if (!/\d/.test(ch)) {
          const i = document.createElement('i')
          i.textContent = ch
          num.appendChild(i)
          return
        }
        const c = document.createElement('span')
        c.className = 'u423-col'
        c.innerHTML = `<span>${'0123456789'
          .split('')
          .map((d) => `<b>${d}</b>`)
          .join('')}</span>`
        ;(c.firstChild as HTMLElement).style.setProperty('--k', String(k++))
        num.appendChild(c)
        cols.push(c.firstChild as HTMLElement)
      })
    // Đặt số đầu không hiệu ứng rồi bật lại (như bản gốc).
    cols.forEach((c) => {
      c.style.transition = 'none'
    })
    const show = (v: number) => {
      String(v)
        .split('')
        .forEach((d, i) => {
          cols[i]?.style.setProperty('--d', d)
        })
      if (srRef.current)
        srRef.current.textContent = `${v.toLocaleString('vi-VN')} đồng`
    }
    show(singlePrice)
    void num.offsetWidth
    cols.forEach((c) => {
      c.style.transition = ''
    })
    // Ghi hàm show lên ref để nút gạt dùng (tránh dựng lại cột).
    ;(num as unknown as { __show: (v: number) => void }).__show = show
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [odometerOk])

  // Gạt công tắc: lăn giá tới giá của phía mới.
  useEffect(() => {
    const num = numRef.current
    if (!num || !odometerOk) return
    const show = (num as unknown as { __show?: (v: number) => void }).__show
    if (show) show(combo ? comboPrice : singlePrice)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combo])

  function setMode(next: boolean, focus = false) {
    if (next === combo) return
    setCombo(next)
    if (focus) {
      const btn = document.querySelector<HTMLElement>(
        `.u423-opt[data-mode="${next ? 'combo' : 'single'}"]`,
      )
      btn?.focus({ preventScroll: true })
    }
  }

  function handleAdd() {
    if (!requireLogin(navigate, 'thêm vào giỏ hàng')) return
    if (combo) {
      comboItems.forEach((p) => dispatchAddToCart(p.id, 1))
      showToast(`Đã thêm Combo 2 ngày 1 đêm (${comboItems.length} món) vào giỏ.`)
    } else if (tent) {
      dispatchAddToCart(tent.id, 1)
      showToast('Đã thêm Lều trại 2 người vào giỏ.')
    }
  }

  const features = combo
    ? ['Lều Cloud Up 2', 'Túi ngủ LW180', 'Bếp Fire-Maple', 'Đèn lồng LED']
    : ['Siêu nhẹ, chống mưa tốt', 'Dựng nhanh trong 5 phút', 'Bán chạy nhất · ★ 4.8']

  const price = combo ? comboPrice : singlePrice

  return (
    <div className={`ux u423${combo ? ' is-y' : ''}`}>
      <div className="u423-seg" role="radiogroup" aria-label="Cách mua">
        <span className="u423-th" aria-hidden="true" />
        <button
          className="u423-opt"
          type="button"
          role="radio"
          data-mode="single"
          aria-checked={!combo}
          tabIndex={combo ? -1 : 0}
          onClick={() => setMode(false)}
          onKeyDown={(e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
              e.preventDefault()
              setMode(!combo, true)
            }
          }}
        >
          Mua lẻ
        </button>
        <button
          className="u423-opt"
          type="button"
          role="radio"
          data-mode="combo"
          aria-checked={combo}
          tabIndex={combo ? 0 : -1}
          onClick={() => setMode(true)}
          onKeyDown={(e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
              e.preventDefault()
              setMode(!combo, true)
            }
          }}
        >
          Mua combo
        </button>
      </div>

      <div className="u423-card">
        <div className="u423-hd">
          <b>{combo ? 'Combo Đà Lạt' : 'Lều 2 người'}</b>
          <span className="u423-bd">Đủ bộ · 4 món</span>
        </div>
        <div className="u423-pr">
          {odometerOk ? (
            <span className="u423-num" aria-hidden="true" ref={numRef} />
          ) : (
            <span className="u423-num" aria-hidden="true">
              <i>{fmt(price)}</i>
            </span>
          )}
          <span className="u423-per">{combo ? '/bộ' : '/lều'}</span>
          <span className="u423-sr" aria-live="polite" ref={srRef}>
            {price.toLocaleString('vi-VN')} đồng
          </span>
        </div>
        <div className="u423-sub">
          <span>Chỉ lấy lều 2 người</span>
          <span>2 ngày 1 đêm · 2 người · đủ bộ 4 món</span>
        </div>
        <ul className="u423-ls" key={combo ? 'combo' : 'single'}>
          {features.map((f) => (
            <li key={f}>
              <svg viewBox="0 0 14 14" aria-hidden="true">
                <path d="m3.2 7.4 2.5 2.5 5.1-5.6" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
        <button className="u423-go" type="button" onClick={handleAdd}>
          Thêm vào giỏ
        </button>
      </div>
    </div>
  )
}
