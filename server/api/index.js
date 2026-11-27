/**
 * Entry serverless cho Vercel: export trực tiếp app Express.
 * Vercel map file này thành function tại /api/index; vercel.json
 * rewrite mọi /api/* về đây. Kết nối DB được khởi động nền ngay khi
 * module load; middleware ensureDb trong src/app.js chờ tối đa 8s
 * cho lần kết nối đầu trước khi trả lời (tránh báo fallback oan).
 */
const db = require('../src/db');
const app = require('../src/app');

// Khởi động nối DB ngay khi function cold start (không await —
// request đầu tiên sẽ chờ qua middleware ensureDb nếu cần).
db.initDb();

module.exports = app;
