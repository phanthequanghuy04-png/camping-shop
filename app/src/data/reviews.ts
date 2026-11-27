/**
 * Dữ liệu đánh giá MẪU cho component ReviewFilter (Lucian #261).
 *
 * LƯU Ý: đây là dữ liệu mẫu để hiển thị giao diện — chưa phải đánh giá
 * thật của khách. Khi có backend đánh giá (điểm trung bình, danh sách
 * đánh giá thật theo từng sản phẩm), thay getReviewsForProduct() bằng
 * gọi API và giữ nguyên interface Review bên dưới.
 *
 * Nội dung viết chung chung về đồ cắm trại (chất vải, đường may, khóa
 * kéo, chống nước, trọng lượng, giao hàng, đóng gói) để dùng được cho
 * mọi sản phẩm; không nhắc tên riêng một món nào.
 */

export interface Review {
  id: string
  productId: number
  author: string
  stars: 1 | 2 | 3 | 4 | 5
  /** Ngày đánh giá, định dạng dd/mm/yyyy. */
  date: string
  title?: string
  text: string
  /** Số lượt "Hữu ích" ban đầu (chưa tính lượt bấm của người xem). */
  helpful: number
}

/** Pool gốc: 12 đánh giá — 6×5 sao, 4×4 sao, 1×3 sao, 1×2 sao. */
const POOL: Array<Omit<Review, 'productId'>> = [
  {
    id: 'r01',
    author: 'Minh Anh',
    stars: 5,
    date: '12/11/2026',
    title: 'Đúng như mô tả, dùng rất ưng',
    text: 'Vải dày dặn, đường may chắc chắn, khóa kéo mượt. Đi Đà Lạt gặp mưa nhẹ cả buổi mà đồ bên trong vẫn khô ráo. Đóng gói cẩn thận, giao nhanh hơn dự kiến 1 ngày.',
    helpful: 24,
  },
  {
    id: 'r02',
    author: 'Quốc Bảo',
    stars: 5,
    date: '08/11/2026',
    title: 'Nhẹ mà chắc, gấp gọn dễ mang',
    text: 'Mang leo núi 2 ngày không thấy nặng vai. Gấp lại chỉ bằng một chai nước 1 lít, bỏ vừa cốp xe máy. Màu ngoài thực tế đẹp hơn trên ảnh.',
    helpful: 18,
  },
  {
    id: 'r03',
    author: 'Thu Hằng',
    stars: 5,
    date: '19/11/2026',
    title: 'Mua lần 2 cho cả nhóm',
    text: 'Lần trước mua 1 cái dùng thử, ưng quá nên mua thêm 3 cái cho cả nhóm đi cắm trại. Dùng 4–5 chuyến rồi vẫn như mới, không sờn không rách.',
    helpful: 15,
  },
  {
    id: 'r04',
    author: 'Đức Anh',
    stars: 5,
    date: '05/11/2026',
    title: 'Đáng tiền',
    text: 'Hoàn thiện tốt, các chi tiết nhỏ như dây rút, móc treo đều chắc tay. So với hàng cùng tầm giá thì cái này hơn hẳn. Sẽ quay lại mua thêm.',
    helpful: 12,
  },
  {
    id: 'r05',
    author: 'Lan Chi',
    stars: 5,
    date: '21/11/2026',
    title: 'Giao nhanh, đóng gói kỹ',
    text: 'Đặt sáng thứ 2, chiều thứ 3 đã nhận. Bọc chống sốc 2 lớp, hộp không móp méo. Mở ra kiểm tra đủ phụ kiện, không thiếu món nào.',
    helpful: 9,
  },
  {
    id: 'r06',
    author: 'Hoàng Nam',
    stars: 5,
    date: '14/11/2026',
    title: 'Chịu mưa tốt, dùng yên tâm',
    text: 'Dùng trong chuyến Tà Xùa gặp mưa rào cả đêm, nước không thấm vào trong, sáng dậy lau khô là dùng tiếp được. Khóa kéo vẫn trơn tru sau khi dính nước mưa.',
    helpful: 21,
  },
  {
    id: 'r07',
    author: 'Phương Thảo',
    stars: 4,
    date: '17/11/2026',
    title: 'Tốt, chỉ hơi nặng hơn mô tả',
    text: 'Chất lượng tốt, dùng 2 chuyến chưa thấy lỗi gì. Trừ 1 sao vì cầm nặng hơn mình tưởng, ghi 800g mà cân thực tế gần 1kg. Ai đi bộ đường dài nên cân nhắc.',
    helpful: 7,
  },
  {
    id: 'r08',
    author: 'Văn Hùng',
    stars: 4,
    date: '11/11/2026',
    title: 'Dùng ổn, màu thực đậm hơn ảnh',
    text: 'Hàng chắc chắn, đường may đều. Màu ngoài đời đậm hơn trên web một tông, ai kỹ tính về màu thì lưu ý. Còn lại mọi thứ đều tốt.',
    helpful: 5,
  },
  {
    id: 'r09',
    author: 'Ngọc Trâm',
    stars: 4,
    date: '23/11/2026',
    title: 'Tốt cho giá này',
    text: 'Tầm giá này thì khó chê. Có vài chi tiết nhỏ chưa được tinh xảo như hàng cao cấp nhưng dùng thực tế không ảnh hưởng. Đang chờ sale mua thêm cái nữa.',
    helpful: 11,
  },
  {
    id: 'r10',
    author: 'Tuấn Kiệt',
    stars: 4,
    date: '25/11/2026',
    title: 'Giao hơi chậm nhưng hàng tốt',
    text: 'Đặt thứ 6 mà thứ 3 mới nhận, giao chậm hơn hẹn 1 ngày. Bù lại hàng đúng mô tả, đóng gói cẩn thận, dùng tốt nên mình vẫn cho 4 sao.',
    helpful: 4,
  },
  {
    id: 'r11',
    author: 'Thanh Tùng',
    stars: 3,
    date: '09/11/2026',
    title: 'Tạm được, đường may chưa đều',
    text: 'Dùng được cho chuyến đi ngắn, nhưng một vài đường may chưa đều tay, có chỗ chỉ thừa. Nên kiểm tra kỹ trước khi mang đi xa. Với giá này thì chấp nhận được.',
    helpful: 8,
  },
  {
    id: 'r12',
    author: 'Diệu Linh',
    stars: 2,
    date: '27/11/2026',
    title: 'Khóa kéo hơi rít',
    text: 'Chất liệu và đường may thì ổn, nhưng khóa kéo hơi rít, kéo mạnh tay mới trôi, phải bôi sáp nến mới mượt. Hy vọng shop kiểm tra kỹ hơn trước khi gửi hàng.',
    helpful: 6,
  },
]

/**
 * Trả đúng 6 đánh giá cho một sản phẩm, chọn XÁC ĐỊNH theo productId
 * (cùng một sản phẩm luôn nhận cùng 6 đánh giá, không đổi mỗi lần render).
 * Luôn đảm bảo: ít nhất 3 đánh giá 5 sao, 2 đánh giá 4 sao,
 * 1 đánh giá 3 sao trở xuống.
 */
export function getReviewsForProduct(productId: number): Review[] {
  const five = POOL.filter((r) => r.stars === 5)
  const four = POOL.filter((r) => r.stars === 4)
  const low = POOL.filter((r) => r.stars <= 3)
  const p = Math.abs(productId)
  const picked = [
    five[(p * 2) % five.length],
    five[(p * 2 + 2) % five.length],
    five[(p * 2 + 4) % five.length],
    four[p % four.length],
    four[(p + 2) % four.length],
    low[p % low.length],
  ]
  return picked.map((r) => ({
    ...r,
    productId,
    // id duy nhất theo sản phẩm để nút "Hữu ích" không lẫn giữa các món.
    id: `rv-${productId}-${r.id}`,
  }))
}
