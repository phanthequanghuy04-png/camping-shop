-- Migration 001 — thanh toán + giao hàng cho bảng orders (2026-11-27).
-- Dùng cho DB `camping` ĐÃ import camping.sql cũ (chưa có các cột mới).
-- DB import mới từ camping.sql đã có sẵn các cột này thì KHÔNG cần chạy file này.
-- Chạy: mysql -h <HOST> -P <PORT> -u <USER> -p camping < 001-orders-payments-shipping.sql

ALTER TABLE orders
  ADD COLUMN subtotal DECIMAL(12,0) NOT NULL DEFAULT 0 AFTER total,
  ADD COLUMN discount_amount DECIMAL(12,0) NOT NULL DEFAULT 0 AFTER subtotal,
  ADD COLUMN coupon_code VARCHAR(20) NULL AFTER discount_amount,
  ADD COLUMN shipping_fee DECIMAL(12,0) NOT NULL DEFAULT 0 AFTER coupon_code,
  ADD COLUMN shipping_method VARCHAR(20) NOT NULL DEFAULT 'standard' AFTER shipping_fee,
  ADD COLUMN shipping_region VARCHAR(20) NULL AFTER shipping_method,
  ADD COLUMN payment_method VARCHAR(20) NOT NULL DEFAULT 'cod' AFTER shipping_region,
  ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' AFTER payment_method,
  ADD COLUMN tracking_code VARCHAR(100) NULL AFTER payment_status,
  ADD COLUMN estimated_delivery DATE NULL AFTER tracking_code,
  ADD CONSTRAINT chk_orders_payment_method CHECK (payment_method IN ('cod', 'bank_transfer')),
  ADD CONSTRAINT chk_orders_payment_status CHECK (payment_status IN ('unpaid', 'paid'));
