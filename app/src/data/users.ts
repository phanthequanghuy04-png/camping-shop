import bcrypt from 'bcryptjs'
import type { User } from './types'

/**
 * Tài khoản mẫu khớp dữ liệu INSERT INTO users trong camping.sql
 * (id, tên, email, SĐT, role, password_hash).
 *
 * MẬT KHẨU DEMO — CHỈ DÙNG CHO BẢN DEMO FRONTEND, KHÔNG PHẢI MẬT KHẨU THẬT:
 * mật khẩu mẫu mới xem DEPLOY.md mục 1 (đã đổi ngày 27/11/2026, không còn '123456'). Đăng nhập demo
 * KHÔNG còn so sánh text thường mà kiểm tra bằng
 * bcrypt.compareSync(password, password_hash) trong checkDemoLogin.
 * password_hash dưới đây là hash bcrypt thật (cost 10, salt khác nhau
 * cho 2 tài khoản), khớp đúng hash trong camping.sql.
 * DEMO_PASSWORD chỉ còn dùng để hiển thị gợi ý trên LoginPage, không
 * dùng để xác thực nữa.
 * CẢNH BÁO: hash nằm trong bundle frontend nên ai cũng đọc được —
 * đây là giới hạn cố hữu của bản demo. Production PHẢI bỏ hẳn cơ chế
 * này, chuyển sang xác thực qua API/backend và chỉ lưu password_hash
 * phía server/DB (xem ghi chú trong camping.sql và types.ts).
 * Khi có backend/API thật, bỏ DEMO_PASSWORD, seedUsers.password_hash
 * và hàm checkDemoLogin.
 */
export const DEMO_PASSWORD = 'q2aPhiYQVQgDH3m7'

/**
 * Tài khoản mẫu + password_hash (chỉ dùng nội bộ trong file này).
 * Kiểu User trong types.ts cố tình KHÔNG có password_hash, nên dùng
 * kiểu mở rộng này cho seed; mọi hàm trả User ra ngoài đều phải lược
 * bỏ password_hash trước khi trả về (xem checkDemoLogin, getAllUsers).
 */
export interface SeedUser extends User {
  password_hash: string
}

/** Tài khoản mẫu khớp camping.sql. */
export const seedUsers: SeedUser[] = [
  {
    id: 1,
    name: 'Admin Camping',
    email: 'admin@camping.vn',
    phone: '0901234567',
    role: 'admin',
    password_hash:
      '$2a$10$fszm16X4ha07LNsfk25CweksyRbXaXhpVDjHHVmsZIku4G2PdBG0.',
  },
  {
    id: 2,
    name: 'Nguyễn Văn An',
    email: 'user@camping.vn',
    phone: '0912345678',
    role: 'user',
    password_hash:
      '$2a$10$lEDUhevukBCWumbq2X6hPuwXDANkfZBPe2pT3V..HIJigQCe61gGu',
  },
]

/** Tìm tài khoản mẫu theo email (không phân biệt hoa/thường, bỏ khoảng trắng thừa). */
export function findUserByEmail(email: string): User | undefined {
  const normalized = email.trim().toLowerCase()
  return seedUsers.find((user) => user.email.toLowerCase() === normalized)
}

/**
 * Kiểm tra đăng nhập tài khoản mẫu: email khớp seedUsers + mật khẩu
 * kiểm tra bằng bcrypt với password_hash đã lưu (không so sánh text).
 * Trả về User (đã lược bỏ password_hash) khi đúng, null khi sai email
 * hoặc sai mật khẩu. Giữ chữ ký đồng bộ để LoginPage không phải đổi.
 */
export function checkDemoLogin(email: string, password: string): User | null {
  const normalized = email.trim().toLowerCase()
  const seed = seedUsers.find((user) => user.email.toLowerCase() === normalized)
  if (!seed) return null
  if (!bcrypt.compareSync(password, seed.password_hash)) return null
  const { password_hash: _password_hash, ...user } = seed
  return user
}

// ---------------------------------------------------------------------------
// Tài khoản người dùng tự đăng ký — lưu ở localStorage (bản demo, chưa có backend)
// ---------------------------------------------------------------------------

/** Key lưu danh sách tài khoản đăng ký. */
export const REGISTERED_USERS_KEY = 'camping-users'
/** Key lưu phiên đăng nhập (người đang đăng nhập). */
export const SESSION_KEY = 'camping-session'

/**
 * Tài khoản đăng ký qua form, lưu ở localStorage.
 * LƯU Ý BẢO MẬT (bản demo): trường password ở đây là text thường chỉ để
 * demo đăng nhập phía client khi chưa có backend. Production PHẢI bỏ hẳn
 * và dùng password_hash (bcrypt/argon2) phía server như camping.sql yêu cầu.
 */
export interface LocalUser extends User {
  password: string
}

export function loadRegisteredUsers(): LocalUser[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (u): u is LocalUser =>
        typeof u === 'object' &&
        u !== null &&
        typeof (u as LocalUser).email === 'string' &&
        typeof (u as LocalUser).password === 'string',
    )
  } catch {
    return []
  }
}

export function findRegisteredUser(email: string): LocalUser | undefined {
  const normalized = email.trim().toLowerCase()
  return loadRegisteredUsers().find(
    (user) => user.email.toLowerCase() === normalized,
  )
}

/** Kiểm tra đăng nhập tài khoản đã đăng ký qua form (email + mật khẩu đã lưu). */
export function checkRegisteredLogin(
  email: string,
  password: string,
): User | null {
  const found = findRegisteredUser(email)
  if (!found || found.password !== password) return null
  const { password: _password, ...user } = found
  return user
}

/**
 * Đăng ký tài khoản mới (role luôn là 'user').
 * Trả về { ok: true, user } hoặc { ok: false, error } với lỗi tiếng Việt.
 */
export function registerLocalUser(input: {
  name: string
  email: string
  phone: string | null
  password: string
}):
  | { ok: true; user: User }
  | { ok: false; error: string } {
  const email = input.email.trim().toLowerCase()
  if (findUserByEmail(email) || findRegisteredUser(email)) {
    return { ok: false, error: 'Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.' }
  }
  const existing = loadRegisteredUsers()
  const nextId =
    Math.max(0, ...seedUsers.map((u) => u.id), ...existing.map((u) => u.id)) + 1
  const stored: LocalUser = {
    id: nextId,
    name: input.name.trim(),
    email,
    phone: input.phone,
    role: 'user',
    password: input.password,
  }
  try {
    localStorage.setItem(
      REGISTERED_USERS_KEY,
      JSON.stringify([...existing, stored]),
    )
  } catch {
    return { ok: false, error: 'Không lưu được tài khoản. Vui lòng thử lại.' }
  }
  const { password: _password, ...user } = stored
  return { ok: true, user }
}

/** Tất cả tài khoản (mẫu + đã đăng ký) — dùng cho trang Quản trị nếu cần. */
export function getAllUsers(): User[] {
  return [
    ...seedUsers.map(({ password_hash: _password_hash, ...user }) => user),
    ...loadRegisteredUsers().map(({ password: _password, ...user }) => user),
  ]
}

// ---------------------------------------------------------------------------
// Phiên đăng nhập
// ---------------------------------------------------------------------------

/** Lưu người đang đăng nhập vào localStorage key 'camping-session'. */
export function saveSession(user: User): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  } catch {
    // Bỏ qua: phiên chỉ mất khi tải lại trang.
  }
  notifyAuthChanged()
}

/** Đọc người đang đăng nhập (null khi chưa đăng nhập). */
export function getSessionUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as User).email === 'string'
    ) {
      return parsed as User
    }
    return null
  } catch {
    return null
  }
}

/** Đăng xuất: xóa phiên đăng nhập. */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
  notifyAuthChanged()
}

/**
 * Báo cho các component đang hiển thị (vd Header) biết phiên đăng nhập
 * vừa thay đổi, để chúng cập nhật ngay mà không cần chuyển trang.
 * Header lắng nghe sự kiện 'camping-auth-changed' này.
 */
function notifyAuthChanged(): void {
  try {
    window.dispatchEvent(new Event('camping-auth-changed'))
  } catch {
    // Môi trường không có window (vd test SSR): bỏ qua.
  }
}
