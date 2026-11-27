// Lucian UX/UI Prompt #413 — Product dropdown (Navigation)
// MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#413
// Port sang React cho shop cắm trại (2026-11-28): nút "Sản phẩm" trên
// header, bấm/trỏ vào thì menu 8 danh mục thật bật ra từ nút.
// Xem CSS: .u413 trong app/src/components/lucian.css.
//
// Đã điều chỉnh so với bản gốc (ghi rõ lý do):
// - Gốc là khung demo cố định 340×300, nút absolute giữa khung, panel
//   top:66px. Bản này: root relative inline-flex theo nút thật, panel
//   top: calc(100% + 8px) — vẫn giữ nguyên mọi số đo còn lại (nút cao
//   36px, panel rộng 272px, item cao 52px, bo, bóng, easing, stagger).
// - Gốc có 4 mục mẫu (Docs/Projects/Automations/Insights). Bản này có
//   8 danh mục thật của shop (tên + số sản phẩm), icon vẽ tay theo
//   đúng phong cách nét mảnh của gốc, màu chip xoay vòng 4 màu gốc.
// - Gốc chặn click của item (link '#'). Bản này item là Link thật tới
//   /shop?category=id, bấm thì đóng menu và chuyển trang.
// - Màu chip: gốc dùng light-dark() inline; bản này dùng luật .dark
//   trong lucian.css theo đúng quy ước token của shop.
import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Category } from '../data/types'

// Icon nét mảnh (viewBox 18×18, stroke 1.6) vẽ theo phong cách gốc,
// một icon cho mỗi danh mục (id theo CATEGORIES trong data/products).
const CATEGORY_ICONS: Record<number, React.ReactNode> = {
  // 1 Lều trại — lều chữ A + cửa
  1: (
    <>
      <path d="M2.5 15 9 3l6.5 12z" />
      <path d="M9 9.5V15" />
    </>
  ),
  // 2 Túi ngủ — túi hình trụ + khóa kéo
  2: (
    <>
      <rect x="5.5" y="2.5" width="7" height="13" rx="3.5" />
      <path d="M9 5.5v7" />
    </>
  ),
  // 3 Bếp & dụng cụ nấu — nồi + nắp
  3: (
    <>
      <path d="M4 7h10v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M2.5 7h13" />
      <path d="M7 4.5h4" />
    </>
  ),
  // 4 Đèn & pin — đèn lồng + dây tóc
  4: (
    <>
      <rect x="6" y="7" width="6" height="8" rx="1.5" />
      <path d="M7.5 7V5.5a1.5 1.5 0 0 1 3 0V7" />
      <path d="M9 10v2.5" />
    </>
  ),
  // 5 Ba lô — balo + quai + túi trước
  5: (
    <>
      <rect x="4.5" y="5" width="9" height="10" rx="3" />
      <path d="M7 5V3.5a2 2 0 0 1 4 0V5" />
      <path d="M6.5 10.5h5" />
    </>
  ),
  // 6 Bàn ghế cắm trại — ghế gấp
  6: (
    <>
      <path d="M4.5 2.5v6h9v-6" />
      <path d="M4.5 8.5 3 15M13.5 8.5 15 15" />
      <path d="M6 11.5h6" />
    </>
  ),
  // 7 Quần áo & giày — áo khoác + khóa kéo
  7: (
    <>
      <path d="M6.5 3 3 5.5 4.5 9l1.5-.8V15h6V8.2L13.5 9 15 5.5 11.5 3a2 2 0 0 1-5 0z" />
      <path d="M9 5.5V15" />
    </>
  ),
  // 8 Phụ kiện — la bàn
  8: (
    <>
      <circle cx="9" cy="9" r="6.5" />
      <path d="M9 5.5 10.5 9 9 12.5 7.5 9z" />
    </>
  ),
}

const CHIP_CLASSES = ['u413-c1', 'u413-c2', 'u413-c3', 'u413-c4'] as const

export default function ProductDropdown({
  categories,
  counts,
}: {
  categories: Category[]
  counts: Map<number, number>
}) {
  const [open, setOpen] = useState(false)
  const [cur, setCur] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLSpanElement>(null)
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const timers = useRef<{ open: number | null; close: number | null }>({
    open: null,
    close: null,
  })
  const hoverAt = useRef(0)
  const panelId = useId()

  const clearTimers = () => {
    if (timers.current.open !== null) {
      window.clearTimeout(timers.current.open)
      timers.current.open = null
    }
    if (timers.current.close !== null) {
      window.clearTimeout(timers.current.close)
      timers.current.close = null
    }
  }

  useEffect(() => clearTimers, [])

  const setOpenState = (v: boolean, backToTrigger = false) => {
    clearTimers()
    setOpen((prev) => {
      if (v === prev) return prev
      return v
    })
    if (!v) {
      setCur(-1)
      if (backToTrigger) triggerRef.current?.focus({ preventScroll: true })
    }
  }

  // Đánh dấu mục đang trỏ/chọn + trượt vệt highlight theo mục đó.
  const mark = (i: number, focus = false) => {
    setCur(i)
    const item = itemRefs.current[i]
    if (i >= 0 && item && highlightRef.current) {
      highlightRef.current.style.setProperty(
        '--hy',
        `${item.offsetTop + 6}px`,
      )
    }
    if (focus) item?.focus({ preventScroll: true })
  }

  // Hover-intent như bản gốc: trỏ vào thì mở sau 120ms, rời khỏi thì
  // đóng sau 240ms (chỉ áp dụng cho chuột).
  const enter = () => {
    clearTimers()
    if (!open) {
      timers.current.open = window.setTimeout(() => {
        hoverAt.current = Date.now()
        setOpenState(true)
      }, 120)
    }
  }
  const leave = () => {
    clearTimers()
    if (open) {
      timers.current.close = window.setTimeout(() => setOpenState(false), 240)
    }
  }

  // Bấm ra ngoài thì đóng (capture, như bản gốc).
  useEffect(() => {
    if (!open) return
    const outside = (e: PointerEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(e.target as Node)
      ) {
        setOpenState(false)
      }
    }
    document.addEventListener('pointerdown', outside, true)
    return () => document.removeEventListener('pointerdown', outside, true)
  }, [open ])

  return (
    <div
      ref={rootRef}
      className={`u413${open ? ' is-open' : ''}`}
      onFocusCapture={(e) => {
        // Focus rời khỏi cả cụm thì đóng (như focusout của bản gốc).
        if (
          open &&
          e.relatedTarget &&
          rootRef.current &&
          !rootRef.current.contains(e.relatedTarget as Node)
        ) {
          setOpenState(false)
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="u413-tr"
        aria-expanded={open}
        aria-controls={panelId}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') enter()
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') leave()
        }}
        onClick={() => {
          // Vừa mở bằng hover thì bỏ qua cú bấm ngay sau đó (bản gốc
          // chặn bấm trong 500ms sau khi mở bằng hover).
          if (open && Date.now() - hoverAt.current < 500) return
          setOpenState(!open)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            setOpenState(true)
            mark(e.key === 'ArrowDown' ? 0 : categories.length - 1, true)
          } else if (e.key === 'Escape' && open) {
            e.preventDefault()
            e.stopPropagation()
            setOpenState(false, true)
          }
        }}
      >
        Sản phẩm
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 4.8 6 7.8l3-3" />
        </svg>
      </button>
      <div
        ref={panelRef}
        id={panelId}
        className={`u413-pn${cur >= 0 ? ' is-hl' : ''}`}
        role="region"
        aria-label="Danh mục sản phẩm"
        inert={!open}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') enter()
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') leave()
          mark(-1)
        }}
        onKeyDown={(e) => {
          const n = categories.length
          const i =
            cur < 0
              ? itemRefs.current.indexOf(
                  document.activeElement as HTMLAnchorElement,
                )
              : cur
          if (e.key === 'Escape') {
            e.preventDefault()
            e.stopPropagation()
            setOpenState(false, true)
            return
          }
          const to =
            e.key === 'ArrowDown'
              ? i + 1
              : e.key === 'ArrowUp'
                ? i - 1
                : e.key === 'Home'
                  ? 0
                  : e.key === 'End'
                    ? n - 1
                    : null
          if (to === null) return
          e.preventDefault()
          mark((to + n) % n, true)
        }}
      >
        <span className="u413-hl" aria-hidden="true" ref={highlightRef} />
        <ul className="u413-ls">
          {categories.map((category, i) => (
            <li key={category.id}>
              <Link
                ref={(el) => {
                  itemRefs.current[i] = el
                }}
                to={`/shop?category=${category.id}`}
                className={`u413-it${cur === i ? ' is-on' : ''}`}
                style={{ '--i': i } as React.CSSProperties}
                onPointerEnter={() => mark(i)}
                onClick={() => setOpenState(false)}
              >
                <span
                  className={`u413-ic ${CHIP_CLASSES[i % CHIP_CLASSES.length]}`}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 18 18">
                    {CATEGORY_ICONS[category.id]}
                  </svg>
                </span>
                <span>
                  <b>{category.name}</b>
                  <small>{counts.get(category.id) ?? 0} sản phẩm</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
