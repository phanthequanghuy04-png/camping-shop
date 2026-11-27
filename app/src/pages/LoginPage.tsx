import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  checkDemoLogin,
  checkRegisteredLogin,
  DEMO_PASSWORD,
  getSessionUser,
  saveSession,
  clearSession,
} from '../data/users'
import { clearToken, loginApi } from '../lib/api'
import type { User } from '../data/types'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loggedInUser, setLoggedInUser] = useState<User | null>(() =>
    getSessionUser(),
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.')
      return
    }
    // Thử đăng nhập qua API trước; API lỗi thì fallback tài khoản
    // demo/local (users.ts) như trước.
    try {
      const { user } = await loginApi(trimmedEmail, password)
      setError('')
      setLoggedInUser(user)
      return
    } catch {
      // API chưa chạy / lỗi: dùng đăng nhập local bên dưới.
    }
    // Tài khoản mẫu (users.ts) trước, rồi tới tài khoản đã đăng ký qua form.
    const user =
      checkDemoLogin(trimmedEmail, password) ??
      checkRegisteredLogin(trimmedEmail, password)
    if (!user) {
      setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.')
      return
    }
    saveSession(user)
    setError('')
    setLoggedInUser(user)
  }

  const handleLogout = () => {
    clearSession()
    clearToken()
    setLoggedInUser(null)
    setEmail('')
    setPassword('')
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100'

  // Đã đăng nhập: hiện thông tin + link theo role (admin thấy link tới /admin).
  if (loggedInUser) {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-4xl" aria-hidden="true">
            👋
          </p>
          <h1 className="mt-3 text-2xl font-bold text-emerald-900">
            Xin chào, {loggedInUser.name}!
          </h1>
          <p className="mt-2 text-gray-600">
            Bạn đã đăng nhập với email {loggedInUser.email}.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {loggedInUser.role === 'admin' && (
              <Link
                to="/admin"
                className="rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800"
              >
                Vào trang Quản trị
              </Link>
            )}
            <Link
              to="/shop"
              className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
            >
              Tiếp tục mua sắm
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-5 py-2.5 font-medium text-red-600 hover:bg-red-50"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-emerald-900">Đăng nhập</h1>
        <p className="mt-2 text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            className="font-medium text-emerald-700 hover:underline"
          >
            Đăng ký ngay
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
            <span className="text-sm font-medium text-gray-700">Email</span>
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
            <span className="text-sm font-medium text-gray-700">Mật khẩu</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              className={`${inputClass} mt-1`}
            />
          </label>

          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white hover:bg-emerald-800"
          >
            Đăng nhập
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-gray-700">
          <p className="font-semibold text-emerald-800">
            Tài khoản demo (mật khẩu: {DEMO_PASSWORD})
          </p>
          <p className="mt-1">Quản trị: admin@camping.vn</p>
          <p>Khách hàng: user@camping.vn</p>
        </div>
      </div>
    </main>
  )
}
