// Lucian UX/UI Prompt #445 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#445
// Vé mã giảm giá + ô nhập mã. Nhập đúng mã: con dấu "Đã áp dụng" đóng
// xuống, vé rung nhẹ, giá cũ gạch ngang + thu nhỏ, giá mới lăn xuống
// (rAF 700ms easeOutCubic). Nhập sai mã: ô nhập lắc đầu + viền đỏ.
import { useEffect, useRef, useState } from 'react'
import { formatVND } from '../context/CartContext'
import { COUPONS, getCoupon, type Coupon } from '../lib/coupons'

const OFFER = COUPONS.CAMP10

interface CouponBoxProps {
  /** Tạm tính trước giảm (VND). */
  subtotal: number
  /** Mã đang áp dụng (null = chưa áp). */
  applied: Coupon | null
  /** Số tiền được giảm (VND). */
  discount: number
  onApply: (coupon: Coupon) => void
  onRemove: () => void
}

export default function CouponBox({
  subtotal,
  applied,
  discount,
  onApply,
  onRemove,
}: CouponBoxProps) {
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [shakeKey, setShakeKey] = useState(0)
  const [thud, setThud] = useState(false)
  const newPriceRef = useRef<HTMLSpanElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Giá mới lăn xuống khi mã được áp (rAF 700ms, easeOutCubic).
  useEffect(() => {
    if (!applied) return
    const el = newPriceRef.current
    if (!el) return
    const from = subtotal
    const to = subtotal - discount
    if (reduced) {
      el.textContent = formatVND(to)
      return
    }
    let raf = 0
    const t0 = performance.now() + 150
    const dur = 700
    const step = (now: number) => {
      const k = Math.max(0, Math.min(1, (now - t0) / dur))
      const e = 1 - Math.pow(1 - k, 3)
      el.textContent = formatVND(Math.round(from - (from - to) * e))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [applied, discount, subtotal, reduced])

  // Con dấu đóng xuống: bật class is-thud 700ms rồi tắt để bấm lại được.
  useEffect(() => {
    if (!applied) return
    setThud(true)
    const timer = window.setTimeout(() => setThud(false), 700)
    return () => window.clearTimeout(timer)
  }, [applied])

  const handleApply = () => {
    if (busy) return
    if (applied) {
      onRemove()
      setInput('')
      inputRef.current?.focus({ preventScroll: true })
      return
    }
    const code = input.trim().toUpperCase()
    if (!code) {
      inputRef.current?.focus({ preventScroll: true })
      return
    }
    setBusy(true)
    window.setTimeout(
      () => {
        setBusy(false)
        const coupon = getCoupon(code)
        if (coupon) {
          setError('')
          onApply(coupon)
          return
        }
        setError('Mã này không tồn tại')
        setShakeKey((k) => k + 1)
      },
      reduced ? 150 : 600,
    )
  }

  const isErr = error !== ''
  return (
    <div className={`ux u445${applied ? ' is-on' : ''}${thud ? ' is-thud' : ''}`}>
      <div className="u445-tk">
        <div className="u445-l" aria-hidden="true">
          <b>{OFFER.percent}%</b>
          <small>GIẢM</small>
        </div>
        <div className="u445-r">
          <b>{OFFER.title}</b>
          <small>{OFFER.note}</small>
          <code>{OFFER.code}</code>
        </div>
        <span className="u445-stamp" aria-hidden="true">
          Đã áp dụng
        </span>
      </div>
      <div className="u445-pr">
        <span className="u445-old">{formatVND(subtotal)}</span>
        <span className="u445-new" ref={newPriceRef} aria-hidden={!applied}>
          {formatVND(subtotal - discount)}
        </span>
      </div>
      <div
        className={`u445-fd${isErr ? ' is-err' : ''}${shakeKey ? ' is-shake' : ''}`}
        key={shakeKey}
      >
        <input
          className="u445-in"
          type="text"
          aria-label="Mã giảm giá"
          placeholder="Nhập mã giảm giá"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="characters"
          maxLength={16}
          value={input}
          ref={inputRef}
          onChange={(e) => {
            const up = e.target.value.toUpperCase().replace(/\s/g, '')
            setInput(up)
            if (isErr) setError('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleApply()
            }
          }}
        />
        <button
          type="button"
          className="u445-ap"
          onClick={handleApply}
          disabled={busy}
        >
          {busy ? <i aria-hidden="true" /> : applied ? 'Gỡ mã' : 'Áp dụng'}
        </button>
      </div>
      <p className={`u445-msg${isErr ? ' is-on' : ''}`} aria-live="polite">
        {error}
      </p>
      <p className="u445-live" role="status">
        {applied ? 'Đã áp dụng mã giảm giá' : ''}
      </p>
    </div>
  )
}
