/* Lucian UX/UI Prompt #449 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#449
   Pagination (Menus & Tabs) — port sang React cho Camping Shop.
   DROP-IN cho vị trí hiển thị phân trang (danh sách sản phẩm, đơn hàng...):
   copy file này vào app/src/components/Pagination.tsx, nối _staging/u449.css
   vào app/src/components/lucian.css (khối "#449 — Pagination").
   Cần tokens --ux-* + base .ux trong lucian.css (đã có sẵn).

   ADAPTATIONS (so với bản gốc 449.txt — ghi lại đầy đủ):
   1. Bỏ khung demo .u449 340x300 của bản gốc: component chỉ là thanh nav,
      trang dùng sẽ tự căn giữa. Giữ class .u449 trên vỏ (position: relative)
      để vùng live region neo đúng vị trí + luật focus-visible có phạm vi.
   2. Tổng số trang <= 7: bản gốc giả định TOTAL >= 7 (hàm win() sẽ trùng số
      và hiện dấu "…" sai). Shop hiện: 1..totalPages, không dấu chấm; các ô
      thừa (tới đủ 7) là ô trống ẩn (class .u449-n.is-empty) để thanh không
      đổi rộng khi tổng số trang thay đổi.
   3. totalPages/currentPage là props (bản gốc hardcode TOTAL = 20, cur = 1);
      currentPage được kẹp trong 1..totalPages để hiển thị.
   4. Nhãn tiếng Việt: nav "Phân trang", nút số "Trang N", mũi tên
      "Trang trước" / "Trang sau", vùng live đọc "Trang N".
   5. Logic giữ nguyên y hệt bản gốc: hàm cửa sổ win() 7 ô; pill trượt
      translateX = vị-trí-ô * 34px với transition lò xo .55s; squash
      (scale 1.22 / 0.9 ở 35%) kích hoạt lại mỗi lần đổi trang bằng cách gỡ
      rồi gắn lại class .is-sq sau 1 lần reflow (dùng ref, KHÔNG remount
      pill để transition trượt --x không bị mất); số lăn ra/vào bằng 2 span
      (is-in / is-out, is-back khi đi ngược), span cũ dọn sau ~320ms;
      mũi tên mờ (opacity .3) + disabled ở 2 đầu.
   6. Squash effect dùng ref so sánh trang trước (StrictMode-safe) thay vì
      cờ "chạy lần đầu" — tránh nảy pill khi mount trong StrictMode.
   7. Key của span: span hiện tại giữ key ổn định, span lăn ra giữ key của
      span hiện tại trước đó — đúng vòng đời DOM của bản gốc (span cũ đổi
      thành is-out rồi bị gỡ sau 320ms; span mới mount mới nên animation
      lăn vào luôn chạy lại, kể cả khi đổi trang liên tiếp).
*/

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

export interface PaginationProps {
  /** Tổng số trang (>= 1). */
  totalPages: number
  /** Trang hiện tại (1-based). */
  currentPage: number
  /** Gọi khi người dùng chọn trang khác. */
  onPageChange: (page: number) => void
}

/** Giá trị 1 ô: số trang, '' = dấu "…", null = ô trống giữ chỗ (totalPages < 7). */
type SlotValue = number | '' | null

interface SlotView {
  value: SlotValue
  /** Số cũ đang lăn ra (null = không có animation đang chạy). */
  outValue: number | '' | null
  /** Key của span đang lăn ra (= key span hiện tại trước khi đổi). */
  outKey: number
  /** Key của span đang hiển thị. */
  curKey: number
  /** Đã từng lăn ít nhất 1 lần (span hiện tại giữ class is-in sau khi dọn). */
  animated: boolean
}

const SLOT_COUNT = 7
const SLOT_STEP_PX = 34
const ROLL_CLEANUP_MS = 320

/** Cửa sổ 7 ô của bản gốc: đầu [1..5,'',T], cuối [1,'',T-4..T], giữa [1,'',c-1,c,c+1,'',T]. */
function getWindow(page: number, total: number): SlotValue[] {
  if (total <= SLOT_COUNT) {
    const win: SlotValue[] = []
    for (let n = 1; n <= SLOT_COUNT; n++) win.push(n <= total ? n : null)
    return win
  }
  if (page <= 4) return [1, 2, 3, 4, 5, '', total]
  if (page >= total - 3) return [1, '', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '', page - 1, page, page + 1, '', total]
}

function slotLabel(value: number | '' | null): string {
  if (value === null) return ''
  return value === '' ? '…' : String(value)
}

export default function Pagination({ totalPages, currentPage, onPageChange }: PaginationProps) {
  const total = Math.max(1, totalPages)
  const page = Math.min(Math.max(1, currentPage), total)

  const [slots, setSlots] = useState<SlotView[]>(() =>
    getWindow(page, total).map((v, k) => ({
      value: v,
      outValue: null,
      outKey: -1,
      curKey: k,
      animated: false,
    })),
  )
  const [back, setBack] = useState(false)
  const slotsRef = useRef(slots)
  const prevPageRef = useRef(page)
  const prevSquashPageRef = useRef(page)
  const seqRef = useRef(SLOT_COUNT)
  const timersRef = useRef<number[]>([])
  const pillRef = useRef<HTMLSpanElement>(null)

  // Đồng bộ các ô khi trang / tổng số trang đổi (không animation lúc mount:
  // cửa sổ khởi tạo đã bằng cửa sổ của trang đầu, effect early-return).
  useEffect(() => {
    const prevPage = prevPageRef.current
    const isBack = page < prevPage
    prevPageRef.current = page
    setBack(isBack)
    const nextWin = getWindow(page, total)
    const prev = slotsRef.current
    const next = nextWin.map((v, k) => {
      const old = prev[k]
      if (old.value === v) return old
      return {
        value: v,
        outValue: old.value,
        outKey: old.curKey,
        curKey: ++seqRef.current,
        animated: true,
      }
    })
    if (next.every((s, k) => s === prev[k])) return
    slotsRef.current = next
    setSlots(next)
    timersRef.current.forEach((t) => window.clearTimeout(t))
    timersRef.current = [
      window.setTimeout(() => {
        const cleared = slotsRef.current.map((s) =>
          s.outValue === null ? s : { ...s, outValue: null },
        )
        slotsRef.current = cleared
        setSlots(cleared)
      }, ROLL_CLEANUP_MS),
    ]
  }, [page, total])

  // Dọn timer khi unmount.
  useEffect(
    () => () => {
      timersRef.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  // Nảy pill (squash) mỗi lần đổi trang: gỡ class rồi gắn lại sau 1 lần
  // reflow, y hệt bản gốc. Không remount pill để transition trượt --x vẫn chạy.
  useEffect(() => {
    if (prevSquashPageRef.current === page) return
    prevSquashPageRef.current = page
    const pill = pillRef.current
    if (!pill) return
    pill.classList.remove('is-sq')
    void pill.offsetWidth
    pill.classList.add('is-sq')
  }, [page])

  const go = (n: number) => {
    const next = Math.min(Math.max(1, n), total)
    if (next === page) return
    onPageChange(next)
  }

  const slotIndex = slots.findIndex((s) => s.value === page)

  return (
    <div className="ux u449">
      <nav className="u449-nav" aria-label="Phân trang">
        <button
          type="button"
          className="u449-ar u449-pv"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M10 3.5 5.5 8l4.5 4.5" />
          </svg>
        </button>
        <div className="u449-sl">
          <span
            ref={pillRef}
            className="u449-pill"
            aria-hidden="true"
            style={{ '--x': `${Math.max(0, slotIndex) * SLOT_STEP_PX}px` } as CSSProperties}
          />
          {slots.map((slot, k) => {
            const isDots = slot.value === ''
            const isEmpty = slot.value === null
            const isCurrent = slot.value === page
            return (
              <button
                key={k}
                type="button"
                className={`u449-n${isDots ? ' is-dots' : ''}${isEmpty ? ' is-empty' : ''}${back ? ' is-back' : ''}`}
                aria-label={typeof slot.value === 'number' ? `Trang ${slot.value}` : undefined}
                aria-hidden={isDots || isEmpty ? true : undefined}
                tabIndex={isDots || isEmpty ? -1 : 0}
                aria-current={isCurrent ? 'page' : undefined}
                disabled={isEmpty}
                onClick={() => {
                  if (typeof slot.value === 'number') go(slot.value)
                }}
              >
                {slot.outValue !== null && (
                  <span key={slot.outKey} className="is-out" aria-hidden="true">
                    {slotLabel(slot.outValue)}
                  </span>
                )}
                <span key={slot.curKey} className={slot.animated ? 'is-in' : undefined}>
                  {slotLabel(slot.value)}
                </span>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          className="u449-ar u449-nx"
          aria-label="Trang sau"
          disabled={page >= total}
          onClick={() => go(page + 1)}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M6 3.5 10.5 8 6 12.5" />
          </svg>
        </button>
      </nav>
      <p className="u449-live" role="status">
        Trang {page}
      </p>
    </div>
  )
}
