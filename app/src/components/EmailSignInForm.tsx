// Lucian UX/UI Prompt #403 — Email sign-in form (MIT License (c) 2026 Seokwoooo).
// Port sang React cho Camping Shop: https://lucianlabs.dev/uxui-prompt/#403
// Nhãn nổi khi focus/có giá trị; nút mắt mở/đóng như mắt thật; sai thì ô
// rung + gạch đỏ quét ngang; đúng thì nút co thành tick tròn.
// Khác bản gốc: đăng nhập thật qua API / tài khoản demo của shop (không có
// mật khẩu mẫu hardcode); thông báo lỗi bằng tiếng Việt; thời gian chờ
// tick ngắn lại vì đăng nhập xong sẽ chuyển trang ngay.
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
} from 'react'

export type SignInResult =
  | 'ok'
  | { field: 'email' | 'password'; message: string }

type EmailSignInFormProps = {
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  /** Thử đăng nhập thật (API rồi fallback tài khoản demo/local). */
  onSubmit: (email: string, password: string) => Promise<SignInResult>
  /** Gọi sau khi nút hiện dấu tick (đăng nhập thành công). */
  onSuccess: () => void
  submitLabel?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function EmailSignInForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onSuccess,
  submitLabel = 'Đăng nhập',
}: EmailSignInFormProps) {
  const [focused, setFocused] = useState<'email' | 'password' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'busy' | 'ok'>('idle')
  const [errField, setErrField] = useState<'email' | 'password' | null>(null)
  const [errMsg, setErrMsg] = useState('')
  const [liveText, setLiveText] = useState('')
  const emailWrapRef = useRef<HTMLDivElement>(null)
  const passwordWrapRef = useRef<HTMLDivElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Rung lại ô lỗi theo đúng cách bản gốc: gỡ class, ép reflow, gắn lại.
  const shakeField = (field: 'email' | 'password') => {
    const el =
      field === 'email' ? emailWrapRef.current : passwordWrapRef.current
    if (!el) return
    el.classList.remove('is-shake')
    void el.offsetWidth
    el.classList.add('is-shake')
  }

  const fail = (field: 'email' | 'password', message: string) => {
    setErrField(field)
    setErrMsg(message)
    shakeField(field)
    const input =
      field === 'email' ? emailInputRef.current : passwordInputRef.current
    input?.focus({ preventScroll: true })
  }

  const clearFieldError = (field: 'email' | 'password') => {
    if (errField === field) {
      setErrField(null)
      setErrMsg('')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (phase !== 'idle') return
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      fail('email', 'Vui lòng nhập email.')
      return
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      fail('email', 'Kiểm tra lại địa chỉ email.')
      return
    }
    if (!password) {
      fail('password', 'Vui lòng nhập mật khẩu.')
      return
    }
    setErrField(null)
    setErrMsg('')
    setPhase('busy')
    setLiveText('Đang kiểm tra đăng nhập')
    const result = await onSubmit(trimmedEmail, password)
    if (result === 'ok') {
      setPhase('ok')
      setLiveText('Đăng nhập thành công')
      window.setTimeout(onSuccess, reducedMotion ? 700 : 1100)
      return
    }
    setPhase('idle')
    setLiveText('')
    fail(result.field, result.message)
  }

  const isUp = (field: 'email' | 'password') =>
    focused === field || (field === 'email' ? email !== '' : password !== '')

  return (
    <div className="ux u403">
      <form className="u403-form" onSubmit={handleSubmit} noValidate>
        <div
          ref={emailWrapRef}
          className={`u403-f${focused === 'email' ? ' is-f' : ''}${isUp('email') ? ' is-up' : ''}${errField === 'email' ? ' is-err' : ''}`}
        >
          <input
            ref={emailInputRef}
            id="u403-email"
            className="u403-in"
            type="email"
            autoComplete="email"
            spellCheck={false}
            value={email}
            aria-invalid={errField === 'email' || undefined}
            aria-describedby={errField === 'email' ? 'u403-msg' : undefined}
            onChange={(e) => {
              clearFieldError('email')
              onEmailChange(e.target.value)
            }}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
          />
          <label htmlFor="u403-email">Email</label>
        </div>

        <div
          ref={passwordWrapRef}
          className={`u403-f u403-pw${focused === 'password' ? ' is-f' : ''}${isUp('password') ? ' is-up' : ''}${errField === 'password' ? ' is-err' : ''}`}
        >
          <input
            ref={passwordInputRef}
            id="u403-password"
            className="u403-in"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            aria-invalid={errField === 'password' || undefined}
            aria-describedby={errField === 'password' ? 'u403-msg' : undefined}
            onChange={(e) => {
              clearFieldError('password')
              onPasswordChange(e.target.value)
            }}
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused(null)}
          />
          <label htmlFor="u403-password">Mật khẩu</label>
          <button
            type="button"
            className="u403-eye"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <g className="lid">
                <path d="M2 10s3-5.2 8-5.2S18 10 18 10s-3 5.2-8 5.2S2 10 2 10z" />
                <circle cx="10" cy="10" r="2.4" />
              </g>
              <g className="lash">
                <path d="M3 10.4c2 2.4 4.4 3.4 7 3.4s5-1 7-3.4M6 13l-1 1.6M10 14v1.8M14 13l1 1.6" />
              </g>
            </svg>
          </button>
        </div>

        <p
          id="u403-msg"
          className={`u403-msg${errMsg ? ' is-on' : ''}`}
          aria-live="polite"
        >
          {errMsg}
        </p>

        <button
          type="submit"
          className={`u403-go${phase === 'busy' ? ' is-busy' : ''}${phase === 'ok' ? ' is-ok' : ''}`}
          aria-busy={phase === 'busy' || undefined}
          disabled={phase !== 'idle'}
        >
          <span>{submitLabel}</span>
          <i aria-hidden="true" />
          <svg viewBox="0 0 22 22" aria-hidden="true">
            <path d="M5.5 11.5l4 4L17 7.5" />
          </svg>
        </button>
      </form>
      <p className="u403-live" role="status">
        {liveText}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* AuthField — một ô nhập kiểu #403 dùng lại cho trang Đăng ký: nhãn   */
/* nổi, nút mắt cho ô mật khẩu, gạch đỏ + rung khi lỗi. Cha truyền    */
/* shakeNonce tăng dần để rung lại mỗi lần bấm đăng ký mà lỗi.        */
/* ------------------------------------------------------------------ */

type AuthFieldProps = {
  id: string
  label: string
  type: 'text' | 'email' | 'tel' | 'password'
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  placeholder?: string
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
  error?: boolean
  shakeNonce?: number
  passwordToggle?: boolean
}

export function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
  inputMode,
  error = false,
  shakeNonce = 0,
  passwordToggle = false,
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (shakeNonce <= 0) return
    const el = wrapRef.current
    if (!el) return
    el.classList.remove('is-shake')
    void el.offsetWidth
    el.classList.add('is-shake')
  }, [shakeNonce])

  const isUp = focused || value !== ''
  const inputType =
    type === 'password' && passwordToggle && showPassword
      ? 'text'
      : type

  return (
    <div
      ref={wrapRef}
      className={`u403-f${passwordToggle ? ' u403-pw' : ''}${focused ? ' is-f' : ''}${isUp ? ' is-up' : ''}${error ? ' is-err' : ''}`}
    >
      <input
        id={id}
        className="u403-in"
        type={inputType}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        spellCheck={false}
        value={value}
        aria-invalid={error || undefined}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <label htmlFor={id}>{label}</label>
      {passwordToggle && (
        <button
          type="button"
          className="u403-eye"
          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          aria-pressed={showPassword}
          onClick={() => setShowPassword((v) => !v)}
          tabIndex={-1}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <g className="lid">
              <path d="M2 10s3-5.2 8-5.2S18 10 18 10s-3 5.2-8 5.2S2 10 2 10z" />
              <circle cx="10" cy="10" r="2.4" />
            </g>
            <g className="lash">
              <path d="M3 10.4c2 2.4 4.4 3.4 7 3.4s5-1 7-3.4M6 13l-1 1.6M10 14v1.8M14 13l1 1.6" />
            </g>
          </svg>
        </button>
      )}
    </div>
  )
}
