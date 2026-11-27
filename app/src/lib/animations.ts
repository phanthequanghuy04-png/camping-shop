/**
 * Animation cho website bán đồ cắm trại (camping-shop).
 *
 * Engine chính: **GSAP + Lenis** (cuộn mượt + hiệu ứng cuộn).
 * **AOS** chỉ lo hiệu ứng hiện dần khi cuộn tới (fade/slide/zoom).
 *
 * Quy tắc của dự án:
 * - KHÔNG dùng Barba.js — app dùng React Router, chuyển trang do router lo.
 * - Chỉ dùng 1 engine animation chính là GSAP + Lenis.
 * - KHÔNG import tĩnh `gsap` / `lenis` / `aos` ở đầu file. Cả 3 đều được
 *   import động trong `try/catch`, nên app vẫn chạy (chỉ mất hiệu ứng)
 *   khi package chưa được cài. Agent tích hợp cài package theo
 *   `_staging/animation.md` rồi mới chạy `npm run build`.
 *
 * Phiên bản theo kit web-tools-kit (27/11/2026):
 * gsap 3.15.1 — lenis 1.3.29 — aos 2.3.4 (+ `@types/aos` cho TypeScript).
 */

/* ------------------------------------------------------------------ */
/* Kiểu tối thiểu cho 3 thư viện (chỉ mô tả đúng phần code này dùng).  */
/* Dùng kiểu riêng thay vì kiểu gốc để file vẫn đọc được khi lib      */
/* chưa cài; khi đã cài, dynamic import được ép kiểu qua `unknown`.    */
/* ------------------------------------------------------------------ */

export interface InitAnimationsOptions {
  /** Bật/tắt Lenis smooth scroll. Mặc định: true. */
  smoothScroll?: boolean;
  /** Bật/tắt AOS. Mặc định: true. */
  aos?: boolean;
  /** Thời gian hiệu ứng AOS (ms). Mặc định: 700. */
  aosDuration?: number;
  /** Độ "trôi" của Lenis — càng nhỏ càng mượt/trôi. Mặc định: 0.1. */
  lerp?: number;
}

export interface RevealOptions {
  /** Vị trí bắt đầu hiệu ứng của ScrollTrigger, vd. 'top 85%'. Mặc định: 'top 85%'. */
  start?: string;
  /** Độ trượt dọc ban đầu (px). Mặc định: 40. */
  y?: number;
  /** Độ mờ ban đầu (0 = trong suốt). Mặc định: 0. */
  opacity?: number;
  /** Thời gian hiệu ứng (giây). Mặc định: 0.8. */
  duration?: number;
  /** Độ trễ giữa các phần tử liên tiếp (giây). Mặc định: 0.08. */
  stagger?: number;
}

interface LenisLike {
  raf: (time: number) => void;
  destroy: () => void;
  on: (event: 'scroll', callback: () => void) => void;
  stop: () => void;
  start: () => void;
  scrollTo: (target: number, options?: { immediate?: boolean }) => void;
}

interface ScrollTriggerLike {
  update: () => void;
  refresh: () => void;
}

interface GsapTickerLike {
  add: (callback: (time: number) => void) => void;
  remove: (callback: (time: number) => void) => void;
  lagSmoothing: (value: number) => void;
}

interface GsapTweenLike {
  kill: () => void;
}

interface GsapLike {
  registerPlugin: (...plugins: unknown[]) => void;
  ticker: GsapTickerLike;
  utils: {
    toArray: <T>(target: string) => T[];
  };
  fromTo: (
    targets: unknown,
    fromVars: Record<string, unknown>,
    toVars: Record<string, unknown>,
  ) => GsapTweenLike;
}

interface AosOptions {
  duration?: number;
  once?: boolean;
  mirror?: boolean;
  offset?: number;
  easing?: string;
}

interface AosLike {
  init: (options?: AosOptions) => void;
  refresh: () => void;
  refreshHard: () => void;
}

/* ------------------------------------------------------------------ */
/* Trạng thái nội bộ (module-level, dùng chung cho cả app).            */
/* ------------------------------------------------------------------ */

let lenisInstance: LenisLike | null = null;
let gsapInstance: GsapLike | null = null;
let scrollTriggerInstance: ScrollTriggerLike | null = null;
let aosInstance: AosLike | null = null;
let rafId: number | null = null;
let gsapTickerCallback: ((time: number) => void) | null = null;
let revealTweens: GsapTweenLike[] = [];
let initialized = false;
/** Token chống race khi React StrictMode gọi effect 2 lần (init -> cleanup -> init). */
let initToken = 0;
/** Tôn trọng "Reduce motion" của hệ điều hành / trình duyệt. */
let reducedMotion = false;

/* ------------------------------------------------------------------ */
/* Khởi tạo                                                           */
/* ------------------------------------------------------------------ */

/**
 * Khởi tạo toàn bộ animation của trang. Gọi 1 lần trong `useEffect`
 * của `App.tsx` (xem `_staging/animation.md`).
 *
 * Thứ tự: Lenis -> GSAP + ScrollTrigger (nối với Lenis) -> AOS.
 * Thư viện nào chưa cài thì chỉ bị bỏ qua (kèm cảnh báo console),
 * các thư viện còn lại vẫn chạy bình thường.
 */
export async function initAnimations(
  options: InitAnimationsOptions = {},
): Promise<void> {
  const {
    smoothScroll = true,
    aos: useAos = true,
    aosDuration = 700,
    lerp = 0.1,
  } = options;

  if (typeof window === 'undefined') return;
  if (initialized) return;
  initialized = true;

  const token = ++initToken;
  /** Init này còn hiệu lực không (chưa bị cleanup hủy giữa chừng). */
  const stillCurrent = () => token === initToken;

  reducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Lenis — cuộn mượt. Bỏ qua nếu người dùng bật Reduce motion.
  if (smoothScroll && !reducedMotion) {
    try {
      const { default: Lenis } = await import('lenis');
      if (!stillCurrent()) return;
      lenisInstance = new Lenis({
        lerp,
        smoothWheel: true,
      }) as unknown as LenisLike;
    } catch (error) {
      console.warn(
        '[animations] Chưa cài lenis — bỏ qua smooth scroll. Cài bằng: npm install lenis',
        error,
      );
      lenisInstance = null;
    }
  }

  // 2. GSAP + ScrollTrigger — engine animation chính.
  try {
    const gsapModule = await import('gsap');
    const scrollTriggerModule = await import('gsap/ScrollTrigger');
    if (!stillCurrent()) return;

    const gsap = (gsapModule.default ??
      gsapModule.gsap) as unknown as GsapLike;
    const ScrollTrigger = (scrollTriggerModule.default ??
      scrollTriggerModule.ScrollTrigger) as unknown as ScrollTriggerLike;

    gsap.registerPlugin(ScrollTrigger as unknown);
    gsapInstance = gsap;
    scrollTriggerInstance = ScrollTrigger;

    if (lenisInstance) {
      // Đồng bộ Lenis với ScrollTrigger (cách làm chuẩn của GSAP + Lenis).
      lenisInstance.on('scroll', () => {
        scrollTriggerInstance?.update();
      });
      // Để GSAP ticker lái Lenis thay cho vòng requestAnimationFrame riêng.
      gsapTickerCallback = (time: number) => {
        lenisInstance?.raf(time * 1000);
      };
      gsap.ticker.add(gsapTickerCallback);
      gsap.ticker.lagSmoothing(0);
    }
  } catch (error) {
    console.warn(
      '[animations] Chưa cài gsap — bỏ qua hiệu ứng GSAP / ScrollTrigger. Cài bằng: npm install gsap',
      error,
    );
    gsapInstance = null;
    scrollTriggerInstance = null;
  }

  // 3. Vòng requestAnimationFrame riêng cho Lenis, chỉ khi không có GSAP lái.
  if (lenisInstance && !gsapTickerCallback) {
    const raf = (time: number) => {
      lenisInstance?.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
  }

  // 4. AOS — hiệu ứng hiện khi cuộn tới.
  if (useAos) {
    try {
      const aosModule = await import('aos');
      // CSS của AOS — Vite tự chèn vào trang khi import động chạy.
      await import('aos/dist/aos.css');
      if (!stillCurrent()) return;

      const AOS = (aosModule.default ?? aosModule) as unknown as AosLike;
      // Hiệu ứng chỉ chạy 1 lần duy nhất khi phần tử vào khung nhìn
      // (sửa 2026-11-27, theo ý tưởng của Huy: tránh làm đi làm lại
      // khi cuộn):
      // - once: true — chạy xong thì thôi, cuộn ngược lên hay xuống
      //   lại cũng không chạy lại, phần tử cứ hiện nguyên.
      // - mirror: false — không mờ đi khi cuộn qua khỏi phần tử.
      //   (Trước đây là once: false + mirror: true nên hiệu ứng chạy
      //   lại mỗi lần vào khung nhìn; Huy chọn chỉ chạy 1 lần.)
      AOS.init({
        duration: reducedMotion ? 0 : aosDuration,
        once: true,
        mirror: false,
        offset: 80,
        easing: 'ease-out',
      });
      aosInstance = AOS;
    } catch (error) {
      console.warn(
        '[animations] Chưa cài aos — bỏ qua hiệu ứng hiện khi cuộn. Cài bằng: npm install aos',
        error,
      );
      aosInstance = null;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Helper                                                             */
/* ------------------------------------------------------------------ */

/**
 * Hiệu ứng hiện dần khi cuộn tới cho các phần tử khớp `selector`
 * (dùng GSAP + ScrollTrigger, chỉ chạy 1 lần duy nhất khi vào khung
 * nhìn — sửa 2026-11-27 theo ý tưởng của Huy, tránh làm đi làm lại
 * khi cuộn; trước đây toggleActions 'play none none reverse' nên
 * cuộn ra khỏi khung nhìn thì chạy ngược để lần sau hiện lại).
 *
 * Ví dụ: `revealOnScroll('.reveal')`, `revealOnScroll('.product-card')`.
 *
 * Lưu ý:
 * - Gọi SAU `await initAnimations()` để GSAP đã sẵn sàng.
 * - KHÔNG cần ẩn phần tử trước bằng CSS (GSAP tự đặt trạng thái ban
 *   đầu khi tạo tween). Nhờ vậy, nếu GSAP chưa cài thì nội dung vẫn
 *   hiện bình thường thay vì bị ẩn vĩnh viễn.
 * - Nếu GSAP chưa có, hàm chỉ hiện phần tử ngay và thoát êm.
 */
export function revealOnScroll(
  selector: string,
  options: RevealOptions = {},
): void {
  if (typeof window === 'undefined') return;

  const {
    start = 'top 85%',
    y = 40,
    opacity = 0,
    duration = 0.8,
    stagger = 0.08,
  } = options;

  const elements = document.querySelectorAll<HTMLElement>(selector);
  if (elements.length === 0) return;

  // Không có GSAP (chưa cài / init lỗi) -> hiện nội dung ngay, không ẩn.
  if (!gsapInstance || !scrollTriggerInstance || reducedMotion) {
    elements.forEach((el) => {
      el.style.opacity = '1';
    });
    return;
  }

  const gsap = gsapInstance;
  gsap.utils.toArray<HTMLElement>(selector).forEach((el, index) => {
    const tween = gsap.fromTo(
      el,
      { y, opacity },
      {
        y: 0,
        opacity: 1,
        duration,
        delay: index * stagger,
        ease: 'power3.out',
        // Vào khung nhìn thì chạy 1 lần rồi thôi — cuộn ra hay cuộn
        // lại cũng không chạy ngược, phần tử cứ hiện nguyên (giống
        // AOS với once: true ở trên).
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: 'play none none none',
        },
      },
    );
    revealTweens.push(tween);
  });
}

/**
 * Tính lại vị trí trigger sau khi nội dung / route thay đổi.
 * App dùng React Router nên cần gọi hàm này mỗi khi đổi trang
 * (xem `_staging/animation.md`), nếu không AOS / ScrollTrigger
 * vẫn giữ vị trí cũ và hiệu ứng có thể không chạy.
 */
export function refreshAnimations(): void {
  aosInstance?.refresh();
  scrollTriggerInstance?.refresh();
}

/**
 * Cuộn ngay về đầu trang khi đổi route (vd bấm vào 1 sản phẩm để mở
 * trang chi tiết). React Router không tự cuộn lên đầu, nên không có
 * hàm này trang mới sẽ giữ nguyên vị trí cuộn của trang cũ — bấm sản
 * phẩm ở cuối danh sách thì trang chi tiết mở ra đã nằm tít dưới phần
 * "Sản phẩm liên quan". Dùng Lenis.scrollTo khi có Lenis (cuộn mượt
 * sẽ không giật), không thì window.scrollTo.
 */
export function scrollToTop(): void {
  if (typeof window === 'undefined') return;
  if (lenisInstance) {
    try {
      lenisInstance.scrollTo(0, { immediate: true });
      return;
    } catch {
      // Rơi xuống window.scrollTo bên dưới.
    }
  }
  window.scrollTo(0, 0);
}

/**
 * Dọn dẹp toàn bộ animation: hủy tween của `revealOnScroll`, dừng
 * vòng lặp Lenis / GSAP ticker, hủy instance Lenis.
 * Gọi trong hàm cleanup của `useEffect` trong `App.tsx`.
 * Sau cleanup có thể gọi lại `initAnimations()` bình thường.
 */
export function cleanupAnimations(): void {
  // Vô hiệu hóa các lần init đang chạy dở (tránh race với StrictMode).
  initToken++;

  revealTweens.forEach((tween) => {
    tween.kill();
  });
  revealTweens = [];

  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (gsapInstance && gsapTickerCallback) {
    gsapInstance.ticker.remove(gsapTickerCallback);
    gsapTickerCallback = null;
  }

  lenisInstance?.destroy();
  lenisInstance = null;
  gsapInstance = null;
  scrollTriggerInstance = null;
  aosInstance = null;
  initialized = false;
}
