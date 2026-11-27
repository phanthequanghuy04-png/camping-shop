/**
 * Kết nối MySQL (DB `camping`). Nếu kết nối thất bại (MySQL chưa được
 * cài/chạy — luồng khác đang cài), server KHÔNG crash mà chuyển sang
 * chế độ FALLBACK: dùng dữ liệu mẫu trong bộ nhớ (src/seed.js).
 * Xem trạng thái tại GET /api/health (trường `mode`).
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

/**
 * Đọc cấu hình DB từ 2 dạng (ưu tiên DATABASE_URL khi có):
 * 1. DATABASE_URL=mysql://user:pass@host:port/db (Railway/TiDB/Northflank
 *    hay cấp dạng chuỗi kết nối; thêm ?ssl=true vào cuối URL nếu DB yêu
 *    cầu TLS, vd TiDB Cloud).
 * 2. Từng biến DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
 *    (+ DB_SSL=true để bật TLS).
 */
function parseDatabaseUrl(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'mysql:' && parsed.protocol !== 'mysql2:') {
    throw new Error('DATABASE_URL phải bắt đầu bằng mysql://');
  }
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
    ssl: parsed.searchParams.get('ssl') === 'true',
  };
}

let urlConfig = null;
if (process.env.DATABASE_URL) {
  urlConfig = parseDatabaseUrl(process.env.DATABASE_URL);
}

const useSsl = urlConfig
  ? urlConfig.ssl
  : process.env.DB_SSL === 'true';

const config = {
  // Ưu tiên Unix socket (MariaDB/MySQL local thường cho root đăng nhập
  // qua socket không mật khẩu, trong khi TCP root có thể bị từ chối).
  // Đặt DB_SOCKET_PATH=/var/run/mysqld/mysqld.sock trong .env để dùng.
  // (Bỏ qua socket khi dùng DATABASE_URL — URL luôn là TCP.)
  ...(urlConfig
    ? {
        host: urlConfig.host,
        port: urlConfig.port,
      }
    : process.env.DB_SOCKET_PATH
      ? { socketPath: process.env.DB_SOCKET_PATH }
      : {
          host: process.env.DB_HOST || '127.0.0.1',
          port: Number(process.env.DB_PORT || 3306),
        }),
  user: urlConfig
    ? urlConfig.user
    : process.env.DB_USER || 'root',
  password: urlConfig
    ? urlConfig.password
    : process.env.DB_PASSWORD || '',
  database: urlConfig
    ? urlConfig.database
    : process.env.DB_NAME || 'camping',
  // Trả DATE/DATETIME về dạng chuỗi ('2026-11-29', '2026-11-27 05:10:54')
  // thay vì đối tượng Date — tránh việc cột DATE estimated_delivery bị
  // lệch 1 ngày khi serialize sang UTC (vd '2026-11-29' thành
  // '2026-11-28T17:00:00.000Z'). Frontend vẫn new Date(...) bình thường.
  dateStrings: true,
  // Một số MySQL cloud (vd TiDB Cloud) bắt buộc TLS; Northflank MySQL
  // nội bộ thì không cần. Bật qua ?ssl=true (URL) hoặc DB_SSL=true.
  ...(useSsl ? { ssl: { rejectUnauthorized: true } } : {}),
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 2000,
};

let pool = null;
let available = false;
let lastError = null;

async function initDb() {
  try {
    pool = mysql.createPool(config);
    await pool.query('SELECT 1');
    available = true;
    lastError = null;
    console.log(
      `[db] MySQL OK — ${config.socketPath ? `socket ${config.socketPath}` : `${config.user}@${config.host}:${config.port}`}/${config.database}`,
    );
  } catch (err) {
    available = false;
    lastError = err.message;
    pool = null;
    console.warn(
      `[db] MySQL chưa kết nối được (${err.message}). ` +
        'Chạy ở chế độ FALLBACK (dữ liệu mẫu trong bộ nhớ). ' +
        'Cài/import xong MySQL thì khởi động lại server để dùng DB thật.',
    );
  }
  return available;
}

function isAvailable() {
  return available;
}

/** Pool thô (dùng cho transaction đặt hàng). null khi ở chế độ fallback. */
function getPool() {
  return pool;
}

function getLastError() {
  return lastError;
}

/** Chạy query khi DB sẵn sàng; ném lỗi khi đang ở chế độ fallback. */
async function query(sql, params = []) {
  if (!pool) throw new Error('MySQL chưa khả dụng (chế độ fallback)');
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = { initDb, isAvailable, getLastError, query, getPool };
