/**
 * Kho dữ liệu FALLBACK (bộ nhớ) — dùng khi MySQL chưa chạy được.
 * Cùng hình dạng với 6 bảng trong camping.sql; khi DB thật sẵn sàng,
 * server.js dùng MySQL thay cho store này (xem src/db.js).
 */
const seed = require('./seed');

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

class MemoryStore {
  constructor() {
    this.categories = clone(seed.categories);
    this.products = clone(seed.products);
    this.users = clone(seed.users);
    this.orders = clone(seed.orders);
    this.orderItems = clone(seed.orderItems);
    this.cartItems = clone(seed.cartItems);
    this.nextUserId = 3;
    this.nextOrderId = 3;
    this.nextOrderItemId = 5;
    this.nextCartId = 2;
  }

  getCategories() {
    return clone(this.categories);
  }

  getProducts() {
    return clone(this.products);
  }

  getProduct(id) {
    const found = this.products.find((p) => p.id === id);
    return found ? clone(found) : null;
  }

  findUserByEmail(email) {
    const normalized = String(email).trim().toLowerCase();
    const found = this.users.find(
      (u) => u.email.toLowerCase() === normalized,
    );
    return found ? clone(found) : null;
  }

  createUser({ name, email, phone, password_hash }) {
    const user = {
      id: this.nextUserId++,
      name,
      email,
      phone: phone || null,
      password_hash,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    this.users.push(clone(user));
    return clone(user);
  }

  getCart({ user_id, session_id }) {
    return clone(
      this.cartItems.filter((item) => {
        if (user_id) return item.user_id === user_id;
        if (session_id) return item.session_id === session_id;
        return false;
      }),
    );
  }

  upsertCart({ user_id, session_id, product_id, quantity }) {
    const found = this.cartItems.find(
      (item) =>
        item.product_id === product_id &&
        (user_id ? item.user_id === user_id : item.session_id === session_id),
    );
    if (found) {
      found.quantity = quantity;
      return clone(found);
    }
    const item = {
      id: this.nextCartId++,
      user_id: user_id || null,
      session_id: session_id || null,
      product_id,
      quantity,
    };
    this.cartItems.push(clone(item));
    return clone(item);
  }

  replaceCart({ user_id, session_id, items }) {
    this.cartItems = this.cartItems.filter((item) =>
      user_id ? item.user_id !== user_id : item.session_id !== session_id,
    );
    const saved = items.map((it) => {
      const item = {
        id: this.nextCartId++,
        user_id: user_id || null,
        session_id: session_id || null,
        product_id: it.product_id,
        quantity: it.quantity,
      };
      this.cartItems.push(clone(item));
      return clone(item);
    });
    return saved;
  }

  removeCartItem({ user_id, session_id, product_id }) {
    const before = this.cartItems.length;
    this.cartItems = this.cartItems.filter(
      (item) =>
        !(
          item.product_id === product_id &&
          (user_id ? item.user_id === user_id : item.session_id === session_id)
        ),
    );
    return this.cartItems.length < before;
  }

  clearCart({ user_id, session_id }) {
    this.cartItems = this.cartItems.filter((item) =>
      user_id ? item.user_id !== user_id : item.session_id !== session_id,
    );
  }

  createOrder({
    user_id,
    customer_name,
    phone,
    address,
    items,
    subtotal,
    discount_amount,
    coupon_code,
    shipping_fee,
    shipping_method,
    shipping_region,
    payment_method,
    payment_status,
    estimated_delivery,
  }) {
    // items đã được kiểm tra tồn kho trước khi gọi (xem server.js).
    // subtotal/discount/shipping đã tính sẵn ở server.js (src/pricing.js);
    // ở đây chỉ cộng dồn để dự phòng khi gọi trực tiếp không có breakdown.
    let computedSubtotal = 0;
    const orderId = this.nextOrderId++;
    const savedItems = items.map((it) => {
      const product = this.products.find((p) => p.id === it.product_id);
      computedSubtotal += product.price * it.quantity;
      const saved = {
        id: this.nextOrderItemId++,
        order_id: orderId,
        product_id: it.product_id,
        quantity: it.quantity,
        price: product.price,
      };
      this.orderItems.push(clone(saved));
      return clone(saved);
    });
    for (const it of items) {
      const product = this.products.find((p) => p.id === it.product_id);
      product.quantity -= it.quantity;
    }
    const finalSubtotal = typeof subtotal === 'number' ? subtotal : computedSubtotal;
    const finalDiscount = typeof discount_amount === 'number' ? discount_amount : 0;
    const finalShipping = typeof shipping_fee === 'number' ? shipping_fee : 0;
    const order = {
      id: orderId,
      user_id: user_id || null,
      subtotal: finalSubtotal,
      discount_amount: finalDiscount,
      coupon_code: coupon_code || null,
      shipping_fee: finalShipping,
      shipping_method: shipping_method || 'standard',
      shipping_region: shipping_region || 'other',
      payment_method: payment_method || 'cod',
      payment_status: payment_status || 'unpaid',
      tracking_code: null,
      estimated_delivery: estimated_delivery || null,
      total: finalSubtotal - finalDiscount + finalShipping,
      status: 'pending',
      address: address || null,
      phone: phone || null,
      customer_name: customer_name || null,
      created_at: new Date().toISOString(),
    };
    this.orders.push(clone(order));
    return { ...clone(order), items: savedItems };
  }

  /** Admin cập nhật đơn (trạng thái / đã thanh toán / mã vận đơn). */
  updateOrder(id, patch) {
    const order = this.orders.find((o) => o.id === id);
    if (!order) return null;
    const allowed = ['status', 'payment_status', 'tracking_code'];
    for (const key of allowed) {
      if (patch[key] !== undefined) order[key] = patch[key];
    }
    return clone(order);
  }

  getOrders() {
    return clone(this.orders).sort((a, b) => b.id - a.id);
  }

  getOrderItems(orderId) {
    return clone(this.orderItems.filter((i) => i.order_id === orderId));
  }
}

module.exports = { MemoryStore };
