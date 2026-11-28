/**
 * Hàng link chuyển qua lại giữa 3 trang chính sách — đặt ở đầu mỗi trang
 * chính sách. Trang hiện tại hiện dạng chip (không phải link).
 */
import { Link } from 'react-router-dom'

export type PolicyKey = 'doi-tra' | 'bao-mat' | 'dieu-khoan'

const POLICIES: { key: PolicyKey; to: string; label: string }[] = [
  { key: 'doi-tra', to: '/chinh-sach/doi-tra', label: 'Đổi trả & hoàn tiền' },
  { key: 'bao-mat', to: '/chinh-sach/bao-mat', label: 'Bảo mật' },
  { key: 'dieu-khoan', to: '/chinh-sach/dieu-khoan', label: 'Điều khoản sử dụng' },
]

export default function PolicyNav({ current }: { current: PolicyKey }) {
  return (
    <nav aria-label="Các trang chính sách" className="mt-6 flex flex-wrap gap-2">
      {POLICIES.map((policy) =>
        policy.key === current ? (
          <span
            key={policy.key}
            aria-current="page"
            className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--color-primary-text)]"
          >
            {policy.label}
          </span>
        ) : (
          <Link
            key={policy.key}
            to={policy.to}
            className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium"
          >
            {policy.label}
          </Link>
        ),
      )}
    </nav>
  )
}
