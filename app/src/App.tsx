import { useEffect, useRef, useState } from 'react'
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import OrdersPage from './pages/OrdersPage'
import ProductDetailPage from './pages/ProductDetailPage'
import RegisterPage from './pages/RegisterPage'
import ShopPage from './pages/ShopPage'
import WishlistPage from './pages/WishlistPage'
import ThemeToggle from './components/ThemeToggle'
import AccountMenu from './components/AccountMenu'
import CartDrawer from './components/CartDrawer'
import BackToTop from './components/BackToTop'
import { useCart } from './context/CartContext'
import { clearSession, getSessionUser } from './data/users'
import type { User } from './data/types'
import { clearToken } from './lib/api'
import { showToast } from './lib/toast'
import {
  cleanupAnimations,
  initAnimations,
  refreshAnimations,
  revealOnScroll,
  scrollToTop,
} from './lib/animations'

const navLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/shop', label: 'Cửa hàng' },
  { to: '/cart', label: 'Giỏ hàng' },
  { to: '/login', label: 'Đăng nhập' },
  { to: '/register', label: 'Đăng ký' },
]

/**
 * Header tách riêng thành component con để được dùng useCart():
 * Header nằm trong <BrowserRouter> (cần Link/NavLink) và dưới
 * <CartProvider> (bọc quanh <App /> trong main.tsx), nên hook không
 * bao giờ chạy ngoài Provider. Badge giỏ = useCart().totalQty (thật,
 * thay cho CART_COUNT = 0 tĩnh trước đây).
 */
function Header() {
  const { totalQty, openDrawer } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  // #212 Lucian — header ẩn khi cuộn xuống, hiện khi cuộn lên, đặc lại
  // khi cuộn quá 20px + thanh tiến trình đọc 2px ở đáy header.
  const [headerSolid, setHeaderSolid] = useState(false)
  const [headerHidden, setHeaderHidden] = useState(false)
  // Thanh tiến trình đọc cập nhật trực tiếp qua ref, KHÔNG qua state:
  // trước đây setReadProgress mỗi lần cuộn đều render lại toàn bộ
  // header (cả App) theo từng pixel — đó là chỗ "làm lại" nặng nhất
  // khi cuộn. Đổi sang ref thì thanh chạy y hệt (cùng giá trị scaleX)
  // mà không render lại gì cả (sửa 2026-11-27, theo ý tưởng của Huy).
  const progressRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let last = window.scrollY
    let acc = 0
    let solid = false
    let hidden = false
    const onScroll = () => {
      const y = window.scrollY
      const d = y - last
      last = y
      acc = (d > 0) === (acc > 0) ? acc + d : d
      const nextSolid = y > 20
      if (nextSolid !== solid) {
        solid = nextSolid
        setHeaderSolid(solid)
      }
      let nextHidden = hidden
      if (y < 60) nextHidden = false
      else if (acc > 8) nextHidden = true
      else if (acc < -6) nextHidden = false
      if (nextHidden !== hidden) {
        hidden = nextHidden
        setHeaderHidden(hidden)
      }
      // Thanh tiến trình: ghi thẳng vào style của span qua ref, không
      // qua state nên không render lại header.
      const bar = progressRef.current
      if (bar) {
        const max = document.documentElement.scrollHeight - window.innerHeight
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  // useLocation để Header render lại mỗi lần đổi trang.
  useLocation()
  const navigate = useNavigate()
  // Người đang đăng nhập (null khi chưa đăng nhập).
  // Đồng bộ lại ngay khi phiên đăng nhập thay đổi (đăng nhập/đăng xuất
  // ở trang /login không chuyển trang, nên chỉ đọc localStorage lúc
  // render sẽ làm header cập nhật chậm). users.ts phát sự kiện
  // 'camping-auth-changed' mỗi khi saveSession/clearSession.
  const [sessionUser, setSessionUser] = useState<User | null>(() =>
    getSessionUser(),
  )
  useEffect(() => {
    const syncAuth = () => {
      const user = getSessionUser()
      setSessionUser(user)
    }
    window.addEventListener('camping-auth-changed', syncAuth)
    window.addEventListener('storage', syncAuth)
    return () => {
      window.removeEventListener('camping-auth-changed', syncAuth)
      window.removeEventListener('storage', syncAuth)
    }
  }, [])

  const handleLogout = () => {
    clearSession()
    clearToken()
    showToast('Đã đăng xuất.')
    navigate('/')
  }

  // Link "Đăng nhập" / "Đăng ký" chỉ hiện khi chưa đăng nhập (đã đăng
  // nhập thì header hiện tên người dùng + nút "Đăng xuất" thay thế).
  // Mục "Quản trị" đã bỏ khỏi header theo yêu cầu của Huy (đã có trong
  // menu tài khoản) nên không còn lọc theo quyền admin ở đây.
  const visibleNavLinks = navLinks.filter((link) => {
    if (link.to === '/login' || link.to === '/register')
      return !sessionUser
    return true
  })

  return (
    <header
      className={`site-header${headerSolid ? ' is-solid' : ''}${headerHidden ? ' is-hide' : ''}`}
    >
      {/* Hàng header: mobile 1 hàng — [burger + logo] trái, [đổi theme,
          giỏ hàng, avatar] phải (ml-auto); desktop giữ logo trái, menu
          giữa (order-2), cụm tác vụ phải (order-3). Menu mobile bung
          xuống thành hàng riêng (w-full) khi bấm burger. */}
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-2 px-3 py-3 sm:gap-4 sm:px-4 md:flex-nowrap md:justify-between md:px-6 md:py-4">
        {/* Nhóm trái: nút mở menu (chỉ mobile) + logo */}
        <div className="flex min-w-0 items-center gap-2 md:order-1">
          {/* Burger menu mobile — nằm bên trái, trước logo */}
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[12px] md:hidden"
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

          <Link to="/" className="brand" aria-label="Camping Shop — Trang chủ">
          {/* Logo thương hiệu mẫu C (nét vẽ tối giản): biểu tượng lều,
              núi, mặt trời bản một màu trắng — dùng trên nền header xanh rừng. */}
          <svg width="28" height="28" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <g fill="#FFFFFF">
              <circle cx="86" cy="30" r="11" />
              <polygon points="10,90 44,48 66,74 88,44 112,90" />
              <polygon points="60,40 16,94 104,94" />
              <polygon points="10,82 4,94 16,94" />
              <polygon points="110,82 104,94 116,94" />
              <rect x="8" y="96" width="104" height="5" rx="2.5" />
            </g>
            <path
              d="M60 68 L48 94 H72 Z"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
          </svg>
          Camping Shop
        </Link>
        </div>

        {/* Cụm tác vụ bên phải header: đổi theme, giỏ hàng, avatar
            tài khoản. ml-auto đẩy cụm sang phải trên mobile; trên
            desktop (md+) dùng order-3 để nằm bên phải, sau menu điều
            hướng (order-2), ml-0 để justify-between của header chia
            đều 3 phần như cũ. */}
        <div className="ml-auto flex items-center gap-1 sm:gap-3 md:order-3 md:ml-0">
          {/* Chuyển sáng/tối (dark mode, lưu localStorage `camping-theme`) */}
          <ThemeToggle />
          {/* Nút giỏ hàng + badge số lượng thật từ CartContext.
              Bấm thì mở ngăn giỏ trượt (#240) thay vì chuyển trang;
              trang /cart đầy đủ vẫn tới được từ link "Giỏ hàng" trong menu
              và từ nút "Xem giỏ hàng đầy đủ" trong ngăn. */}
          <button
            type="button"
            id="header-cart-button"
            onClick={() => openDrawer()}
            className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[12px] px-2 transition duration-200 ease-out hover:bg-white/10 focus:outline-2 focus:outline-[#74C69D]"
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
          </button>

          {/* Đã đăng nhập: menu tài khoản (#408 Lucian) thay cho chip tên
              + nút Đăng xuất: avatar chữ cái đầu, bấm mở menu Yêu thích /
              Đơn hàng / Trợ giúp / Đăng xuất. */}
          {sessionUser && (
            <AccountMenu user={sessionUser} onLogout={handleLogout} />
          )}
        </div>

        {/* Menu desktop: ngang đầy đủ, nằm giữa header (logo trái,
            menu giữa, cụm tác vụ phải); mobile: hiện khi bấm burger */}
        <nav
          className={`${menuOpen ? 'flex' : 'hidden'} w-full flex-col gap-1 md:order-2 md:flex md:w-auto md:flex-row md:gap-6`}
          aria-label="Menu chính"
        >
          {visibleNavLinks.map((link) => (
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
      {/* Thanh tiến trình đọc (#212): đầy dần theo % trang đã cuộn.
          Giá trị scaleX ban đầu 0, onScroll ghi đè qua progressRef. */}
      <span
        ref={progressRef}
        className="header-progress"
        aria-hidden="true"
        style={{
          transform: 'scaleX(0)',
          transformOrigin: '0 50%',
        }}
      />
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

  // Toast ngắn (vd "Đăng nhập thành công!"): LoginPage / Header phát sự
  // kiện 'camping-toast' qua showToast(), AppContent hiện thông báo nổi
  // phía trên trang vài giây rồi tự mờ đi. Bấm vào toast để tắt ngay.
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  )
  const [toastVisible, setToastVisible] = useState(false)
  useEffect(() => {
    const onToast = (event: Event) => {
      const message = (event as CustomEvent<string>).detail
      if (typeof message !== 'string' || message === '') return
      setToast({ id: Date.now(), message })
      setToastVisible(true)
    }
    window.addEventListener('camping-toast', onToast)
    return () => window.removeEventListener('camping-toast', onToast)
  }, [])
  useEffect(() => {
    if (!toast) return
    const hideTimer = window.setTimeout(() => setToastVisible(false), 3200)
    const clearTimer = window.setTimeout(() => setToast(null), 3600)
    return () => {
      window.clearTimeout(hideTimer)
      window.clearTimeout(clearTimer)
    }
  }, [toast])

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

  // Đổi route -> cuộn về đầu trang rồi tính lại vị trí trigger của
  // AOS / ScrollTrigger. Không cuộn lên đầu thì trang mới giữ nguyên
  // vị trí cuộn của trang cũ (vd bấm sản phẩm ở cuối danh sách thì
  // trang chi tiết mở ra đã nằm ở phần "Sản phẩm liên quan").
  useEffect(() => {
    scrollToTop()
    refreshAnimations()
  }, [location.pathname])

  return (
    <>
      <Header />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          onClick={() => setToastVisible(false)}
          className={`fixed left-1/2 top-20 z-[60] flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full bg-[#1B4332] px-5 py-3 text-sm font-medium whitespace-nowrap text-white shadow-[0_12px_32px_rgba(27,67,50,0.35)] transition-all duration-300 ease-out ${
            toastVisible
              ? 'translate-y-0 opacity-100'
              : '-translate-y-2 opacity-0'
          }`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="#74C69D"
              strokeWidth="1.8"
            />
            <path
              d="m8 12.5 2.5 2.5L16 9.5"
              stroke="#74C69D"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {toast.message}
        </div>
      )}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/orders" element={<OrdersPage />} />
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

      {/* Ngăn giỏ trượt (#240) + nút về đầu trang / hỗ trợ (#450). */}
      <CartDrawer />
      <BackToTop />

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
