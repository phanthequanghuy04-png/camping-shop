/**
 * Camping Shop — Backend API (Node.js + Express).
 *
 * Nối app React (~/workspace/projects/camping-shop/app) với DB MySQL `camping`
 * (6 bảng trong camping.sql). Khi MySQL chưa chạy được, server tự chuyển
 * sang chế độ FALLBACK dùng dữ liệu mẫu trong bộ nhớ (src/seed.js) để
 * frontend vẫn gọi API được — xem GET /api/health (trường `mode`).
 *
 * Chạy:  npm install && cp .env.example .env && npm start   (cổng 3001)
 *
 * Endpoints:
 *   GET  /api/health
 *   GET  /api/categories
 *   GET  /api/products?q=&category=&sort=price_asc|price_desc
 *   GET  /api/products/:id
 *   POST /api/auth/register   { name, email, phone?, password }
 *   POST /api/auth/login      { email, password }
 *   GET  /api/cart?session_id= | ?user_id=
 *   POST /api/cart            { session_id? | user_id?, product_id, quantity }
 *   POST /api/cart/sync       { session_id? | user_id?, items: [{ product_id, quantity }] }
 *   DELETE /api/cart/:product_id?session_id= | ?user_id=
 *   POST /api/orders          { user_id?, session_id?, customer_name, phone, address, items, coupon_code?, payment_method? ('cod'|'bank_transfer'), shipping_region? ('hanoi'|'hcm'|'other') }
 *   GET  /api/orders?user_id=
 *   GET  /api/admin/orders    (Bearer JWT, role admin)
 *   PATCH /api/admin/orders/:id  { status?, payment_status?, tracking_code? } (Bearer JWT, role admin)
 *   GET  /api/admin/products  (Bearer JWT, role admin) — toàn bộ sản phẩm
 *   (kể cả Ẩn / Hết hàng) cho bảng quản trị.
 *   POST /api/admin/products  { name, price, quantity?, id_category, description?, image? (URL), image_data? (data URL PNG/WebP/JPEG đã tách nền) } (Bearer JWT, role admin) — thêm sản phẩm mới vào DB; ảnh tải lên được đẩy lên kho GitHub (cần GITHUB_TOKEN) rồi lưu tên file vào DB.
 *   PATCH /api/admin/products/:id  { name?, description?, id_category?, image? | image_data?, price?, quantity?, status? } (Bearer JWT, role admin) — sửa toàn bộ thông tin sản phẩm trong DB (tên, mô tả, danh mục, ảnh, giá, tồn kho, trạng thái 0 = Ẩn, 1 = Đang bán, 2 = Hết hàng).
 *   DELETE /api/admin/products/:id  (Bearer JWT, role admin) — XÓA HẲN sản phẩm khỏi database (kèm các dòng giỏ hàng của nó); sản phẩm đã có trong đơn hàng thì từ chối xóa để giữ lịch sử đơn — khi đó hãy dùng PATCH status = 0 (Ẩn).
 *
 * Lưu ý bảo mật (chưa xong, xem README.md): JWT chỉ lưu ở localStorage,
 * chưa có refresh token / httpOnly cookie; hash mật khẩu mẫu trong
 * camping.sql vẫn là PLACEHOLDER nên login tài khoản mẫu tạm dùng mật
 * khẩu demo '123456' (xem src/auth.js).
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const { MemoryStore } = require('./store');
const {
  calcOrder,
  normalizePaymentMethod,
  normalizeRegion,
} = require('./pricing');
const { applyProductFilters, publicUser } = require('./utils');
const {
  hashPassword,
  checkPassword,
  signToken,
  requireAuth,
  requireAdmin,
} = require('./auth');

const store = new MemoryStore();
const app = express();

app.use(cors());
// JSON 3 MB (mặc định chỉ 100 KB): ảnh sản phẩm tải lên kèm dạng base64
// (image_data) có thể tới ~2 MB nên cần nới giới hạn — vẫn trong mức
// 4,5 MB của Vercel serverless.
app.use(express.json({ limit: '3mb' }));

// API luôn trả dữ liệu mới nhất: /shop từng hiện giá/tồn kho cũ vài phút
// sau khi sửa ở quản trị do trình duyệt/CDN cache phản hồi GET (không có
// Cache-Control nên cache theo suy đoán). no-store tắt hẳn cache này.
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Serverless (Vercel): kết nối DB được khởi động nền khi module load;
// request đầu tiên chờ tối đa 8s để biết DB có lên được không (tránh
// trả fallback oan khi TiDB chỉ chậm vài giây). Hết 8s thì cứ trả lời
// bằng chế độ hiện tại (fallback nếu DB chưa lên).
function ensureDb(req, res, next) {
  if (db.isAvailable()) return next();
  Promise.race([
    db.initDb(),
    new Promise((resolve) => setTimeout(resolve, 8000)),
  ]).then(() => next());
}
app.use('/api', ensureDb);

// --- Helpers ---------------------------------------------------------------

function mode() {
  return db.isAvailable() ? 'mysql' : 'fallback';
}

function cartOwner(req, body = {}) {
  const user_id = Number(body.user_id ?? req.query.user_id ?? NaN);
  const session_id = body.session_id ?? req.query.session_id ?? null;
  return {
    user_id: Number.isInteger(user_id) && user_id > 0 ? user_id : null,
    session_id:
      typeof session_id === 'string' && session_id.trim()
        ? session_id.trim()
        : null,
  };
}

function requireCartOwner(req, res, body = {}) {
  const owner = cartOwner(req, body);
  if (!owner.user_id && !owner.session_id) {
    res.status(400).json({
      error: 'Cần user_id (đã đăng nhập) hoặc session_id (khách vãng lai).',
    });
    return null;
  }
  return owner;
}

async function fetchCategories() {
  if (db.isAvailable()) {
    return db.query('SELECT id, name FROM categories ORDER BY id ASC');
  }
  return store.getCategories();
}

async function fetchAllProducts() {
  if (db.isAvailable()) {
    const rows = await db.query(
      'SELECT id, name, image, price, quantity, status, id_category, description, rating, created_at FROM products ORDER BY id ASC',
    );
    // DECIMAL trả về dạng string qua mysql2 — ép về number cho khớp types.ts.
    return rows.map((p) => ({
      ...p,
      price: Number(p.price),
      rating: Number(p.rating),
    }));
  }
  return store.getProducts();
}

async function fetchProduct(id) {
  if (db.isAvailable()) {
    const rows = await db.query(
      'SELECT id, name, image, price, quantity, status, id_category, description, rating, created_at FROM products WHERE id = ?',
      [id],
    );
    if (!rows[0]) return null;
    return { ...rows[0], price: Number(rows[0].price), rating: Number(rows[0].rating) };
  }
  return store.getProduct(id);
}

async function fetchUserByEmail(email) {
  if (db.isAvailable()) {
    const rows = await db.query('SELECT * FROM users WHERE email = ?', [
      String(email).trim().toLowerCase(),
    ]);
    return rows[0] || null;
  }
  return store.findUserByEmail(email);
}

/** Gắn thông tin sản phẩm vào từng dòng giỏ (để frontend render trực tiếp). */
async function enrichCart(items) {
  const products = await fetchAllProducts();
  const byId = new Map(products.map((p) => [p.id, p]));
  return items.map((item) => ({
    ...item,
    product: byId.get(item.product_id) || null,
  }));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function isValidPhone(phone) {
  return /^\d{10}$/.test(String(phone || '').replace(/[\s-]/g, ''));
}

/** DECIMAL từ mysql2 trả về dạng string — ép các trường tiền về number. */
function normalizeOrderMoney(order) {
  order.total = Number(order.total);
  if (order.subtotal !== undefined && order.subtotal !== null) {
    order.subtotal = Number(order.subtotal);
  }
  if (order.discount_amount !== undefined && order.discount_amount !== null) {
    order.discount_amount = Number(order.discount_amount);
  }
  if (order.shipping_fee !== undefined && order.shipping_fee !== null) {
    order.shipping_fee = Number(order.shipping_fee);
  }
}

// --- Health / danh mục / sản phẩm ------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mode: mode(),
    db: db.isAvailable(),
    db_error: db.isAvailable() ? null : db.getLastError(),
    note:
      mode() === 'fallback'
        ? 'MySQL chưa kết nối được — API đang dùng dữ liệu mẫu trong bộ nhớ (camping.sql).'
        : 'Đang dùng DB MySQL `camping` thật.',
  });
});

app.get('/api/categories', async (req, res) => {
  try {
    res.json({ data: await fetchCategories() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const all = await fetchAllProducts();
    const data = applyProductFilters(all, {
      q: req.query.q,
      category: req.query.category,
      sort: req.query.sort,
    });
    res.json({ data, total: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'id sản phẩm không hợp lệ.' });
  }
  try {
    const product = await fetchProduct(id);
    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
    }
    return res.json({ data: product });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- Auth ------------------------------------------------------------------

app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập họ tên.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Email không hợp lệ.' });
  }
  if (phone && !isValidPhone(phone)) {
    return res.status(400).json({ error: 'Số điện thoại phải có đúng 10 chữ số.' });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
  }
  try {
    const existing = await fetchUserByEmail(email);
    if (existing) {
      return res
        .status(409)
        .json({ error: 'Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.' });
    }
    // Tài khoản đăng ký qua API luôn được hash bcrypt thật.
    const password_hash = await hashPassword(String(password));
    const cleanEmail = String(email).trim().toLowerCase();
    let user;
    if (db.isAvailable()) {
      const result = await db.query(
        'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [String(name).trim(), cleanEmail, phone ? String(phone).replace(/[\s-]/g, '') : null, password_hash, 'user'],
      );
      user = {
        id: result.insertId,
        name: String(name).trim(),
        email: cleanEmail,
        phone: phone || null,
        role: 'user',
      };
    } else {
      user = publicUser(
        store.createUser({
          name: String(name).trim(),
          email: cleanEmail,
          phone: phone || null,
          password_hash,
        }),
      );
    }
    return res.status(201).json({
      data: { user, token: signToken(user) },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ email và mật khẩu.' });
  }
  try {
    const user = await fetchUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }
    const { ok, demo } = await checkPassword(String(password), user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }
    const pub = publicUser(user);
    return res.json({
      data: { user: pub, token: signToken(pub) },
      // demo=true: tài khoản mẫu vẫn dùng mật khẩu demo vì hash trong DB
      // chưa phải hash bcrypt thật (xem src/auth.js).
      demo,
      warning: demo
        ? 'Tài khoản mẫu đang dùng mật khẩu demo vì password_hash trong DB chưa phải hash bcrypt thật.'
        : undefined,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- Giỏ hàng ---------------------------------------------------------------

app.get('/api/cart', async (req, res) => {
  const owner = requireCartOwner(req, res);
  if (!owner) return;
  try {
    let items;
    if (db.isAvailable()) {
      items = owner.user_id
        ? await db.query('SELECT * FROM cart_items WHERE user_id = ? ORDER BY id ASC', [owner.user_id])
        : await db.query('SELECT * FROM cart_items WHERE session_id = ? ORDER BY id ASC', [owner.session_id]);
    } else {
      items = store.getCart(owner);
    }
    return res.json({ data: await enrichCart(items) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cart', async (req, res) => {
  const owner = requireCartOwner(req, res, req.body || {});
  if (!owner) return;
  // addToCartApi gửi product_id (snake_case); chấp nhận cả productId.
  const product_id = Number(req.body?.product_id ?? req.body?.productId);
  const quantity = Math.floor(Number(req.body?.quantity ?? 1));
  if (!Number.isInteger(product_id) || quantity <= 0) {
    return res.status(400).json({ error: 'product_id / quantity không hợp lệ.' });
  }
  try {
    const product = await fetchProduct(product_id);
    if (!product || product.status !== 1) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại hoặc đã ngừng bán.' });
    }
    const capped = Math.min(quantity, product.quantity);
    if (capped <= 0) {
      return res.status(400).json({ error: 'Sản phẩm đã hết hàng.' });
    }
    let item;
    if (db.isAvailable()) {
      const existing = owner.user_id
        ? await db.query(
            'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
            [owner.user_id, product_id],
          )
        : await db.query(
            'SELECT * FROM cart_items WHERE session_id = ? AND product_id = ?',
            [owner.session_id, product_id],
          );
      if (existing[0]) {
        await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [capped, existing[0].id]);
        item = { ...existing[0], quantity: capped };
      } else {
        const result = await db.query(
          'INSERT INTO cart_items (user_id, session_id, product_id, quantity) VALUES (?, ?, ?, ?)',
          [owner.user_id, owner.session_id, product_id, capped],
        );
        item = { id: result.insertId, ...owner, product_id, quantity: capped };
      }
    } else {
      item = store.upsertCart({ ...owner, product_id, quantity: capped });
    }
    return res.json({ data: (await enrichCart([item]))[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** Đồng bộ toàn bộ giỏ từ frontend (CartContext gọi sau mỗi lần đổi giỏ). */
app.post('/api/cart/sync', async (req, res) => {
  const owner = requireCartOwner(req, res, req.body || {});
  if (!owner) return;
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
  try {
    const products = await fetchAllProducts();
    const byId = new Map(products.map((p) => [p.id, p]));
    const items = rawItems
      .map((it) => ({
        // Chấp nhận cả product_id (API) lẫn productId (CartItem frontend).
        product_id: Number(it.product_id ?? it.productId),
        quantity: Math.floor(Number(it.quantity ?? 0)),
      }))
      .filter(
        (it) =>
          Number.isInteger(it.product_id) &&
          it.quantity > 0 &&
          byId.has(it.product_id) &&
          byId.get(it.product_id).status === 1,
      )
      .map((it) => ({
        ...it,
        quantity: Math.min(it.quantity, byId.get(it.product_id).quantity || 0),
      }))
      .filter((it) => it.quantity > 0);
    if (db.isAvailable()) {
      if (owner.user_id) {
        await db.query('DELETE FROM cart_items WHERE user_id = ?', [owner.user_id]);
      } else {
        await db.query('DELETE FROM cart_items WHERE session_id = ?', [owner.session_id]);
      }
      for (const it of items) {
        await db.query(
          'INSERT INTO cart_items (user_id, session_id, product_id, quantity) VALUES (?, ?, ?, ?)',
          [owner.user_id, owner.session_id, it.product_id, it.quantity],
        );
      }
      const saved = owner.user_id
        ? await db.query('SELECT * FROM cart_items WHERE user_id = ? ORDER BY id ASC', [owner.user_id])
        : await db.query('SELECT * FROM cart_items WHERE session_id = ? ORDER BY id ASC', [owner.session_id]);
      return res.json({ data: await enrichCart(saved) });
    }
    return res.json({ data: await enrichCart(store.replaceCart({ ...owner, items })) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cart/:product_id', async (req, res) => {
  const owner = requireCartOwner(req, res);
  if (!owner) return;
  const product_id = Number(req.params.product_id);
  try {
    let removed;
    if (db.isAvailable()) {
      const result = owner.user_id
        ? await db.query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [owner.user_id, product_id])
        : await db.query('DELETE FROM cart_items WHERE session_id = ? AND product_id = ?', [owner.session_id, product_id]);
      removed = result.affectedRows > 0;
    } else {
      removed = store.removeCartItem({ ...owner, product_id });
    }
    return res.json({ data: { removed } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- Đơn hàng ---------------------------------------------------------------

// Đặt hàng cần đăng nhập: chỉ tài khoản đã đăng nhập mới được mua
// (frontend cũng chặn khách vãng lai ở giỏ / thanh toán).
app.post('/api/orders', requireAuth, async (req, res) => {
  const body = req.body || {};
  const customer_name = String(body.customer_name || '').trim();
  const phone = String(body.phone || '').replace(/[\s-]/g, '');
  const address = String(body.address || '').trim();
  const items = Array.isArray(body.items) ? body.items : [];
  // Lấy user_id từ token (đáng tin) thay vì body (khách tự khai).
  const user_id = Number(req.user?.id ?? NaN);
  const session_id =
    typeof body.session_id === 'string' && body.session_id.trim()
      ? body.session_id.trim()
      : null;

  if (!customer_name) return res.status(400).json({ error: 'Vui lòng nhập họ tên người nhận.' });
  if (!address) return res.status(400).json({ error: 'Vui lòng nhập địa chỉ giao hàng.' });
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'Số điện thoại phải có đúng 10 chữ số.' });
  }
  if (items.length === 0) {
    return res.status(400).json({ error: 'Giỏ hàng đang trống.' });
  }
  const cleanItems = items
    .map((it) => ({
      // Frontend gửi CartItem dạng { productId, quantity } (camelCase);
      // API cũng chấp nhận { product_id, quantity } (snake_case).
      product_id: Number(it.product_id ?? it.productId),
      quantity: Math.floor(Number(it.quantity ?? 0)),
    }))
    .filter((it) => Number.isInteger(it.product_id) && it.quantity > 0);
  if (cleanItems.length === 0) {
    return res.status(400).json({ error: 'Giỏ hàng đang trống.' });
  }

  try {
    // Kiểm tra tồn kho trước (cả 2 chế độ).
    const products = await fetchAllProducts();
    const byId = new Map(products.map((p) => [p.id, p]));
    for (const it of cleanItems) {
      const product = byId.get(it.product_id);
      if (!product || product.status !== 1) {
        return res.status(400).json({ error: `Sản phẩm #${it.product_id} không tồn tại hoặc đã ngừng bán.` });
      }
      if (it.quantity > product.quantity) {
        return res.status(400).json({
          error: `Sản phẩm "${product.name}" chỉ còn ${product.quantity} cái trong kho.`,
        });
      }
    }

    if (db.isAvailable()) {
      // Transaction: tạo đơn + order_items + trừ tồn kho, xong xóa giỏ.
      const pool = db.getPool();
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const subtotal = cleanItems.reduce(
          (sum, it) => sum + byId.get(it.product_id).price * it.quantity,
          0,
        );
        // Server tự tính giảm giá + phí ship + tổng cuối (không tin con số
        // client gửi lên) — xem src/pricing.js.
        const pricing = calcOrder({
          subtotal,
          coupon_code: body.coupon_code,
          shipping_region: body.shipping_region,
        });
        const payment_method = normalizePaymentMethod(body.payment_method);
        const [orderResult] = await conn.execute(
          'INSERT INTO orders (user_id, total, subtotal, discount_amount, coupon_code, shipping_fee, shipping_method, shipping_region, payment_method, payment_status, estimated_delivery, status, address, phone, customer_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            Number.isInteger(user_id) && user_id > 0 ? user_id : null,
            pricing.total,
            pricing.subtotal,
            pricing.discount_amount,
            pricing.coupon_code,
            pricing.shipping_fee,
            pricing.shipping_method,
            pricing.shipping_region,
            payment_method,
            'unpaid',
            pricing.estimated_delivery,
            'pending',
            address,
            phone,
            customer_name,
          ],
        );
        const orderId = orderResult.insertId;
        const savedItems = [];
        for (const it of cleanItems) {
          const product = byId.get(it.product_id);
          const [itemResult] = await conn.execute(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
            [orderId, it.product_id, it.quantity, product.price],
          );
          savedItems.push({
            id: itemResult.insertId,
            order_id: orderId,
            product_id: it.product_id,
            quantity: it.quantity,
            price: product.price,
          });
          await conn.execute(
            'UPDATE products SET quantity = quantity - ? WHERE id = ?',
            [it.quantity, it.product_id],
          );
        }
        if (Number.isInteger(user_id) && user_id > 0) {
          await conn.execute('DELETE FROM cart_items WHERE user_id = ?', [user_id]);
        } else if (session_id) {
          await conn.execute('DELETE FROM cart_items WHERE session_id = ?', [session_id]);
        }
        await conn.commit();
        return res.status(201).json({
          data: {
            id: orderId,
            user_id: Number.isInteger(user_id) && user_id > 0 ? user_id : null,
            subtotal: pricing.subtotal,
            discount_amount: pricing.discount_amount,
            coupon_code: pricing.coupon_code,
            shipping_fee: pricing.shipping_fee,
            shipping_method: pricing.shipping_method,
            shipping_region: pricing.shipping_region,
            payment_method,
            payment_status: 'unpaid',
            tracking_code: null,
            estimated_delivery: pricing.estimated_delivery,
            total: pricing.total,
            status: 'pending',
            address,
            phone,
            customer_name,
            created_at: new Date().toISOString(),
            items: savedItems,
          },
        });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    // Chế độ fallback: cùng logic trên kho trong bộ nhớ.
    const subtotal = cleanItems.reduce((sum, it) => {
      const product = byId.get(it.product_id);
      return sum + product.price * it.quantity;
    }, 0);
    const pricing = calcOrder({
      subtotal,
      coupon_code: body.coupon_code,
      shipping_region: body.shipping_region,
    });
    const order = store.createOrder({
      user_id: Number.isInteger(user_id) && user_id > 0 ? user_id : null,
      customer_name,
      phone,
      address,
      items: cleanItems,
      subtotal: pricing.subtotal,
      discount_amount: pricing.discount_amount,
      coupon_code: pricing.coupon_code,
      shipping_fee: pricing.shipping_fee,
      shipping_method: pricing.shipping_method,
      shipping_region: pricing.shipping_region,
      payment_method: normalizePaymentMethod(body.payment_method),
      payment_status: 'unpaid',
      estimated_delivery: pricing.estimated_delivery,
    });
    store.clearCart({
      user_id: Number.isInteger(user_id) && user_id > 0 ? user_id : null,
      session_id,
    });
    return res.status(201).json({ data: order });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** Đơn của 1 user (dùng cho trang cá nhân sau này). */
app.get('/api/orders', async (req, res) => {
  const user_id = Number(req.query.user_id);
  if (!Number.isInteger(user_id) || user_id <= 0) {
    return res.status(400).json({ error: 'Cần user_id hợp lệ.' });
  }
  try {
    let orders;
    if (db.isAvailable()) {
      orders = await db.query(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC',
        [user_id],
      );
      for (const order of orders) {
        order.items = (
          await db.query('SELECT * FROM order_items WHERE order_id = ?', [
            order.id,
          ])
        ).map((item) => ({ ...item, price: Number(item.price) }));
        normalizeOrderMoney(order);
      }
    } else {
      orders = store
        .getOrders()
        .filter((o) => o.user_id === user_id)
        .map((o) => ({ ...o, items: store.getOrderItems(o.id) }));
    }
    return res.json({ data: orders });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- Admin -----------------------------------------------------------------

// Ảnh tải lên từ thiết bị (đã tách nền sẵn): giới hạn 2 MB sau khi giải
// mã base64 — ảnh sản phẩm WebP trong suốt thường chỉ 30–150 KB.
const MAX_UPLOAD_IMAGE_BYTES = 2 * 1024 * 1024;
const GITHUB_REPO =
  process.env.GITHUB_REPO || 'phanthequanghuy04-png/camping-shop';

/** Tên file an toàn từ tên sản phẩm: bỏ dấu, chỉ giữ a-z 0-9 và gạch nối. */
function slugifyFileName(name) {
  const slug = String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return slug || 'san-pham';
}

/**
 * Đẩy ảnh lên kho GitHub (app/public/images/) qua REST API để web tĩnh
 * phục vụ được file. Cần GITHUB_TOKEN: fine-grained PAT, quyền Contents
 * Read and write trên repo camping-shop (xem server/.env.example).
 * File mới commit lên main sẽ kích hoạt workflow Pages deploy (~1 phút)
 * rồi ảnh mới hiện — xem cờ image_pending_deploy ở endpoint dưới.
 */
async function uploadImageToGitHub(fileName, base64) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    const err = new Error(
      'Chưa cấu hình GITHUB_TOKEN trên server nên không tải được ảnh lên kho. Hãy dán link ảnh có sẵn (ô "link ảnh") hoặc cấu hình token rồi thử lại.',
    );
    err.status = 503;
    throw err;
  }
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/app/public/images/${fileName}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'camping-shop-api',
      },
      body: JSON.stringify({
        message: `Them anh san pham: ${fileName}`,
        content: base64,
        branch: 'main',
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(
      `Tải ảnh lên GitHub thất bại (HTTP ${res.status}). ${text.slice(0, 200)}`,
    );
    err.status = 502;
    throw err;
  }
}

/**
 * Xử lý ảnh sản phẩm gửi lên — dùng chung cho POST thêm mới và PATCH sửa:
 * - body.image_data: data URL PNG/WebP/JPEG -> đẩy lên kho GitHub, trả
 *   '/images/<file>' + imagePendingDeploy = true (ảnh chỉ hiện sau khi
 *   Pages deploy xong, ~1 phút).
 * - body.image: URL hoặc '/images/...' (<= 250 ký tự) -> dùng nguyên.
 * - Không gửi gì -> { image: null } (POST: sản phẩm không ảnh; PATCH:
 *   giữ nguyên ảnh cũ — chỉ ghi đè khi có ảnh mới).
 * Lỗi định dạng / quá lớn / chưa có token -> throw { status, message }
 * để endpoint bắt bằng catch chung (trả đúng mã lỗi + thông báo).
 */
async function resolveProductImage(body, name) {
  if (typeof body.image_data === 'string' && body.image_data.trim() !== '') {
    const m = body.image_data
      .trim()
      .match(/^data:(image\/(png|webp|jpeg));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) {
      const err = new Error(
        'Ảnh tải lên không đúng định dạng (chỉ nhận PNG/WebP/JPEG dạng data URL).',
      );
      err.status = 400;
      throw err;
    }
    const ext = m[2] === 'jpeg' ? 'jpg' : m[2];
    const base64 = m[3];
    const buf = Buffer.from(base64, 'base64');
    if (buf.length === 0 || buf.length > MAX_UPLOAD_IMAGE_BYTES) {
      const err = new Error(
        `Ảnh quá lớn (tối đa ${MAX_UPLOAD_IMAGE_BYTES / 1024 / 1024} MB sau khi tải lên).`,
      );
      err.status = 400;
      throw err;
    }
    const fileName = `${slugifyFileName(name)}-${Date.now()}.${ext}`;
    await uploadImageToGitHub(fileName, base64);
    return { image: `/images/${fileName}`, imagePendingDeploy: true };
  }
  if (typeof body.image === 'string' && body.image.trim() !== '') {
    const url = body.image.trim();
    if (url.length > 250) {
      const err = new Error('Link ảnh quá dài (tối đa 250 ký tự).');
      err.status = 400;
      throw err;
    }
    return { image: url, imagePendingDeploy: false };
  }
  return { image: null, imagePendingDeploy: false };
}

app.get('/api/admin/orders', requireAuth, requireAdmin, async (req, res) => {
  try {
    let orders;
    if (db.isAvailable()) {
      orders = await db.query('SELECT * FROM orders ORDER BY id DESC');
      for (const order of orders) {
        order.items = (
          await db.query('SELECT * FROM order_items WHERE order_id = ?', [
            order.id,
          ])
        ).map((item) => ({ ...item, price: Number(item.price) }));
        normalizeOrderMoney(order);
      }
    } else {
      orders = store
        .getOrders()
        .map((o) => ({ ...o, items: store.getOrderItems(o.id) }));
    }
    return res.json({ data: orders, total: orders.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin cập nhật đơn: đổi trạng thái (pending → paid → shipped → done),
 * đánh dấu đã nhận tiền (payment_status paid — khi khách chuyển khoản),
 * nhập mã vận đơn (tracking_code). Chỉ admin (JWT) mới gọi được.
 */
app.patch('/api/admin/orders/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id đơn hàng không hợp lệ.' });
  }
  const body = req.body || {};
  const patch = {};
  const validStatuses = ['pending', 'paid', 'shipped', 'done', 'cancelled'];
  if (body.status !== undefined) {
    if (!validStatuses.includes(body.status)) {
      return res.status(400).json({ error: 'Trạng thái đơn không hợp lệ.' });
    }
    patch.status = body.status;
  }
  if (body.payment_status !== undefined) {
    if (!['unpaid', 'paid'].includes(body.payment_status)) {
      return res.status(400).json({ error: 'Trạng thái thanh toán không hợp lệ.' });
    }
    patch.payment_status = body.payment_status;
  }
  if (body.tracking_code !== undefined) {
    const code = String(body.tracking_code).trim();
    if (code.length > 100) {
      return res.status(400).json({ error: 'Mã vận đơn quá dài.' });
    }
    patch.tracking_code = code || null;
  }
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'Không có gì để cập nhật.' });
  }
  try {
    if (db.isAvailable()) {
      const sets = [];
      const values = [];
      for (const [key, value] of Object.entries(patch)) {
        sets.push(`${key} = ?`);
        values.push(value);
      }
      values.push(id);
      const result = await db.query(
        `UPDATE orders SET ${sets.join(', ')} WHERE id = ?`,
        values,
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
      }
      const rows = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
      const order = rows[0];
      order.items = (
        await db.query('SELECT * FROM order_items WHERE order_id = ?', [id])
      ).map((item) => ({ ...item, price: Number(item.price) }));
      normalizeOrderMoney(order);
      return res.json({ data: order });
    }
    const updated = store.updateOrder(id, patch);
    if (!updated) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
    }
    return res.json({
      data: { ...updated, items: store.getOrderItems(id) },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin thêm sản phẩm mới: lưu vào DB `products` để hiện ngay trên cửa
 * hàng cho mọi khách (khác với form cũ chỉ lưu localStorage trên trình
 * duyệt của admin). Chỉ admin (JWT) mới gọi được.
 *
 * Ảnh — 2 cách (ưu tiên image_data):
 * - image_data: data URL ảnh tải lên từ thiết bị (PNG/WebP/JPEG, đã
 *   tách nền sẵn; phía client đã cắt lề trong suốt thừa + nén WebP).
 *   Server đẩy file lên kho GitHub rồi lưu `/images/<tên file>` vào DB.
 *   Ảnh mới hiện sau ~1 phút (chờ Pages deploy) — trả kèm cờ
 *   image_pending_deploy để client báo cho admin biết.
 * - image: link URL ảnh có sẵn (https://…) hoặc đường dẫn /images/…
 *   thì lưu thẳng vào DB, không cần token GitHub.
 * Không có ảnh thì image = null.
 */
/**
 * Admin xem toàn bộ sản phẩm (kể cả Ẩn / Hết hàng) cho bảng quản trị.
 * Khác với GET /api/products (chỉ trả Đang bán + Hết hàng): bảng quản trị
 * cần thấy cả sản phẩm đã ẩn để hiện lại hoặc xóa hẳn.
 */
app.get('/api/admin/products', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!db.isAvailable()) {
      return res
        .status(503)
        .json({ error: 'Database chưa sẵn sàng, thử lại sau.' });
    }
    const rows = await db.query(
      'SELECT id, name, image, price, quantity, status, id_category, description, rating, created_at FROM products ORDER BY id ASC',
    );
    for (const p of rows) {
      p.price = Number(p.price);
      p.rating = Number(p.rating);
    }
    return res.json({ data: rows, total: rows.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/products', requireAuth, requireAdmin, async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const price = Number(body.price);
  const quantity =
    body.quantity === undefined || body.quantity === ''
      ? 0
      : Number(body.quantity);
  const categoryId = Number(body.id_category);
  const description =
    body.description === undefined || body.description === null
      ? null
      : String(body.description).trim() || null;
  if (!name) {
    return res.status(400).json({ error: 'Vui lòng nhập tên sản phẩm.' });
  }
  if (name.length > 250) {
    return res
      .status(400)
      .json({ error: 'Tên sản phẩm quá dài (tối đa 250 ký tự).' });
  }
  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ error: 'Giá phải là số lớn hơn 0.' });
  }
  if (!Number.isInteger(quantity) || quantity < 0) {
    return res
      .status(400)
      .json({ error: 'Tồn kho phải là số nguyên và không được âm.' });
  }
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return res.status(400).json({ error: 'Danh mục không hợp lệ.' });
  }
  if (description !== null && description.length > 5000) {
    return res.status(400).json({ error: 'Mô tả quá dài.' });
  }
  try {
    if (!db.isAvailable()) {
      return res
        .status(503)
        .json({ error: 'Database chưa sẵn sàng, thử lại sau.' });
    }
    const cats = await db.query('SELECT id FROM categories WHERE id = ?', [
      categoryId,
    ]);
    if (!cats[0]) {
      return res.status(400).json({ error: 'Danh mục không tồn tại.' });
    }
    const { image, imagePendingDeploy } = await resolveProductImage(
      body,
      name,
    );
    const result = await db.query(
      'INSERT INTO products (name, image, price, quantity, status, id_category, description, rating) VALUES (?, ?, ?, ?, 1, ?, ?, 4.5)',
      [name, image, price, quantity, categoryId, description],
    );
    const rows = await db.query(
      'SELECT id, name, image, price, quantity, status, id_category, description, rating, created_at FROM products WHERE id = ?',
      [result.insertId],
    );
    const product = rows[0];
    product.price = Number(product.price);
    product.rating = Number(product.rating);
    if (imagePendingDeploy) product.image_pending_deploy = true;
    return res.status(201).json({ data: product });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

/**
 * Admin sửa sản phẩm: đổi tên, mô tả, danh mục, ảnh, giá, tồn kho, trạng
 * thái (hiện/ẩn/hết hàng). Chỉ admin (JWT) mới gọi được. Chỉ cập nhật
 * các trường gửi lên; giá trị khác giữ nguyên. Ảnh mới gửi dạng
 * image_data (data URL, đẩy lên kho GitHub như lúc thêm mới) hoặc image
 * (URL / '/images/...'). Trả về sản phẩm sau khi sửa.
 */
app.patch('/api/admin/products/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id sản phẩm không hợp lệ.' });
  }
  const body = req.body || {};
  const patch = {};
  const hasNewImage =
    (typeof body.image_data === 'string' &&
      body.image_data.trim() !== '') ||
    (typeof body.image === 'string' && body.image.trim() !== '');
  if (body.name !== undefined) {
    const name = String(body.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Vui lòng nhập tên sản phẩm.' });
    }
    if (name.length > 250) {
      return res
        .status(400)
        .json({ error: 'Tên sản phẩm quá dài (tối đa 250 ký tự).' });
    }
    patch.name = name;
  }
  if (body.description !== undefined) {
    const description =
      body.description === null
        ? null
        : String(body.description).trim() || null;
    if (description !== null && description.length > 5000) {
      return res.status(400).json({ error: 'Mô tả quá dài.' });
    }
    patch.description = description;
  }
  if (body.id_category !== undefined) {
    const categoryId = Number(body.id_category);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ error: 'Danh mục không hợp lệ.' });
    }
    patch.id_category = categoryId;
  }
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ error: 'Giá phải là số và không được âm.' });
    }
    patch.price = price;
  }
  if (body.quantity !== undefined) {
    const quantity = Number(body.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      return res
        .status(400)
        .json({ error: 'Tồn kho phải là số nguyên và không được âm.' });
    }
    patch.quantity = quantity;
  }
  if (body.status !== undefined) {
    // Trạng thái: 0 = Ẩn, 1 = Đang bán, 2 = Hết hàng.
    if (
      body.status !== 0 &&
      body.status !== 1 &&
      body.status !== 2 &&
      body.status !== '0' &&
      body.status !== '1' &&
      body.status !== '2'
    ) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
    }
    patch.status = Number(body.status);
  }
  if (Object.keys(patch).length === 0 && !hasNewImage) {
    return res.status(400).json({ error: 'Không có gì để cập nhật.' });
  }
  try {
    if (!db.isAvailable()) {
      return res
        .status(503)
        .json({ error: 'Database chưa sẵn sàng, thử lại sau.' });
    }
    // Lấy tên hiện tại (để đặt tên file ảnh mới khi không đổi tên) và
    // kiểm tra sản phẩm có tồn tại trước khi xử lý ảnh/danh mục.
    const existing = await db.query(
      'SELECT name FROM products WHERE id = ?',
      [id],
    );
    if (!existing[0]) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
    }
    if (patch.id_category !== undefined) {
      const cats = await db.query('SELECT id FROM categories WHERE id = ?', [
        patch.id_category,
      ]);
      if (!cats[0]) {
        return res.status(400).json({ error: 'Danh mục không tồn tại.' });
      }
    }
    let imagePendingDeploy = false;
    if (hasNewImage) {
      const resolved = await resolveProductImage(
        body,
        patch.name ?? existing[0].name,
      );
      patch.image = resolved.image;
      imagePendingDeploy = resolved.imagePendingDeploy;
    }
    const sets = [];
    const values = [];
    for (const [key, value] of Object.entries(patch)) {
      sets.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id);
    const result = await db.query(
      `UPDATE products SET ${sets.join(', ')} WHERE id = ?`,
      values,
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
    }
    const rows = await db.query(
      'SELECT id, name, image, price, quantity, status, id_category, description, rating, created_at FROM products WHERE id = ?',
      [id],
    );
    const product = rows[0];
    product.price = Number(product.price);
    product.rating = Number(product.rating);
    if (imagePendingDeploy) product.image_pending_deploy = true;
    return res.json({ data: product });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

/**
 * Admin XÓA HẲN sản phẩm khỏi database. Chỉ admin (JWT) mới gọi được.
 * - Sản phẩm đã có trong đơn hàng (order_items) thì TỪ CHỐI xóa để giữ
 *   lịch sử đơn — khi đó hãy ẩn bằng PATCH status = 0.
 * - Các dòng giỏ hàng (cart_items) của sản phẩm bị xóa theo, tránh mồ côi.
 * - Trả về { data: { id } } — frontend loại sản phẩm khỏi bảng.
 */
app.delete('/api/admin/products/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id sản phẩm không hợp lệ.' });
  }
  try {
    if (!db.isAvailable()) {
      return res
        .status(503)
        .json({ error: 'Database chưa sẵn sàng, thử lại sau.' });
    }
    const inOrders = await db.query(
      'SELECT COUNT(*) AS n FROM order_items WHERE product_id = ?',
      [id],
    );
    if (Number(inOrders[0]?.n ?? 0) > 0) {
      return res.status(400).json({
        error:
          'Sản phẩm đã có trong đơn hàng, không thể xóa hẳn để giữ lịch sử đơn. Hãy dùng Ẩn / Ngừng bán để giấu khỏi cửa hàng.',
      });
    }
    await db.query('DELETE FROM cart_items WHERE product_id = ?', [id]);
    const result = await db.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
    }
    return res.json({ data: { id } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- 404 -------------------------------------------------------------------

app.use('/api', (req, res) => {
  res.status(404).json({ error: `Không có endpoint ${req.method} ${req.path}.` });
});

// Entry serverless (Vercel api/index.js) require file này và export app;
// chế độ server dài hạn (node server.js) khởi động trong server.js.
module.exports = app;
