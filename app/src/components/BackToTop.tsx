// Lucian UX/UI Prompt #450 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#450
// Nút về đầu trang có vòng tiến trình đọc + nút hỗ trợ nở thành panel.
// Bấm về đầu trang: mũi tên bay lên, vòng quay về 0, nút ẩn tạm rồi hiện lại.
// Panel hỗ trợ: câu chào + gợi ý nhanh + ô nhắn tin (trả lời tự động,
// tin nhắn chỉ ở trên trình duyệt này, chưa gửi về server).
import { useEffect, useRef, useState } from 'react'
import { scrollToTop } from '../lib/animations'

interface ChatMessage {
  from: 'shop' | 'me'
  text: string
}

const QUICK_QUESTIONS: Array<{ q: string; a: string }> = [
  {
    q: 'Miễn phí vận chuyển?',
    a: 'Đơn từ 500.000₫ được miễn phí vận chuyển bạn nhé.',
  },
  {
    q: 'Giao hàng bao lâu?',
    a: 'Shop giao trong 1–3 ngày làm việc, tùy khu vực của bạn.',
  },
  {
    q: 'Đổi trả thế nào?',
    a: 'Bạn được đổi trả trong 7 ngày nếu sản phẩm còn nguyên vẹn.',
  },
]

const AUTO_REPLY =
  'Cảm ơn bạn đã nhắn tin! Shop sẽ phản hồi sớm nhất có thể.'

export default function BackToTop() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const [flying, setFlying] = useState(false)
  const [tempHide, setTempHide] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: 'shop', text: 'Chào bạn! Bạn cần tư vấn sản phẩm nào?' },
  ])
  const [input, setInput] = useState('')
  const topRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const openBtnRef = useRef<HTMLButtonElement>(null)
  const msgsRef = useRef<HTMLDivElement>(null)
  const genRef = useRef(0)
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Tiến trình đọc + hiện nút khi đã cuộn quá 400px.
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? window.scrollY / max : 0)
      setVisible(window.scrollY > 400)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Tin nhắn mới thì cuộn panel xuống cuối.
  useEffect(() => {
    const el = msgsRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, chatOpen])

  const later = (fn: () => void, ms: number) => {
    const g = genRef.current
    window.setTimeout(() => {
      if (g === genRef.current) fn()
    }, ms)
  }

  const handleTopClick = () => {
    genRef.current += 1
    setFlying(true)
    scrollToTop()
    later(() => setTempHide(true), reduced ? 300 : 850)
    later(
      () => {
        setTempHide(false)
        setFlying(false)
      },
      reduced ? 1400 : 1950,
    )
  }

  const openChat = () => {
    setChatOpen(true)
    window.setTimeout(
      () => inputRef.current?.focus({ preventScroll: true }),
      reduced ? 0 : 320,
    )
  }

  const closeChat = () => {
    setChatOpen(false)
    openBtnRef.current?.focus({ preventScroll: true })
    later(() => {
      setMessages((prev) => prev.filter((m) => m.from === 'shop'))
      setInput('')
    }, 500)
  }

  const sendMessage = (text: string) => {
    const value = text.trim()
    if (!value) return
    setMessages((prev) => [...prev, { from: 'me', text: value }])
    setInput('')
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { from: 'shop', text: AUTO_REPLY }])
    }, 600)
  }

  const ringProgress = flying || tempHide ? 0 : progress

  return (
    <div className={`ux u450-wrap${chatOpen ? ' is-open' : ''}`}>
      <button
        type="button"
        className={`u450-top${flying ? ' is-fly' : ''}${!visible || tempHide ? ' is-hide' : ''}`}
        aria-label="Về đầu trang"
        onClick={handleTopClick}
        ref={topRef}
        style={
          {
            '--p': ringProgress.toFixed(3),
            '--pd': `${flying ? 700 : 800}ms`,
          } as React.CSSProperties
        }
      >
        <svg className="rg" viewBox="0 0 44 44" aria-hidden="true">
          <circle className="tr" cx="22" cy="22" r="19.5" />
          <circle className="pr" cx="22" cy="22" r="19.5" />
        </svg>
        <svg className="ar" viewBox="0 0 18 18" aria-hidden="true">
          <path d="M9 14.5V4M4.5 8 9 3.5 13.5 8" />
        </svg>
      </button>

      <div className="u450-fab">
        <button
          type="button"
          className="u450-open"
          aria-label="Mở khung hỗ trợ"
          aria-expanded={chatOpen}
          onClick={openChat}
          ref={openBtnRef}
        >
          <svg viewBox="0 0 26 26" aria-hidden="true">
            <path d="M13 3.5c5.8 0 10.5 3.9 10.5 8.8s-4.7 8.8-10.5 8.8c-1.2 0-2.4-.2-3.5-.5L4.6 22.4l1.3-4.3C4 16.5 2.5 14.5 2.5 12.3 2.5 7.4 7.2 3.5 13 3.5z" />
            <circle cx="8.6" cy="12.4" r="1.4" />
            <circle cx="13" cy="12.4" r="1.4" />
            <circle cx="17.4" cy="12.4" r="1.4" />
          </svg>
        </button>
        <div
          className="u450-p"
          role="dialog"
          aria-label="Hỗ trợ"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              closeChat()
            }
          }}
        >
          <div className="u450-hd" style={{ '--i': 0 } as React.CSSProperties}>
            <span className="u450-av" aria-hidden="true">
              <svg viewBox="0 0 20 20">
                <path d="M4 11V9.5a6 6 0 0 1 12 0V11" />
                <rect x="2.6" y="10.2" width="3.4" height="5" rx="1.4" />
                <rect x="14" y="10.2" width="3.4" height="5" rx="1.4" />
                <path d="M15.7 15.2c0 1.6-1.6 2.6-4.2 2.6" />
              </svg>
            </span>
            <div>
              <b>Shop có thể giúp gì?</b>
              <span>Thường trả lời trong 5 phút</span>
            </div>
            <button
              type="button"
              className="u450-x"
              aria-label="Đóng khung hỗ trợ"
              onClick={closeChat}
            >
              <svg viewBox="0 0 14 14" aria-hidden="true">
                <path d="M3 3l8 8M11 3l-8 8" />
              </svg>
            </button>
          </div>
          <div
            className="u450-msgs"
            ref={msgsRef}
            style={{ '--i': 1 } as React.CSSProperties}
          >
            {messages.map((m, i) => (
              <p key={i} className={`u450-bb${m.from === 'me' ? ' is-me' : ''}`}>
                {m.text}
              </p>
            ))}
            <div className="u450-chips">
              {QUICK_QUESTIONS.map((item) => (
                <button
                  key={item.q}
                  type="button"
                  className="u450-chip"
                  onClick={() => {
                    setMessages((prev) => [
                      ...prev,
                      { from: 'me', text: item.q },
                      { from: 'shop', text: item.a },
                    ])
                  }}
                >
                  {item.q}
                </button>
              ))}
            </div>
          </div>
          <form
            className="u450-f"
            style={{ '--i': 2 } as React.CSSProperties}
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage(input)
            }}
          >
            <input
              className="u450-in"
              type="text"
              aria-label="Tin nhắn"
              placeholder="Nhập tin nhắn"
              autoComplete="off"
              value={input}
              ref={inputRef}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="u450-sd" aria-label="Gửi">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 13V3.5M3.8 7.4 8 3.2l4.2 4.2" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
