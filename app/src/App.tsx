import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProductDetailPage from './pages/ProductDetailPage'
import RegisterPage from './pages/RegisterPage'
import ShopPage from './pages/ShopPage'
import ThemeToggle from './components/ThemeToggle'
import { useCart } from './context/CartContext'
import {
  cleanupAnimations,
  initAnimations,
  refreshAnimations,
  revealOnScroll,
} from './lib/animations'

const navLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/shop', label: 'Cửa hàng' },
  { to: '/cart', label: 'Giỏ hàng' },
  { to: '/login', label: 'Đăng nhập' },
  { to: '/register', label: 'Đăng ký' },
  { to: '/admin', label: 'Quản trị' },
]

/**
 * Header tách riêng thành component con để được dùng useCart():
 * Header nằm trong <BrowserRouter> (cần Link/NavLink) và dưới
 * <CartProvider> (bọc quanh <App /> trong main.tsx), nên hook không
 * bao giờ chạy ngoài Provider. Badge giỏ = useCart().totalQty (thật,
 * thay cho CART_COUNT = 0 tĩnh trước đây).
 */
function Header() {
  const { totalQty } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="site-header">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link to="/" className="brand" aria-label="Camping Shop — Trang chủ">
          {/* Icon lều SVG (design system: không dùng emoji làm icon) */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3 2 20h20L12 3Z"
              stroke="#74c69d"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M12 12.5 8.5 20h7L12 12.5Z"
              fill="#c05621"
            />
            <path d="M12 3v17.5" stroke="#74c69d" strokeWidth="1.4" />
          </svg>
          Camping Shop
        </Link>

        <div className="flex items-center gap-3">
          {/* Chuyển sáng/tối (dark mode, lưu localStorage `camping-theme`) */}
          <ThemeToggle />
          {/* Nút giỏ hàng + badge số lượng thật từ CartContext */}
          <Link
            to="/cart"
            className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[12px] px-2"
            aria-label={`Giỏ hàng, ${totalQty} sản phẩm`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 4h2.5l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6"
                stroke="#f5f0e1"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="21" r="1.4" fill="#f5f0e1" />
              <circle cx="18" cy="21" r="1.4" fill="#f5f0e1" />
            </svg>
            <span className="cart-badge absolute -right-1 -top-1" aria-hidden="true">
              {totalQty}
            </span>
          </Link>

          {/* Burger menu mobile */}
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[12px] md:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6 6 18" stroke="#f5f0e1" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="#f5f0e1" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {/* Menu desktop: ngang đầy đủ; mobile: hiện khi bấm burger */}
        <nav
          className={`${menuOpen ? 'flex' : 'hidden'} w-full flex-col gap-1 md:flex md:w-auto md:flex-row md:gap-6`}
          aria-label="Menu chính"
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `nav-link${isActive ? ' nav-link--active' : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

/**
 * Nội dung app — phải nằm trong <BrowserRouter> để dùng useLocation()
 * (theo dõi đổi route để refresh animation). Không dùng Barba.js:
 * chuyển trang do React Router lo.
 */
function AppContent() {
  const location = useLocation()

  // Khởi tạo animation 1 lần: GSAP + Lenis + AOS, rồi reveal '.reveal'.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      await initAnimations()
      if (!cancelled) revealOnScroll('.reveal')
    })()
    return () => {
      cancelled = true
      cleanupAnimations()
    }
  }, [])

  // Đổi route -> tính lại vị trí trigger của AOS / ScrollTrigger.
  useEffect(() => {
    refreshAnimations()
  }, [location.pathname])

  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route
          path="*"
          element={
            <main className="mx-auto max-w-3xl px-4 py-16 text-center">
              <h1 className="text-3xl font-bold text-emerald-900">
                Không tìm thấy trang
              </h1>
              <p className="mt-4 text-gray-600">
                Đường dẫn bạn vừa mở không tồn tại.
              </p>
              <Link
                to="/"
                className="btn-primary mt-8"
              >
                Về trang chủ
              </Link>
            </main>
          }
        />
      </Routes>

      <footer className="site-footer">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 text-sm md:grid-cols-3 md:px-6">
          <div>
            <p className="font-display text-lg font-bold">Camping Shop</p>
            <p className="mt-2 opacity-80">
              Đồ cắm trại — lều, bếp, đèn và mọi thứ bạn cần cho một đêm dưới
              bầu trời sao.
            </p>
          </div>
          <nav aria-label="Menu footer">
            <p className="font-display font-bold">Khám phá</p>
            <ul className="mt-2 space-y-2">
              {navLinks.slice(0, 3).map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="font-display font-bold">Liên hệ</p>
            <p className="mt-2 opacity-80">
              Camping Shop — Đồ cắm trại · Khung app đang xây dựng
            </p>
          </div>
        </div>
        <div className="border-t border-white/15 py-4 text-center text-xs opacity-70">
          © 2026 Camping Shop — Ra ngoài trời, sống trọn từng khoảnh khắc
        </div>
      </footer>
    </>
  )
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
