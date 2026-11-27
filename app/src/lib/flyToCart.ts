/* Lucian UX/UI Prompt #442 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#442
   Ảnh bay vào giỏ: bản sao ảnh sản phẩm (56px) bay theo đường cong bezier
   13 khung hình, 720ms, cubic-bezier(.45,0,.55,1), scale 1 -> 0.34,
   xoay 24 độ; tới nơi thì nút giỏ lắc nhẹ + badge nảy lên.
   Người dùng bật prefers-reduced-motion (hoặc trình duyệt không có WAAPI)
   thì bỏ qua hiệu ứng bay, gọi onDone ngay. */

/** Bay ảnh từ phần tử nguồn tới nút giỏ ở header (#header-cart-button). */
export function flyToCart(
  imageSrc: string,
  sourceEl: HTMLElement | null,
  onDone?: () => void,
): void {
  const done = () => {
    if (onDone) onDone()
  }
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const target = document.getElementById('header-cart-button')
  if (reduced || !target || !sourceEl || !Element.prototype.animate) {
    bumpCartBadge()
    done()
    return
  }

  const from = sourceEl.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  const sx = from.left + from.width / 2 - 28
  const sy = from.top + from.height / 2 - 28
  const ex = to.left + to.width / 2 - 28
  const ey = to.top + to.height / 2 - 28
  const cx = (sx + ex) / 2 - 20
  const cy = Math.min(sy, ey) - 90

  const fly = document.createElement('span')
  fly.className = 'u442-fly'
  fly.setAttribute('aria-hidden', 'true')
  const img = document.createElement('img')
  img.src = imageSrc
  img.alt = ''
  fly.appendChild(img)
  document.body.appendChild(fly)

  const frames: Keyframe[] = []
  for (let i = 0; i <= 12; i++) {
    const t = i / 12
    const u = 1 - t
    const x = u * u * sx + 2 * u * t * cx + t * t * ex
    const y = u * u * sy + 2 * u * t * cy + t * t * ey
    frames.push({
      transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(1 - t * 0.66).toFixed(3)}) rotate(${(t * 24).toFixed(1)}deg)`,
      opacity: t > 0.92 ? 0 : 1,
      offset: t,
    })
  }
  const animation = fly.animate(frames, {
    duration: 720,
    easing: 'cubic-bezier(.45,0,.55,1)',
    fill: 'forwards',
  })
  animation.onfinish = () => {
    fly.remove()
    bumpCartBadge()
    done()
  }
  animation.oncancel = () => {
    fly.remove()
    done()
  }
}

/** Lắc nút giỏ + nảy badge (gọi cả khi bỏ qua hiệu ứng bay). */
export function bumpCartBadge(): void {
  const target = document.getElementById('header-cart-button')
  if (!target) return
  target.classList.remove('is-hit')
  void target.offsetWidth
  target.classList.add('is-hit')
  const badge = target.querySelector('.cart-badge')
  if (badge) {
    badge.classList.remove('is-bump')
    void badge.getBoundingClientRect()
    badge.classList.add('is-bump')
  }
  window.setTimeout(() => target.classList.remove('is-hit'), 700)
}
