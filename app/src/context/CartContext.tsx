import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { products } from '../data/products'
import { getSessionUser } from '../data/users'
import type { CartItem, Product } from '../data/types'
import {
  getCartApi,
  isApiAvailable,
  syncCartApi,
} from '../lib/api'

/**
 * Key lưu giỏ hàng trong localStorage — MỖI TÀI KHOẢN MỘT GIỎ RIÊNG
 * ('camping-cart-<userId>'); khách vãng lai dùng key chung 'camping-cart'
 * (sau bản chặn khách thêm giỏ thì key này luôn trống). Đăng xuất thì
 * clearSession() (data/users.ts) dọn key chung, nên giỏ sau đăng xuất
 * luôn trống, không còn đồ của tài khoản cũ; đăng nhập lại thì giỏ riêng
 * của tài khoản đó vẫn còn nguyên.
 */
export const CART_STORAGE_KEY = 'camping-cart'

/** Key giỏ của tài khoản đang đăng nhập (null = khách vãng lai). */
export function cartKeyFor(userId: number | null): string {
  return userId ? `${CART_STORAGE_KEY}-${userId}` : CART_STORAGE_KEY
}

/** Định dạng tiền VND: 2.890.000 ₫ */
export function formatVND(value: number): string {
  return `${value.toLocaleString('vi-VN')} ₫`
}

/** Một dòng giỏ đã gắn kèm thông tin sản phẩm (để trang Giỏ hàng / Thanh toán render trực tiếp). */
export interface DetailedCartItem {
  product: Product | null
  productId: number
  quantity: number
  /** Giá 1 đơn vị; 0 khi sản phẩm chưa có trong products.ts (dữ liệu do agent tích hợp điền sau). */
  unitPrice: number
  subtotal: number
}

export interface CartContextValue {
  /** Các dòng giỏ thô, khớp kiểu CartItem trong types.ts ({ productId, quantity }). */
  items: CartItem[]
  /** Các dòng giỏ kèm thông tin sản phẩm + thành tiền từng dòng. */
  detailedItems: DetailedCartItem[]
  addToCart: (productId: number, qty?: number) => void
  removeFromCart: (productId: number) => void
  updateQty: (productId: number, qty: number) => void
  clearCart: () => void
  /** Tổng số lượng sản phẩm trong giỏ. */
  totalQty: number
  /** Tổng tiền (tính từ giá trong products.ts). */
  totalPrice: number
  /**
   * Ngăn giỏ trượt (#240 Lucian): mở/đóng + id món vừa thêm (để nhấp nháy).
   * Header mở ngăn khi bấm nút giỏ; ProductCard mở ngăn sau hiệu ứng bay.
   */
  isDrawerOpen: boolean
  flashProductId: number | null
  openDrawer: (flashProductId?: number) => void
  closeDrawer: () => void
  /**
   * true khi backend API đang trả lời (giỏ đã được đồng bộ lên server).
   * false = đang dùng localStorage thuần (API chưa chạy / fetch lỗi).
   */
  apiAvailable: boolean
}

const CartContext = createContext<CartContextValue | null>(null)

function loadCartFromKey(key: string): CartItem[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (item): item is CartItem =>
          typeof item === 'object' &&
          item !== null &&
          Number.isInteger((item as CartItem).productId) &&
          Number.isInteger((item as CartItem).quantity) &&
          (item as CartItem).quantity > 0,
      )
      .map((item) => ({ productId: item.productId, quantity: item.quantity }))
  } catch {
    return []
  }
}

/** Giỏ của tài khoản đang đăng nhập (khách vãng lai: key chung). */
function loadCart(): CartItem[] {
  return loadCartFromKey(cartKeyFor(getSessionUser()?.id ?? null))
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)
  // Key giỏ đang dùng (đổi khi đăng nhập/đăng xuất — xem effect cuối file).
  const cartKeyRef = useRef<string>(cartKeyFor(getSessionUser()?.id ?? null))
  // API: đồng bộ giỏ lên server khi chạy được, localStorage vẫn là gốc
  // (fallback khi fetch lỗi — xem app/src/lib/api.ts).
  const [apiAvailable, setApiAvailable] = useState(false)
  // Cờ: chỉ đồng bộ lên server sau khi đã nạp giỏ server lần đầu.
  const [hydratedFromApi, setHydratedFromApi] = useState(false)
  // Số hiệu lần kéo giỏ server gần nhất: tránh lần kéo cũ (đăng nhập
  // rồi đăng xuất nhanh) ghi đè giỏ mới.
  const hydrateGenRef = useRef(0)

  // Ngăn giỏ trượt (#240 Lucian): mở khi bấm nút giỏ ở header hoặc khi
  // vừa thêm món (kèm id món mới để nhấp nháy); đóng thì xóa flash.
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [flashProductId, setFlashProductId] = useState<number | null>(null)
  const openDrawer = useCallback((flashId?: number) => {
    setFlashProductId(typeof flashId === 'number' ? flashId : null)
    setIsDrawerOpen(true)
  }, [])
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false)
    setFlashProductId(null)
  }, [])

  // Lưu giỏ xuống localStorage mỗi khi giỏ thay đổi (vào key của tài
  // khoản đang đăng nhập — xem cartKeyRef).
  useEffect(() => {
    try {
      localStorage.setItem(cartKeyRef.current, JSON.stringify(items))
    } catch {
      // localStorage đầy / bị chặn: giỏ vẫn dùng được trong phiên hiện tại.
    }
  }, [items])

  // Kéo giỏ từ API rồi gộp với giỏ local (lấy max số lượng từng món,
  // chặn theo tồn kho). Lỗi -> giữ nguyên giỏ local.
  const hydrateFromApi = useCallback(async (userId: number | null) => {
    const gen = ++hydrateGenRef.current
    try {
      if (!(await isApiAvailable())) return
      const serverItems = await getCartApi(userId)
      if (gen !== hydrateGenRef.current) return
      setApiAvailable(true)
      if (serverItems.length > 0) {
        setItems((prev) => {
          const merged = new Map<number, number>()
          for (const item of prev) merged.set(item.productId, item.quantity)
          for (const item of serverItems) {
            merged.set(
              item.product_id,
              Math.max(merged.get(item.product_id) ?? 0, item.quantity),
            )
          }
          return [...merged.entries()].map(([productId, quantity]) => {
            const product = products.find((p) => p.id === productId)
            return {
              productId,
              quantity:
                product && product.quantity > 0
                  ? Math.min(quantity, product.quantity)
                  : quantity,
            }
          })
        })
      }
    } catch {
      // API lỗi: giữ giỏ local, không báo lỗi chặn người dùng.
    } finally {
      if (gen === hydrateGenRef.current) setHydratedFromApi(true)
    }
  }, [])

  // Lần đầu mở trang: kéo giỏ server của tài khoản hiện tại.
  useEffect(() => {
    void hydrateFromApi(getSessionUser()?.id ?? null)
  }, [hydrateFromApi])

  // Đổi tài khoản (đăng nhập / đăng xuất): đổi sang giỏ của tài khoản mới.
  // Đăng xuất -> key khách đã được clearSession() dọn nên giỏ trống;
  // đăng nhập -> giỏ riêng của tài khoản đó (local) + kéo giỏ server gộp.
  useEffect(() => {
    const onAuthChanged = () => {
      const userId = getSessionUser()?.id ?? null
      const nextKey = cartKeyFor(userId)
      if (nextKey === cartKeyRef.current) return
      cartKeyRef.current = nextKey
      setItems(loadCartFromKey(nextKey))
      if (userId) void hydrateFromApi(userId)
    }
    window.addEventListener('camping-auth-changed', onAuthChanged)
    return () =>
      window.removeEventListener('camping-auth-changed', onAuthChanged)
  }, [hydrateFromApi])

  // Giỏ đổi -> đồng bộ lên server (debounce 800ms, best-effort).
  useEffect(() => {
    if (!hydratedFromApi || !apiAvailable) return
    const timer = window.setTimeout(() => {
      const userId = getSessionUser()?.id ?? null
      void syncCartApi(userId, items).catch(() => {
        // Đồng bộ lỗi: giỏ local vẫn đúng, lần đổi sau sẽ thử lại.
        setApiAvailable(false)
      })
    }, 800)
    return () => window.clearTimeout(timer)
  }, [items, hydratedFromApi, apiAvailable])

  const addToCart = useCallback((productId: number, qty = 1) => {
    const amount = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1
    setItems((prev) => {
      const product = products.find((p) => p.id === productId)
      const existing = prev.find((item) => item.productId === productId)
      const nextQty = (existing?.quantity ?? 0) + amount
      // Không cho vượt quá tồn kho (khi products.ts đã có dữ liệu).
      const cappedQty =
        product && product.quantity > 0
          ? Math.min(nextQty, product.quantity)
          : nextQty
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: cappedQty }
            : item,
        )
      }
      return [...prev, { productId, quantity: cappedQty }]
    })
  }, [])

  const removeFromCart = useCallback((productId: number) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId))
  }, [])

  const updateQty = useCallback((productId: number, qty: number) => {
    const nextQty = Math.floor(qty)
    setItems((prev) => {
      if (nextQty <= 0) {
        return prev.filter((item) => item.productId !== productId)
      }
      const product = products.find((p) => p.id === productId)
      const cappedQty =
        product && product.quantity > 0
          ? Math.min(nextQty, product.quantity)
          : nextQty
      return prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: cappedQty }
          : item,
      )
    })
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  // Lắng nghe custom event 'add-to-cart' từ ProductCard (trang khác):
  // window.dispatchEvent(new CustomEvent('add-to-cart',
  //   { detail: { productId: 1, quantity: 2 } }))
  // hoặc detail là số id sản phẩm: { detail: 1 }.
  // Đồng bộ giỏ giữa các tab qua sự kiện 'storage'.
  useEffect(() => {
    const onAddToCart = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail
      if (typeof detail === 'number') {
        addToCart(detail, 1)
        return
      }
      if (typeof detail === 'object' && detail !== null) {
        const { productId, quantity } = detail as {
          productId?: unknown
          quantity?: unknown
        }
        if (typeof productId === 'number') {
          addToCart(
            productId,
            typeof quantity === 'number' ? quantity : 1,
          )
        }
      }
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === cartKeyRef.current)
        setItems(loadCartFromKey(cartKeyRef.current))
    }
    window.addEventListener('add-to-cart', onAddToCart)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('add-to-cart', onAddToCart)
      window.removeEventListener('storage', onStorage)
    }
  }, [addToCart])

  const value = useMemo<CartContextValue>(() => {
    const detailedItems: DetailedCartItem[] = items.map((item) => {
      const product = products.find((p) => p.id === item.productId) ?? null
      const unitPrice = product ? product.price : 0
      return {
        product,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal: unitPrice * item.quantity,
      }
    })
    return {
      items,
      detailedItems,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      totalQty: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: detailedItems.reduce((sum, item) => sum + item.subtotal, 0),
      isDrawerOpen,
      flashProductId,
      openDrawer,
      closeDrawer,
      apiAvailable,
    }
  }, [
    items,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    isDrawerOpen,
    flashProductId,
    openDrawer,
    closeDrawer,
    apiAvailable,
  ])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

/**
 * Hook dùng giỏ hàng trong mọi trang.
 * Ném lỗi rõ ràng nếu quên bọc <CartProvider> — agent tích hợp cần bọc
 * <CartProvider> quanh <App /> trong App.tsx (file này không thuộc
 * phạm vi sửa của task hiện tại nên chưa bọc ở đây).
 */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error(
      'useCart phải được dùng bên trong <CartProvider>. Hãy bọc <CartProvider> quanh <App /> trong App.tsx.',
    )
  }
  return ctx
}
