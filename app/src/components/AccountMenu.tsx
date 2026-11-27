// Lucian UX/UI Prompt #408 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#408
// Menu tài khoản: nút avatar tròn; bấm thì menu bật ra từ avatar, các mục
// hiện lần lượt (tên + email, [Quản trị nếu là admin,] Yêu thích, Đơn hàng,
// Trợ giúp, Đăng xuất đỏ). Điều hướng bằng phím mũi tên, Esc đóng, bấm ra
// ngoài đóng lại. Mục menu gắn với tính năng thật của shop (avatar dùng
// chữ cái đầu của tên vì shop chưa có ảnh đại diện).
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from '../data/types'

interface AccountMenuProps {
  user: User
  onLogout: () => void
}

export default function AccountMenu({ user, onLogout }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLButtonElement>(null)
  // Vị trí menu đã kẹp vào trong màn hình (xem effect bên dưới).
  // null = chưa đo (dùng vị trí mặc định trong CSS: căn phải avatar).
  const [menuPos, setMenuPos] = useState<{
    left: number
    originX: number
  } | null>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const navigate = useNavigate()

  const initial = user.name.trim().charAt(0).toUpperCase() || '?'

  const close = (backToAvatar: boolean) => {
    setOpen(false)
    if (backToAvatar) avatarRef.current?.focus({ preventScroll: true })
  }

  const focusItem = (index: number) => {
    const items = itemRefs.current
    if (items.length === 0) return
    const next = ((index % items.length) + items.length) % items.length
    items[next]?.focus({ preventScroll: true })
  }

  // Bấm ra ngoài thì đóng menu.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open ])

  // Kẹp menu vào trong màn hình (sửa 2026-11-27): menu rộng 232px,
  // CSS mặc định căn phải dưới avatar — nếu avatar nằm quá trái
  // (màn hẹp) menu sẽ tràn ra ngoài mép trái, chữ bị cắt mất đầu
  // ("Quản trị" thành "ản trị", đã gặp khi avatar còn nằm giữa header
  // mobile). Đo vị trí thật của avatar khi mở menu rồi dời menu sang
  // phải vừa đủ để mép trái cách mép màn hình 8px; gốc hiệu ứng bật
  // (transform-origin) cũng dời theo để menu vẫn bật ra từ đúng chỗ
  // avatar. Dùng useLayoutEffect để đo trước khi vẽ khung hình đầu
  // tiên, khỏi chớp vị trí cũ.
  useLayoutEffect(() => {
    if (!open) return
    const MENU_WIDTH = 232 // phải khớp width của .u408-m trong lucian.css
    const measure = () => {
      const btn = avatarRef.current
      const wrap = btn?.parentElement
      if (!btn || !wrap) return
      const r = btn.getBoundingClientRect()
      const wrapRect = wrap.getBoundingClientRect()
      // Mép trái menu nếu căn phải avatar (như CSS mặc định).
      const naturalLeft = r.right - MENU_WIDTH
      // Kẹp vào trong màn hình, chừa 8px mỗi bên.
      const clampedLeft = Math.max(
        8,
        Math.min(naturalLeft, window.innerWidth - MENU_WIDTH - 8),
      )
      setMenuPos({
        // Đổi sang tọa độ trong .u408-w (khối chứa của menu).
        left: clampedLeft - wrapRect.left,
        // Tâm avatar tính từ mép trái menu — gốc của hiệu ứng bật.
        originX: r.left + r.width / 2 - clampedLeft,
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [open ])

  const handleItemClick = (action: () => void) => {
    close(true)
    action()
  }

  const menuItems = [
    // Tài khoản quản trị: mục "Quản trị" dẫn tới trang admin, chỉ hiện
    // khi user.role === 'admin', đứng đầu danh sách mục menu.
    ...(user.role === 'admin'
      ? [
          {
            key: 'admin',
            label: 'Quản trị',
            icon: (
              <svg viewBox="0 0 18 18" aria-hidden="true">
                <rect x="3" y="3" width="5" height="5" rx="1" />
                <rect x="10" y="3" width="5" height="5" rx="1" />
                <rect x="3" y="10" width="5" height="5" rx="1" />
                <rect x="10" y="10" width="5" height="5" rx="1" />
              </svg>
            ),
            action: () => navigate('/admin'),
          },
        ]
      : []),
    {
      key: 'wishlist',
      label: 'Sản phẩm yêu thích',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z" />
        </svg>
      ),
      action: () => navigate('/wishlist'),
    },
    {
      key: 'orders',
      label: 'Đơn hàng của tôi',
      icon: (
        <svg viewBox="0 0 18 18" aria-hidden="true">
          <path d="M3 5.5h12l-1 8a1.5 1.5 0 0 1-1.5 1.3h-7A1.5 1.5 0 0 1 4 13.5z" />
          <path d="M6.5 5.5v-1a2.5 2.5 0 0 1 5 0v1" />
        </svg>
      ),
      action: () => navigate('/orders'),
    },
    {
      key: 'help',
      label: 'Trợ giúp',
      icon: (
        <svg viewBox="0 0 18 18" aria-hidden="true">
          <circle cx="9" cy="9" r="7" />
          <path d="M7 7a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.3v.4" />
          <path d="M9 12.8v.1" />
        </svg>
      ),
      // Mở panel hỗ trợ (#450) ở góc phải-dưới.
      action: () =>
        window.dispatchEvent(new Event('camping-open-support')),
    },
  ]

  return (
    <div
      className={`ux u408${open ? ' is-open' : ''}`}
      ref={(el) => {
        wrapRef.current = el
      }}
    >
      <div className="u408-w">
        <button
          type="button"
          className="u408-av"
          aria-label="Mở menu tài khoản"
          aria-haspopup="menu"
          aria-expanded={open}
          ref={avatarRef}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              if (!open) setOpen(true)
              focusItem(0)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              if (!open) setOpen(true)
              focusItem(-1)
            } else if (e.key === 'Escape' && open) {
              e.stopPropagation()
              close(false)
            }
          }}
        >
          {initial}
        </button>
        <span className="u408-dot" aria-hidden="true" />
        <div
          className="u408-m"
          role="menu"
          aria-label="Menu tài khoản"
          style={
            menuPos
              ? ({
                  left: menuPos.left,
                  right: 'auto',
                  transformOrigin: `${menuPos.originX}px -12px`,
                } as React.CSSProperties)
              : undefined
          }
          onKeyDown={(e) => {
            const items = itemRefs.current
            const i = items.indexOf(document.activeElement as HTMLButtonElement)
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              focusItem(i + 1)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              focusItem(i - 1)
            } else if (e.key === 'Home') {
              e.preventDefault()
              focusItem(0)
            } else if (e.key === 'End') {
              e.preventDefault()
              focusItem(-1)
            } else if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              close(true)
            } else if (e.key === 'Tab') {
              close(false)
            }
          }}
        >
          <div className="u408-hd" style={{ '--i': 0 } as React.CSSProperties}>
            <b>{user.name}</b>
            <span>{user.email}</span>
          </div>
          {menuItems.map((item, i) => (
            <button
              key={item.key}
              type="button"
              className="u408-it"
              role="menuitem"
              tabIndex={-1}
              style={{ '--i': i + 1 } as React.CSSProperties}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              onClick={() => handleItemClick(item.action)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <div
            className="u408-hr"
            role="separator"
            style={{ '--i': menuItems.length + 1 } as React.CSSProperties}
          />
          <button
            type="button"
            className="u408-it is-out"
            role="menuitem"
            tabIndex={-1}
            style={{ '--i': menuItems.length + 2 } as React.CSSProperties}
            ref={(el) => {
              itemRefs.current[menuItems.length] = el
            }}
            onClick={() => handleItemClick(onLogout)}
          >
            <svg viewBox="0 0 18 18" aria-hidden="true">
              <path d="M7 3H4.5A1.5 1.5 0 0 0 3 4.5v9A1.5 1.5 0 0 0 4.5 15H7" />
              <path d="M11.5 12.5 15 9l-3.5-3.5M15 9H7.5" />
            </svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  )
}
