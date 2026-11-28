import { Link } from 'react-router-dom'
import { formatVND, useCart } from '../context/CartContext'
import { resolveImage } from '../data/products'

export default function CartPage() {
  const { detailedItems, updateQty, removeFromCart, totalQty, totalPrice } =
    useCart()

  if (detailedItems.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-5xl" aria-hidden="true">
          🛒
        </p>
        <h1 className="mt-4 text-2xl font-bold text-emerald-900 sm:text-3xl">
          Giỏ hàng của bạn đang trống
        </h1>
        <p className="mt-3 text-gray-600">
          Bạn chưa thêm sản phẩm nào vào giỏ. Hãy khám phá đồ cắm trại và
          chọn món đồ ưng ý nhé!
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800"
        >
          Tiếp tục mua sắm
        </Link>
      </main>
    )
  }

  return (
    <main className="cart-page mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-emerald-900 sm:text-3xl">
        Giỏ hàng ({totalQty} sản phẩm)
      </h1>

      <ul className="mt-6 space-y-4">
        {detailedItems.map((item) => (
          <li
            key={item.productId}
            className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
          >
            {item.product?.image ? (
              <img
                src={resolveImage(item.product.image)}
                alt={item.product.name}
                className="h-24 w-24 shrink-0 rounded-lg bg-white object-contain"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-3xl">
                ⛺
              </div>
            )}

            <div className="min-w-0 flex-1">
              {item.product ? (
                <Link
                  to={`/product/${item.product.id}`}
                  className="cart-name font-semibold text-gray-900 hover:text-emerald-700 hover:underline"
                >
                  {item.product.name}
                </Link>
              ) : (
                <p className="font-semibold text-gray-900">
                  Sản phẩm #{item.productId}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formatVND(item.unitPrice)} / sản phẩm
              </p>
              {!item.product && (
                <p className="mt-1 text-sm text-amber-600">
                  Sản phẩm này hiện không còn trong danh mục.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="flex items-center rounded-lg border border-gray-300">
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  onClick={() => updateQty(item.productId, item.quantity - 1)}
                  className="px-3 py-1.5 text-lg font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                  disabled={item.quantity <= 1}
                >
                  −
                </button>
                <span
                  className="cart-qty w-10 text-center font-medium"
                  aria-label="Số lượng"
                >
                  {item.quantity}
                </span>
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  onClick={() => updateQty(item.productId, item.quantity + 1)}
                  className="px-3 py-1.5 text-lg font-bold text-gray-700 hover:bg-gray-100"
                >
                  +
                </button>
              </div>

              <p className="w-28 text-right font-semibold text-emerald-800">
                {formatVND(item.subtotal)}
              </p>

              <button
                type="button"
                onClick={() => removeFromCart(item.productId)}
                className="rounded-lg px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:underline"
              >
                Xóa
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-gray-600">Tổng cộng ({totalQty} sản phẩm)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">
            {formatVND(totalPrice)}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Phí vận chuyển sẽ được tính ở bước đặt hàng.
          </p>
        </div>
        <Link
          to="/checkout"
          className="btn-white mt-4 inline-block rounded-lg bg-emerald-700 px-6 py-3 text-center font-medium text-white hover:bg-emerald-800 sm:mt-0"
        >
          Tiến hành thanh toán
        </Link>
      </div>
    </main>
  )
}
