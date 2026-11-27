import { useCallback, useEffect, useState } from 'react'

/**
 * ThemeToggle — Nút chuyển Sáng / Tối (việc 6/8, dark mode cơ bản).
 *
 * - Lưu lựa chọn vào localStorage với key `camping-theme` ('light' | 'dark').
 * - Lần đầu (chưa có lựa chọn đã lưu): tôn trọng `prefers-color-scheme`.
 * - Bật/tắt bằng class `.dark` trên <html>; mọi biến màu dark nằm trong
 *   `.dark` ở src/index.css (nền #121A14, surface #1B2A20, chữ #F5F0E1).
 * - Icon SVG mặt trời / mặt trăng (design system: không dùng emoji).
 * - Nút 44×44px, có aria-label + aria-pressed, focus-visible theo index.css.
 *
 * Cách gắn (chỉ 2 dòng, xem DESIGN-SYSTEM.md §9 — KHÔNG sửa file khác ở đây
 * vì luồng khác đang sửa App.tsx):
 *   1. Trong App.tsx, import:  import ThemeToggle from './components/ThemeToggle'
 *   2. Trong Header(), đặt cạnh nút giỏ hàng:  <ThemeToggle />
 *      (Header nền xanh đậm nên icon kế thừa màu kem #F5F0E1 — đúng cả 2 theme.)
 *   Muốn dùng ngoài Header: truyền className để đổi màu icon, vd
 *   <ThemeToggle className="text-foreground hover:bg-muted" />.
 */

const STORAGE_KEY = 'camping-theme'

type Theme = 'light' | 'dark'

function resolveInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    const initial = resolveInitialTheme()
    document.documentElement.classList.toggle('dark', initial === 'dark')
    setTheme(initial)
  }, [])

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', next === 'dark')
      window.localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-pressed={isDark}
      title={isDark ? 'Giao diện sáng' : 'Giao diện tối'}
      className={`inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-[12px] transition-colors hover:bg-white/10 ${className}`}
    >
      {isDark ? (
        /* Mặt trời — đang ở dark, bấm để về sáng */
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        /* Mặt trăng — đang ở sáng, bấm để sang tối */
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
