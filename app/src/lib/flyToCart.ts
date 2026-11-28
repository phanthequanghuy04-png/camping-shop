/* Lucian UX/UI Prompt #442 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#442
   Ảnh bay vào giỏ: bản sao ảnh sản phẩm (56px) bay theo đường cong bezier
   13 khung hình, 720ms, cubic-bezier(.45,0,.55,1), scale 1 -> 0.34,
   xoay 24 độ; tới nơi thì nút giỏ lắc nhẹ + badge nảy lên.
   Người dùng bật prefers-reduced-motion (hoặc trình duyệt không có WAAPI)
   thì bỏ qua hiệu ứng bay, gọi onDone ngay. */

/** Bay ảnh từ phần tử nguồn tới nút giỏ ở header (#header-cart-button).
   Nếu header đang ẩn (người dùng cuộn xuống sâu, .site-header.is-hide =
   translateY(-110%)) thì nút giỏ đang ở NGOÀI khung nhìn: đo thẳng rect
   của nó sẽ cho điểm đích âm, ảnh bay vọt lên khỏi màn hình và Huy thấy
   như không có animation (lỗi báo 2026-11-28). Cách sửa: hiện header lại
   rồi bay tới vị trí CUỐI của nút (rect hiện tại + độ dịch còn lại của
   header, đọc từ transform để đúng cả khi header đang trượt dở). Ảnh bay
   720ms chạy song song với header trượt vào (0.38s) nên hạ cánh đúng lúc
   nút giỏ vừa hiện ra. Header cứ để hiện sau đó — lần cuộn xuống tiếp
   theo effect cuộn sẽ ẩn lại như thường (lệch state nhất thời là lành,
   tự hết sau một lần đổi hướng cuộn). */
export function flyToCart(
  imageSrc: string,
  sourceEl: HTMLElement | null,
  onDone?: () => void,
): void {
  const done = () => {
    if (onDone) onDone()
  }
  // Hiện header lại nếu đang ẩn, trả về độ dịch dọc còn lại (px) để cộng
  // vào điểm đích — 0 khi header đã hiện.
  const revealHeader = (): number => {
    const header = document.querySelector('.site-header')
    if (!header) return 0
    const transform = getComputedStyle(header).transform
    let shiftY = 0
    if (transform && transform !== 'none') {
      const m = transform.match(/matrix(?:3d)?\(([^)]+)\)/)
      if (m) {
        const vals = m[1].split(',').map(Number)
        // matrix: ty là phần tử thứ 6; matrix3d: thứ 14.
        const ty = vals.length === 16 ? vals[13] : vals[5]
        if (Number.isFinite(ty)) shiftY = -ty
      }
    }
    if (shiftY !== 0) header.classList.remove('is-hide')
    return shiftY
  }
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const target = document.getElementById('header-cart-button')
  if (reduced || !target || !sourceEl || !Element.prototype.animate) {
    // Vẫn hiện header để cái lắc/badge nảy sau đó nhìn thấy được.
    revealHeader()
    bumpCartBadge()
    done()
    return
  }

  const shiftY = revealHeader()
  const from = sourceEl.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  const sx = from.left + from.width / 2 - 28
  // Kẹp điểm bắt đầu >= 0: khi thẻ đã cuộn nửa ra khỏi đầu trang thì
  // tâm ảnh nằm trên khung nhìn — không kẹp, ảnh bắt đầu bay từ ngoài
  // màn hình và nửa đầu đường bay vô hình.
  const sy = Math.max(0, from.top + from.height / 2 - 28)
  const ex = to.left + to.width / 2 - 28
  const ey = to.top + to.height / 2 - 28 + shiftY
  const cx = (sx + ex) / 2 - 20
  // Điểm điều khiển cong lên trên; kẹp >= 0 để đường bay không vọt khỏi
  // mép trên khung nhìn — khi thẻ đang ở gần đầu trang (sy nhỏ) mà cong
  // -90px thì ảnh bay ra ngoài màn hình giữa chừng, Huy chỉ thấy nó lóe
  // lên lúc hạ cánh nên tưởng không có animation.
  const cy = Math.max(0, Math.min(sy, ey) - 90)

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
