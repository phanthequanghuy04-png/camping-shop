/**
 * Xác thực: bcrypt + JWT.
 *
 * TÌNH TRẠNG DEMO (cập nhật 27/11/2026): hash trong camping.sql và DB
 * hiện là hash bcrypt thật (cost 10) của mật khẩu demo mới (xem DEPLOY.md
 * mục 1). Login tài khoản mẫu nay đi qua bcrypt và trả `demo: false`.
 * Nhánh fallback dưới đây chỉ còn tác dụng khi gặp hash placeholder /
 * không đúng dạng bcrypt.
 * Tài khoản đăng ký mới QUA API luôn được hash bcrypt thật bằng bcryptjs.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PLACEHOLDER_HASH } = require('./seed');

const DEMO_PASSWORD = '123456';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me-camping-shop';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function isRealBcryptHash(hash) {
  return (
    typeof hash === 'string' &&
    /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash) &&
    hash !== PLACEHOLDER_HASH
  );
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Kiểm tra mật khẩu. Trả về { ok, demo } — demo=true nghĩa là đã dùng
 * mật khẩu demo vì hash trong DB chưa phải hash thật.
 */
async function checkPassword(password, hash) {
  if (isRealBcryptHash(hash)) {
    return { ok: await bcrypt.compare(password, hash), demo: false };
  }
  // Hash placeholder / chưa có hash thật: tạm chấp nhận mật khẩu demo.
  return { ok: password === DEMO_PASSWORD, demo: true };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/** Middleware: yêu cầu Bearer token, gắn req.user. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Chưa đăng nhập (thiếu token).' });
  }
  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

/** Middleware: chỉ admin (dùng sau requireAuth). */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res
      .status(403)
      .json({ error: 'Chỉ tài khoản admin mới được xem đơn hàng.' });
  }
  return next();
}

module.exports = {
  DEMO_PASSWORD,
  hashPassword,
  checkPassword,
  signToken,
  requireAuth,
  requireAdmin,
};
