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
 *
 * Lưu ý bảo mật (chưa xong, xem README.md): JWT chỉ lưu ở localStorage,
 * chưa có refresh token / httpOnly cookie; hash mật khẩu mẫu trong
 * camping.sql vẫn là PLACEHOLDER nên login tài khoản mẫu tạm dùng mật
 * khẩu demo '123456' (xem src/auth.js).
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./src/db');
const { MemoryStore } = require('./src/store');
const {
  calcOrder,
  normalizePaymentMethod,
  normalizeRegion,
} = require('./src/pricing');
const { applyProductFilters, publicUser } = require('./src/utils');
const {
  hashPassword,
  checkPassword,
  signToken,
  requireAuth,
  requireAdmin,
} = require('./src/auth');

const PORT = Number(process.env.PORT || 3001);
const store = new MemoryStore();
const app = express();

app.use(cors());
app.use(express.json());

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

app.post('/api/orders', async (req, res) => {
  const body = req.body || {};
  const customer_name = String(body.customer_name || '').trim();
  const phone = String(body.phone || '').replace(/[\s-]/g, '');
  const address = String(body.address || '').trim();
  const items = Array.isArray(body.items) ? body.items : [];
  const user_id = Number(body.user_id ?? NaN);
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

// --- 404 / khởi động --------------------------------------------------------

app.use('/api', (req, res) => {
  res.status(404).json({ error: `Không có endpoint ${req.method} ${req.path}.` });
});

async function start() {
  await db.initDb();
  app.listen(PORT, () => {
    console.log(`[api] Camping Shop API chạy tại http://localhost:${PORT}`);
    console.log(`[api] Chế độ: ${mode()}${mode() === 'fallback' ? ' (dữ liệu mẫu trong bộ nhớ)' : ''}`);
    console.log(`[api] Kiểm tra: curl http://localhost:${PORT}/api/health`);
  });
}

start();
