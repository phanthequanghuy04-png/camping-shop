/**
 * Camping Shop — Backend API, chế độ server dài hạn (node server.js).
 *
 * Toàn bộ app Express nằm trong src/app.js; file này chỉ khởi động
 * server HTTP sau khi nối DB. Trên Vercel serverless thì entry là
 * api/index.js (không dùng file này).
 */
require('dotenv').config();
const app = require('./src/app');
const db = require('./src/db');

const PORT = Number(process.env.PORT || 3001);

async function start() {
  await db.initDb();
  app.listen(PORT, () => {
    console.log(`[api] Camping Shop API chạy tại http://localhost:${PORT}`);
    console.log(`[api] Chế độ: ${db.isAvailable() ? 'mysql' : 'fallback'}`);
    console.log(`[api] Kiểm tra: curl http://localhost:${PORT}/api/health`);
  });
}

start();
