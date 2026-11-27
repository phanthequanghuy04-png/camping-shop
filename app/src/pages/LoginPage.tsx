import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  checkDemoLogin,
  checkRegisteredLogin,
  DEMO_PASSWORD,
  getSessionUser,
  saveSession,
} from '../data/users'
import { loginApi } from '../lib/api'
import { showToast } from '../lib/toast'
import SocialSignInButtons from '../components/SocialSignInButtons'
import type { User } from '../data/types'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // Đã đăng nhập mà mở lại /login thì về trang chủ luôn — thông tin tài
  // khoản và nút đăng xuất đã nằm trên header, không cần trang chào nữa.
  useEffect(() => {
    if (getSessionUser()) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  // Đăng nhập xong: báo thành công rồi chuyển thẳng về trang chủ.
  const handleLoginSuccess = (user: User) => {
    setError('')
    showToast(`Đăng nhập thành công! Xin chào, ${user.name}.`)
    navigate('/')
  }

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
      handleLoginSuccess(user)
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
    handleLoginSuccess(user)
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100'

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

        {/* Đăng nhập mạng xã hội (#066 Lucian): Google / Facebook / Apple.
            Chưa có OAuth thật nên bấm vào sẽ báo là chưa thiết lập. */}
        <div className="mt-6">
          <SocialSignInButtons mode="login" />
        </div>

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
