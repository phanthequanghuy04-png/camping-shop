// Lucian UX/UI Prompt #066 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#066
import { useEffect, useRef, useState, type CSSProperties } from 'react'

/**
 * SocialSignInButtons — Nút đăng nhập mạng xã hội (#066 Lucian).
 *
 * Gốc: bấm 1 provider thì các nút khác gập lại lần lượt (stagger 40ms),
 * nút được chọn hiện spinner "đang kết nối" (1.5s, 300ms nếu giảm chuyển
 * động), rồi thành hàng tài khoản đã kết nối + nút "Dùng cách khác" để mở
 * lại. Giữ nguyên choreography đó: thời gian, easing, spinner .7s linear.
 *
 * Khác với gốc (bản demo giả lập kết nối thành công):
 * - Provider Kakao (Hàn Quốc) đổi thành Facebook cho shop Việt Nam.
 * - Shop chưa có OAuth thật (cần đăng ký app Google/Meta + client ID +
 *   luồng server) nên sau spinner sẽ báo rõ là chưa thiết lập, rồi mở lại
 *   các nút khác — KHÔNG giả vờ đăng nhập thành công bằng tài khoản không
 *   có thật. Người dùng đăng nhập bằng form email bên dưới như trước.
 * - Không có thẻ ngoài 340x420 của bản demo: component nằm trong thẻ trắng
 *   của trang Đăng nhập/Đăng ký (thẻ này trắng cố định cả 2 theme) nên
 *   chữ/viền trung tính dùng màu sáng cố định; nút "Tiếp tục bằng email"
 *   của gốc không cần vì form email nằm ngay bên dưới; nút "Dùng cách
 *   khác" đặt trong luồng thay vì absolute như gốc.
 */

type ProviderId = 'google' | 'facebook' | 'apple'

interface Provider {
  id: ProviderId
  label: string
  bg: string
  fg: string
  border: string
  icon: React.ReactNode
}

const PROVIDERS: Provider[] = [
  {
    id: 'google',
    label: 'Google',
    bg: '#ffffff',
    fg: '#1f1f1f',
    border: 'inset 0 0 0 1.5px #dadce0',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"
          fill="#4285F4"
        />
        <path
          d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"
          fill="#34A853"
        />
        <path
          d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.6z"
          fill="#FBBC05"
        />
        <path
          d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    bg: '#166fe0', // xanh Facebook đậm hơn #1877f2 một chút để chữ trắng đạt 4,7:1 (gốc 4,23:1)
    fg: '#ffffff',
    border: 'none',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: 'apple',
    label: 'Apple',
    bg: '#000000',
    fg: '#ffffff',
    border: 'none',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5a4.3 4.3 0 0 0-3.4-1.8c-1.4-.1-2.8.9-3.5.9s-1.9-.9-3.1-.8a4.6 4.6 0 0 0-3.9 2.4c-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.4 2.9 2.4s1.6-.8 3-.8 1.8.8 3 .7 2-1.1 2.8-2.3a9.6 9.6 0 0 0 1.3-2.6c-.1 0-2.3-.9-2.3-4.1zM14.1 5.8a3.9 3.9 0 0 0 .9-2.8 4 4 0 0 0-2.6 1.4 3.7 3.7 0 0 0-.9 2.7 3.3 3.3 0 0 0 2.6-1.3z"
          fill="currentColor"
        />
      </svg>
    ),
  },
]

export default function SocialSignInButtons({
  mode = 'login',
}: {
  mode?: 'login' | 'register'
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const [phase, setPhase] = useState<'idle' | 'connecting' | 'result'>('idle')
  const [message, setMessage] = useState('')
  const timerRef = useRef<number | null>(null)
  const busyRef = useRef(false)

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  const verb = mode === 'register' ? 'Đăng ký' : 'Đăng nhập'

  const pick = (index: number) => {
    if (busyRef.current || phase !== 'idle') return
    busyRef.current = true
    const provider = PROVIDERS[index]
    setPicked(index)
    setPhase('connecting')
    setMessage(`Đang mở ${provider.label}…`)
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    timerRef.current = window.setTimeout(
      () => {
        busyRef.current = false
        setPhase('result')
        setMessage(
          `${verb} bằng ${provider.label} chưa được thiết lập — hãy dùng email bên dưới.`,
        )
      },
      reduced ? 300 : 1500,
    )
  }

  const reset = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    busyRef.current = false
    setPicked(null)
    setPhase('idle')
    setMessage('')
  }

  return (
    <div
      className={`ux u066${picked !== null ? ' is-pick' : ''}${phase === 'result' ? ' is-done' : ''}`}
    >
      <div className="u066-list">
        {PROVIDERS.map((provider, i) => {
          const gone = phase === 'connecting' && picked !== i
          const isBusy = phase === 'connecting' && picked === i
          return (
            <div
              key={provider.id}
              className={`u066-it${gone ? ' gone' : ''}`}
              style={{ '--i': i } as CSSProperties}
            >
              <div>
                <button
                  type="button"
                  className={`u066-b${isBusy ? ' busy' : ''}`}
                  style={
                    {
                      '--bg': provider.bg,
                      '--fg': provider.fg,
                      '--bd': provider.border,
                    } as CSSProperties
                  }
                  aria-busy={isBusy || undefined}
                  tabIndex={gone ? -1 : 0}
                  onClick={() => pick(i)}
                >
                  <span className="u066-ic" aria-hidden="true">
                    {provider.icon}
                  </span>
                  <span className="u066-tx">
                    Tiếp tục với {provider.label}
                  </span>
                  <span className="u066-st" aria-hidden="true">
                    <i />
                    <svg viewBox="0 0 22 22">
                      <path d="M5 11.5l4 4L17 7" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <p className="u066-msg" aria-live="polite">
        {message}
      </p>
      <div className="u066-or">hoặc</div>
      <button
        type="button"
        className="u066-back"
        tabIndex={phase === 'result' ? 0 : -1}
        onClick={reset}
      >
        Dùng cách khác
      </button>
    </div>
  )
}
