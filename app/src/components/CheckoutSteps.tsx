// Lucian UX/UI Prompt #444 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#444
// Các bước thanh toán: Giỏ hàng -> Giao hàng -> Thanh toán -> Hoàn tất.
// Chuyển bước thì đường nối đầy dần (so le 0.26s), bước xong hiện dấu
// tick nảy lên, bước hiện tại "thở" với vòng mờ 2s. Chỉ cho quay lại
// các bước đã qua (không nhảy tới bước chưa tới).
import { useEffect, useRef, useState } from 'react'

const STEPS = ['Giỏ hàng', 'Giao hàng', 'Thanh toán', 'Hoàn tất']
const CHECK_SVG = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m5.5 12.5 4 4 9-9.5" />
  </svg>
)

interface CheckoutStepsProps {
  /** Bước hiện tại: 0 = Giỏ hàng, 1 = Giao hàng, 2 = Thanh toán, 3 = Hoàn tất. */
  current: number
  /** Bấm vào một bước đã qua để quay lại (vd bước 0 -> về /cart). */
  onStepClick?: (step: number) => void
}

export default function CheckoutSteps({ current, onStepClick }: CheckoutStepsProps) {
  const cur = Math.max(0, Math.min(STEPS.length - 1, current))
  const prevRef = useRef(cur)
  const [delays, setDelays] = useState<{ lines: string[]; dots: string[] }>({
    lines: [],
    dots: [],
  })
  const [focusStep, setFocusStep] = useState<number | null>(null)
  const dotRefs = useRef<Array<HTMLButtonElement | null>>([])

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Tính độ trễ so le (0.26s mỗi bước) khi current đổi, như bản gốc.
  useEffect(() => {
    const from = prevRef.current
    prevRef.current = cur
    const step = reduced ? 0 : 0.26
    const lines = STEPS.slice(1).map((_, k) => {
      const on = k < cur
      const d =
        on && k >= from
          ? (k - from) * step
          : !on && k < from
            ? (from - 1 - k) * step * 0.6
            : 0
      return `${d}s`
    })
    const dots = STEPS.map((_, k) => {
      const done = k < cur
      const d = done && k >= from ? (k - from) * step + step : 0
      return `${d}s`
    })
    setDelays({ lines, dots })
  }, [cur, reduced])

  useEffect(() => {
    if (focusStep !== null) {
      dotRefs.current[focusStep]?.focus({ preventScroll: true })
      setFocusStep(null)
    }
  }, [focusStep])

  const canGo = (step: number) => step <= cur

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const d =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    event.preventDefault()
    event.stopPropagation()
    const next = Math.max(0, Math.min(STEPS.length - 1, cur + d))
    if (next !== cur && canGo(next)) {
      onStepClick?.(next)
      setFocusStep(next)
    }
  }

  return (
    <div className="ux u444">
      <ol
        className="u444-st"
        aria-label="Các bước thanh toán"
        onKeyDown={handleKeyDown}
      >
        {STEPS.map((label, i) => {
          const done = i < cur
          const isCur = i === cur
          const line =
            i > 0 ? (
              <li
                key={`line-${i}`}
                className={`u444-ln${i - 1 < cur ? ' is-on' : ''}`}
                aria-hidden="true"
                style={
                  {
                    left: `calc(${(i - 1) * 25 + 12.5}% + 22px)`,
                    width: 'calc(25% - 44px)',
                    '--d': delays.lines[i - 1] ?? '0s',
                  } as React.CSSProperties
                }
              >
                <i />
              </li>
            ) : null
          return (
            <span key={`step-${i}`} style={{ display: 'contents' }}>
              {line}
              <li
                className={`u444-s${done ? ' is-done' : ''}${isCur ? ' is-cur' : ''}`}
                aria-current={isCur ? 'step' : undefined}
              >
                <button
                  type="button"
                  className="u444-dot"
                  ref={(el) => {
                    dotRefs.current[i] = el
                  }}
                  style={{ '--d': delays.dots[i] ?? '0s' } as React.CSSProperties}
                  aria-label={
                    done
                      ? `${label}, đã hoàn thành`
                      : isCur
                        ? `${label}, bước hiện tại`
                        : label
                  }
                  tabIndex={isCur ? 0 : -1}
                  aria-disabled={!canGo(i)}
                  onClick={() => {
                    if (canGo(i) && i !== cur) onStepClick?.(i)
                  }}
                >
                  <b>{i + 1}</b>
                  {CHECK_SVG}
                </button>
                <span aria-hidden="true">{label}</span>
              </li>
            </span>
          )
        })}
      </ol>
      <p className="u444-live" role="status">
        {STEPS[cur]}
      </p>
    </div>
  )
}
