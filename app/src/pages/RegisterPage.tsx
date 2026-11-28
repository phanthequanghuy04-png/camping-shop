import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  getSessionUser,
  registerLocalUser,
  saveSession,
} from '../data/users'
import { clearToken, registerApi } from '../lib/api'
import { safeReturnTo } from '../lib/requireLogin'
import { AuthField } from '../components/EmailSignInForm'
import SocialSignInButtons from '../components/SocialSignInButtons'
import type { User } from '../data/types'

export default function RegisterPage() {
  const location = useLocation()
  // Trang "quay lại sau khi đăng ký" — khi đi từ /login có kèm state.from
  // (bị chặn ở giỏ/yêu thích/thanh toán) thì đăng ký xong về đúng chỗ đó;
  // mở /register trực tiếp thì mặc định về /shop như trước.
  const rawFrom = (location.state as { from?: unknown } | null)?.from
  const from = safeReturnTo(rawFrom, '/shop')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  // Ô nào đang lỗi (gạch đỏ + rung kiểu #403) + số lần rung lại của từng ô.
  const [errorField, setErrorField] = useState<string | null>(null)
  const [shakeNonces, setShakeNonces] = useState<Record<string, number>>({})
  // Nút đăng ký morph theo #403: idle → busy (xoay) → ok (tick tròn).
  const [phase, setPhase] = useState<'idle' | 'busy' | 'ok'>('idle')
  const [createdUser, setCreatedUser] = useState<User | null>(() =>
    getSessionUser(),
  )

  const failField = (field: string, message: string) => {
    setErrorField(field)
    setShakeNonces((prev) => ({ ...prev, [field]: (prev[field] ?? 0) + 1 }))
    setError(message)
  }

  const clearFieldError = (field: string) => {
    if (errorField === field) {
      setErrorField(null)
      setError('')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (phase !== 'idle') return
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const phoneDigits = phone.replace(/[\s-]/g, '')

    if (!trimmedName) {
      failField('name', 'Vui lòng nhập họ tên của bạn.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      failField('email', 'Email không hợp lệ. Vui lòng kiểm tra lại.')
      return
    }
    if (phoneDigits && !/^\d{10}$/.test(phoneDigits)) {
      failField(
        'phone',
        'Số điện thoại phải có đúng 10 chữ số (ví dụ: 0912345678).',
      )
      return
    }
    if (password.length < 6) {
      failField('password', 'Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }
    if (password !== confirmPassword) {
      failField('confirm', 'Mật khẩu nhập lại không khớp. Vui lòng kiểm tra lại.')
      return
    }

    setErrorField(null)
    setError('')
    setPhase('busy')

    // Thử đăng ký qua API trước (hash bcrypt thật phía server).
    // API lỗi thì fallback đăng ký local (users.ts) như trước.
    try {
      const { user } = await registerApi({
        name: trimmedName,
        email: trimmedEmail,
        phone: phoneDigits || null,
        password,
      })
      setPhase('ok')
      // Để dấu tick vẽ xong rồi mới hiện màn chào mừng.
      window.setTimeout(() => setCreatedUser(user), 800)
      return
    } catch (apiError) {
      // Email trùng là lỗi nghiệp vụ từ API: báo luôn, không fallback.
      if (
        apiError instanceof Error &&
        apiError.message.includes('đã được đăng ký')
      ) {
        setPhase('idle')
        failField('email', apiError.message)
        return
      }
      // Còn lại (API chưa chạy...): fallback local bên dưới.
    }

    const result = registerLocalUser({
      name: trimmedName,
      email: trimmedEmail,
      phone: phoneDigits || null,
      password,
    })
    if (!result.ok) {
      setPhase('idle')
      failField('email', result.error)
      return
    }
    // Đăng ký xong tự động đăng nhập luôn.
    clearToken()
    saveSession(result.user)
    setPhase('ok')
    window.setTimeout(() => setCreatedUser(result.user), 800)
  }

  if (createdUser) {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
          <p className="text-4xl" aria-hidden="true">
            🎉
          </p>
          <h1 className="mt-3 text-2xl font-bold text-foreground">
            Đăng ký thành công!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Chào mừng {createdUser.name} đến với Camping Shop. Bạn đã được
            đăng nhập với email {createdUser.email}.
          </p>
          <Link
            to={from}
            className="btn-white mt-6 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800"
          >
            Bắt đầu mua sắm
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Đăng ký</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            state={rawFrom ? { from } : undefined}
            className="font-medium text-primary-text hover:underline"
          >
            Đăng nhập
          </Link>
        </p>

        {/* Đăng ký bằng mạng xã hội (#066 Lucian): Google / Facebook /
            Apple. Chưa có OAuth thật nên bấm vào sẽ báo là chưa thiết lập. */}
        <div className="mt-6">
          <SocialSignInButtons mode="register" />
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}

        {/* Các ô nhập kiểu #403 Lucian (nhãn nổi, mắt mở/đóng, rung khi lỗi)
            + nút morph thành tick tròn khi đăng ký xong. */}
        <div className="ux u403 u403--register mt-6">
          <form onSubmit={handleSubmit} noValidate>
            <AuthField
              id="u403-reg-name"
              label="Họ tên *"
              type="text"
              value={name}
              onChange={(v) => {
                clearFieldError('name')
                setName(v)
              }}
              autoComplete="name"
              error={errorField === 'name'}
              shakeNonce={shakeNonces['name'] ?? 0}
            />
            <AuthField
              id="u403-reg-email"
              label="Email *"
              type="email"
              value={email}
              onChange={(v) => {
                clearFieldError('email')
                setEmail(v)
              }}
              autoComplete="email"
              error={errorField === 'email'}
              shakeNonce={shakeNonces['email'] ?? 0}
            />
            <AuthField
              id="u403-reg-phone"
              label="Số điện thoại (không bắt buộc)"
              type="tel"
              value={phone}
              onChange={(v) => {
                clearFieldError('phone')
                setPhone(v)
              }}
              autoComplete="tel"
              inputMode="numeric"
              error={errorField === 'phone'}
              shakeNonce={shakeNonces['phone'] ?? 0}
            />
            <AuthField
              id="u403-reg-password"
              label="Mật khẩu (tối thiểu 6 ký tự) *"
              type="password"
              value={password}
              onChange={(v) => {
                clearFieldError('password')
                setPassword(v)
              }}
              autoComplete="new-password"
              error={errorField === 'password'}
              shakeNonce={shakeNonces['password'] ?? 0}
              passwordToggle
            />
            <AuthField
              id="u403-reg-confirm"
              label="Nhập lại mật khẩu *"
              type="password"
              value={confirmPassword}
              onChange={(v) => {
                clearFieldError('confirm')
                setConfirmPassword(v)
              }}
              autoComplete="new-password"
              error={errorField === 'confirm'}
              shakeNonce={shakeNonces['confirm'] ?? 0}
              passwordToggle
            />

            <button
              type="submit"
              className={`u403-go${phase === 'busy' ? ' is-busy' : ''}${phase === 'ok' ? ' is-ok' : ''}`}
              aria-busy={phase === 'busy' || undefined}
              disabled={phase !== 'idle'}
            >
              <span>Tạo tài khoản</span>
              <i aria-hidden="true" />
              <svg viewBox="0 0 22 22" aria-hidden="true">
                <path d="M5.5 11.5l4 4L17 7.5" />
              </svg>
            </button>
          </form>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Bản demo chưa có backend nên tài khoản được lưu trên trình duyệt
          của bạn (localStorage). Khi có backend thật, mật khẩu sẽ được băm
          (bcrypt/argon2) phía server thay vì lưu text thường.
        </p>
      </div>
    </main>
  )
}
