// Lucian UX/UI Prompt #219 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#219
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * ThemeToggle — Nút chuyển Sáng / Tối với hiệu ứng mở tròn (#219 Lucian).
 *
 * - Lưu lựa chọn vào localStorage với key `camping-theme` ('light' | 'dark').
 * - Lần đầu (chưa có lựa chọn đã lưu): tôn trọng `prefers-color-scheme`.
 * - Bật/tắt bằng class `.dark` trên <html>; mọi biến màu dark nằm trong
 *   `.dark` ở src/index.css (nền #121A14, surface #1B2A20, chữ #F5F0E1).
 * - Icon SVG mặt trời / mặt trăng (design system: không dùng emoji).
 * - Nút 44×44px, có aria-label + aria-pressed, focus-visible theo index.css.
 *
 * Port #219 "Circular-reveal dark mode" (Navigation):
 * - Gốc: 2 lớp sáng/tối chồng nhau, lớp tối mở ra bằng clip-path
 *   circle(0px tại tâm nút) -> circle(520px) trong .7s
 *   cubic-bezier(.65,0,.35,1); icon xoay -90deg trong .6s
 *   cubic-bezier(.3,1.4,.5,1). Trên web thật không nhân đôi được toàn bộ
 *   DOM nên dùng View Transitions API — đúng hiệu ứng gốc: ảnh chụp mới
 *   của trang mở ra từ tâm nút bấm theo cùng thời gian/easing.
 * - Không hỗ trợ View Transitions, hoặc bật prefers-reduced-motion
 *   (gốc cũng tắt transition khi reduce motion): đổi theme ngay, không
 *   hiệu ứng.
 * - Nút giữ kích thước/vị trí của shop (44px trong header); chỉ hiệu ứng
 *   mở tròn + icon xoay là của #219.
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

type ViewTransition = { ready: Promise<void> }
type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const initial = resolveInitialTheme()
    document.documentElement.classList.toggle('dark', initial === 'dark')
    setTheme(initial)
  }, [])

  // Đổi theme thật: class .dark trên <html> + lưu lựa chọn + class is-dark
  // trên nút (cho icon xoay). Chạy đồng bộ để View Transition chụp đúng
  // trạng thái mới, kể cả icon trên nút.
  const flip = useCallback((next: Theme) => {
    document.documentElement.classList.toggle('dark', next === 'dark')
    window.localStorage.setItem(STORAGE_KEY, next)
    buttonRef.current?.classList.toggle('is-dark', next === 'dark')
    setTheme(next)
  }, [])

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const button = buttonRef.current
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const doc = document as DocumentWithViewTransition
    if (!button || reduceMotion || typeof doc.startViewTransition !== 'function') {
      flip(next)
      return
    }
    // Tâm vòng tròn = tâm nút bấm (#219: --cx/--cy lấy từ vị trí nút);
    // bán kính đủ phủ kín màn hình từ điểm đó.
    const rect = button.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )
    const transition = doc.startViewTransition(() => flip(next))
    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 700, // #219: .7s
          easing: 'cubic-bezier(.65,0,.35,1)', // #219
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
  }, [theme, flip])

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={toggle}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-pressed={isDark}
      title={isDark ? 'Giao diện sáng' : 'Giao diện tối'}
      className={`u219-tg inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-[12px] transition-colors hover:bg-white/10 ${isDark ? 'is-dark' : ''} ${className}`}
    >
      {/* Cả 2 icon xếp chồng trong 1 ô grid (#219: sun + moon cùng
          grid-area 1/1); lớp sáng hiện mặt trời, lớp tối hiện mặt trăng,
          cả cụm xoay -90deg khi sang tối. */}
      <span className="u219-ic" aria-hidden="true">
        <svg
          className="u219-sun"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <svg
          className="u219-moon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  )
}
