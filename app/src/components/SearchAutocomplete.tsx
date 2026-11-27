// Lucian UX/UI Prompt #429 — Search autocomplete (MIT License (c) 2026 Seokwoooo).
// Port sang React cho Camping Shop: https://lucianlabs.dev/uxui-prompt/#429
// Gõ vào ô tìm kiếm: gợi ý hiện ra, chữ khớp được bôi đậm; ↑↓ để di chuyển
// (viên pill lò xo trượt theo), Enter để chọn, Esc để đóng, ⌘K/Ctrl K để
// focus vào ô tìm kiếm.
// Khác bản gốc: gợi ý là sản phẩm thật của shop (ảnh + tên + giá) thay cho
// tài liệu mẫu; chọn gợi ý thì mở trang chi tiết sản phẩm; phím tắt bắt ở
// cấp cửa sổ; tìm không dấu (gõ "leu" vẫn khớp "Lều trại").
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import { formatPrice, resolveImage } from '../data/products'
import type { Category, Product } from '../data/types'
import { normalizeSearch } from '../lib/api'

export type SearchAutocompleteProps = {
  value: string
  onChange: (value: string) => void
  products: Product[]
  categories: Category[]
  onSelect: (product: Product) => void
  placeholder?: string
  className?: string
}

/** Chuẩn hóa không dấu + bản đồ vị trí để bôi đậm đúng chỗ trên tên gốc. */
function normalizeWithMap(text: string): { text: string; map: number[] } {
  let out = ''
  const map: number[] = []
  for (let i = 0; i < text.length; i += 1) {
    const norm = text[i]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
    for (const c of norm) {
      out += c
      map.push(i)
    }
  }
  return { text: out, map }
}

function HighlightedName({ name, needle }: { name: string; needle: string }) {
  const { text, map } = useMemo(() => normalizeWithMap(name), [name])
  const at = needle ? text.indexOf(needle) : -1
  if (at < 0) return <>{name}</>
  const start = map[at]
  const end = map[Math.min(at + needle.length - 1, map.length - 1)] + 1
  return (
    <>
      {name.slice(0, start)}
      <mark>{name.slice(start, end)}</mark>
      {name.slice(end)}
    </>
  )
}

export default function SearchAutocomplete({
  value,
  onChange,
  products,
  categories,
  onSelect,
  placeholder = 'Tìm lều, túi ngủ, bếp, đèn...',
  className = '',
}: SearchAutocompleteProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pillRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [act, setAct] = useState(-1)
  const [liveText, setLiveText] = useState('')
  const [kbdLabel, setKbdLabel] = useState('Ctrl K')
  const listboxId = useRef(
    `u429-lb-${Math.random().toString(36).slice(2, 8)}`,
  ).current
  const jumpRef = useRef(false)

  const categoryName = useMemo(() => {
    const map = new Map<number, string>()
    categories.forEach((c) => map.set(c.id, c.name))
    return map
  }, [categories])

  const needle = normalizeSearch(value.trim())

  const list = useMemo(() => {
    if (!needle) return []
    const scored = products
      .map((p) => {
        const nameNorm = normalizeSearch(p.name)
        const catNorm = normalizeSearch(
          categoryName.get(p.id_category ?? -1) ?? '',
        )
        const inName = nameNorm.indexOf(needle)
        const inCat = catNorm.indexOf(needle)
        if (inName < 0 && inCat < 0) return null
        return { product: p, startsWith: inName === 0 ? 0 : 1 }
      })
      .filter((x): x is { product: Product; startsWith: number } => x !== null)
      .sort((a, b) => a.startsWith - b.startsWith)
      .slice(0, 4)
      .map((x) => x.product)
    return scored
  }, [needle, products, categoryName])

  // Gõ chữ: mở danh sách, chọn gợi ý đầu tiên.
  useEffect(() => {
    if (!needle) {
      setOpen(false)
      setAct(-1)
      setLiveText('')
      return
    }
    jumpRef.current = !open
    setOpen(true)
    setAct(list.length ? 0 : -1)
    setLiveText(
      list.length ? `${list.length} kết quả` : 'Không tìm thấy sản phẩm',
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needle, list.length])

  // Đặt vị trí viên pill theo gợi ý đang chọn (như bản gốc).
  useLayoutEffect(() => {
    const pill = pillRef.current
    if (!pill) return
    if (jumpRef.current) {
      pill.style.transition = 'none'
      jumpRef.current = false
    }
    pill.style.setProperty('--py', `${Math.max(0, act) * 40}px`)
    pill.style.setProperty('--po', act >= 0 ? '1' : '0')
    if (pill.style.transition === 'none') {
      void pill.offsetWidth
      pill.style.transition = ''
    }
  }, [act, open, list])

  // Phím tắt ⌘K / Ctrl K focus vào ô tìm kiếm (bản gốc chỉ bắt trong khung).
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        inputRef.current?.focus({ preventScroll: true })
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const mac = /Mac|iPhone|iPad/.test(
      navigator.platform || navigator.userAgent || '',
    )
    setKbdLabel(mac ? '⌘K' : 'Ctrl K')
  }, [])

  const choose = (index: number) => {
    const product = list[index]
    if (!product) return
    setOpen(false)
    setAct(-1)
    setLiveText(product.name)
    onSelect(product)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && list.length) {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        setAct(0)
        return
      }
      setAct(
        (prev) =>
          (prev + (e.key === 'ArrowDown' ? 1 : -1) + list.length) %
          list.length,
      )
    } else if (e.key === 'Enter' && open && act >= 0) {
      e.preventDefault()
      choose(act)
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div
      ref={rootRef}
      className={`ux u429${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}
      onBlur={(e) => {
        if (e.relatedTarget && !rootRef.current?.contains(e.relatedTarget)) {
          setOpen(false)
        }
      }}
    >
      <div className="u429-w">
        <label className="u429-f">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m20 20-4.2-4.2" />
          </svg>
          <input
            ref={inputRef}
            className="u429-in"
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={
              open && act >= 0 ? `${listboxId}-${act}` : undefined
            }
            aria-label="Tìm kiếm sản phẩm"
            placeholder={placeholder}
            value={value}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => onChange(e.target.value)}
            onClick={() => {
              if (!open && value.trim()) setOpen(true)
            }}
            onKeyDown={onKeyDown}
          />
          <kbd className="u429-kb" aria-hidden="true">
            {kbdLabel}
          </kbd>
        </label>
        <div
          className="u429-dd"
          onMouseDown={(e) => e.preventDefault()}
        >
          <i className="u429-pill" ref={pillRef} aria-hidden="true" />
          <div
            className="u429-lb"
            role="listbox"
            id={listboxId}
            ref={listRef}
          >
            {list.length ? (
              list.map((product, i) => (
                <div
                  key={product.id}
                  className="u429-o"
                  role="option"
                  id={`${listboxId}-${i}`}
                  aria-selected={i === act}
                  style={{ '--i': i } as CSSProperties}
                  onMouseEnter={() => {
                    if (i !== act) setAct(i)
                  }}
                  onClick={() => choose(i)}
                >
                  <span className="u429-ic" aria-hidden="true">
                    {product.image ? (
                      <img
                        src={resolveImage(product.image)}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <svg viewBox="0 0 24 24">
                        <path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5z" />
                        <path d="M3 8.5l9 5.5 9-5.5M12 14v7" />
                      </svg>
                    )}
                  </span>
                  <span className="u429-t">
                    <HighlightedName name={product.name} needle={needle} />
                  </span>
                  <span className="u429-m">{formatPrice(product.price)}</span>
                  <span className="u429-en" aria-hidden="true">
                    ↵
                  </span>
                </div>
              ))
            ) : needle ? (
              <div className="u429-no">Không tìm thấy sản phẩm</div>
            ) : null}
          </div>
        </div>
      </div>
      <p className="u429-live" role="status">
        {liveText}
      </p>
    </div>
  )
}
