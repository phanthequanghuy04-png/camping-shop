import { useEffect, useRef, useState } from 'react'
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
import EmailSignInForm, { type SignInResult } from '../components/EmailSignInForm'
import SocialSignInButtons from '../components/SocialSignInButtons'
import type { User } from '../data/types'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Người dùng vừa đăng nhập xong (để onSuccess báo chào + chuyển trang).
  const signedInUserRef = useRef<User | null>(null)

  // Đã đăng nhập mà mở lại /login thì về trang chủ luôn — thông tin tài
  // khoản và nút đăng xuất đã nằm trên header, không cần trang chào nữa.
  useEffect(() => {
    if (getSessionUser()) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  // Đăng nhập thật: thử API trước (loginApi tự lưu token + session);
  // API lỗi thì fallback tài khoản demo/local (users.ts) như trước.
  // Trả 'ok' để form #403 đổi nút thành tick, hoặc lỗi theo từng ô để
  // form rung ô đó + hiện thông báo dưới ô nhập.
  const handleSignIn = async (
    trimmedEmail: string,
    plainPassword: string,
  ): Promise<SignInResult> => {
    try {
      const { user } = await loginApi(trimmedEmail, plainPassword)
      signedInUserRef.current = user
      return 'ok'
    } catch {
      // API chưa chạy / lỗi: dùng đăng nhập local bên dưới.
    }
    // Tài khoản mẫu (users.ts) trước, rồi tới tài khoản đã đăng ký qua form.
    const user =
      checkDemoLogin(trimmedEmail, plainPassword) ??
      checkRegisteredLogin(trimmedEmail, plainPassword)
    if (!user) {
      return {
        field: 'password',
        message: 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.',
      }
    }
    saveSession(user)
    signedInUserRef.current = user
    return 'ok'
  }

  // Đăng nhập xong (sau khi nút hiện tick): báo thành công rồi về trang chủ.
  const handleLoginSuccess = () => {
    const user = signedInUserRef.current
    if (!user) return
    showToast(`Đăng nhập thành công! Xin chào, ${user.name}.`)
    navigate('/')
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Đăng nhập</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            className="font-medium text-primary-text hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>

        {/* Đăng nhập mạng xã hội (#066 Lucian): Google / Facebook / Apple.
            Chưa có OAuth thật nên bấm vào sẽ báo là chưa thiết lập. */}
        <div className="mt-6">
          <SocialSignInButtons mode="login" />
        </div>

        {/* Form email + mật khẩu (#403 Lucian): nhãn nổi, mắt mở/đóng,
            sai thì ô rung + gạch đỏ, đúng thì nút co thành tick tròn. */}
        <div className="mt-6">
          <EmailSignInForm
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleSignIn}
            onSuccess={handleLoginSuccess}
          />
        </div>

        <div className="mt-6 rounded-lg bg-primary-soft px-4 py-3 text-sm text-foreground">
          <p className="font-semibold text-primary-text">
            Tài khoản demo (mật khẩu: {DEMO_PASSWORD})
          </p>
          <p className="mt-1">Quản trị: admin@camping.vn</p>
          <p>Khách hàng: user@camping.vn</p>
        </div>
      </div>
    </main>
  )
}
