import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  getSessionUser,
  registerLocalUser,
  saveSession,
} from '../data/users'
import { clearToken, registerApi } from '../lib/api'
import type { User } from '../data/types'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [createdUser, setCreatedUser] = useState<User | null>(() =>
    getSessionUser(),
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const phoneDigits = phone.replace(/[\s-]/g, '')

    if (!trimmedName) {
      setError('Vui lòng nhập họ tên của bạn.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Email không hợp lệ. Vui lòng kiểm tra lại.')
      return
    }
    if (phoneDigits && !/^\d{10}$/.test(phoneDigits)) {
      setError('Số điện thoại phải có đúng 10 chữ số (ví dụ: 0912345678).')
      return
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp. Vui lòng kiểm tra lại.')
      return
    }

    // Thử đăng ký qua API trước (hash bcrypt thật phía server).
    // API lỗi thì fallback đăng ký local (users.ts) như trước.
    try {
      const { user } = await registerApi({
        name: trimmedName,
        email: trimmedEmail,
        phone: phoneDigits || null,
        password,
      })
      setError('')
      setCreatedUser(user)
      return
    } catch (apiError) {
      // Email trùng là lỗi nghiệp vụ từ API: báo luôn, không fallback.
      if (
        apiError instanceof Error &&
        apiError.message.includes('đã được đăng ký')
      ) {
        setError(apiError.message)
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
      setError(result.error)
      return
    }
    // Đăng ký xong tự động đăng nhập luôn.
    clearToken()
    saveSession(result.user)
    setError('')
    setCreatedUser(result.user)
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100'

  if (createdUser) {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-4xl" aria-hidden="true">
            🎉
          </p>
          <h1 className="mt-3 text-2xl font-bold text-emerald-900">
            Đăng ký thành công!
          </h1>
          <p className="mt-2 text-gray-600">
            Chào mừng {createdUser.name} đến với Camping Shop. Bạn đã được
            đăng nhập với email {createdUser.email}.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800"
          >
            Bắt đầu mua sắm
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-emerald-900">Đăng ký</h1>
        <p className="mt-2 text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="font-medium text-emerald-700 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6" noValidate>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Họ tên <span className="text-red-600">*</span>
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              autoComplete="name"
              className={`${inputClass} mt-1`}
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-gray-700">
              Email <span className="text-red-600">*</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@example.com"
              autoComplete="email"
              className={`${inputClass} mt-1`}
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-gray-700">
              Số điện thoại
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912345678 (không bắt buộc)"
              autoComplete="tel"
              inputMode="numeric"
              className={`${inputClass} mt-1`}
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-gray-700">
              Mật khẩu <span className="text-red-600">*</span>
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              autoComplete="new-password"
              className={`${inputClass} mt-1`}
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-gray-700">
              Nhập lại mật khẩu <span className="text-red-600">*</span>
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
              className={`${inputClass} mt-1`}
            />
          </label>

          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white hover:bg-emerald-800"
          >
            Tạo tài khoản
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500">
          Bản demo chưa có backend nên tài khoản được lưu trên trình duyệt
          của bạn (localStorage). Khi có backend thật, mật khẩu sẽ được băm
          (bcrypt/argon2) phía server thay vì lưu text thường.
        </p>
      </div>
    </main>
  )
}
