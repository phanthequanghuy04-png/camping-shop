/**
 * Trang Điều khoản sử dụng — /chinh-sach/dieu-khoan.
 * Chỉ nêu các quy định thật của shop: giá VND, COD + VietQR, CAMP10,
 * freeship, thời gian giao hàng, theo dõi đơn ở /orders.
 */
import { Link } from 'react-router-dom'
import PolicyNav from '../components/PolicyNav'

export default function PolicyTerms() {
  return (
    <main className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
      <h1 className="font-bold">Điều khoản sử dụng</h1>
      <p className="mt-2 text-muted-foreground">
        Khi mua hàng trên Camping Shop, bạn đồng ý với các điều khoản dưới
        đây.
      </p>
      <PolicyNav current="dieu-khoan" />

      <section>
        <h2 className="mt-8 font-bold">Giá và thông tin sản phẩm</h2>
        <p className="mt-2">
          Giá hiển thị trên website bằng đồng Việt Nam (VND). Thông tin sản
          phẩm theo mô tả trên trang chi tiết của từng sản phẩm; màu sắc thực
          tế có thể chênh nhẹ so với ảnh do màn hình hiển thị khác nhau.
        </p>
      </section>

      <section>
        <h2 className="mt-8 font-bold">Đặt hàng</h2>
        <p className="mt-2">
          Bạn cần đăng nhập mới được thêm vào giỏ hàng, mua ngay hoặc lưu sản
          phẩm yêu thích; giỏ hàng và yêu thích được lưu riêng theo từng tài
          khoản. Đơn hàng được tính là thành công khi hệ thống ghi nhận và
          hiện mã đơn — bạn xem lại đơn của mình ở trang{' '}
          <Link to="/orders">Đơn hàng</Link>.
        </p>
      </section>

      <section>
        <h2 className="mt-8 font-bold">Thanh toán</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Trả tiền khi nhận hàng (COD): bạn trả tiền mặt cho người giao
            hàng.
          </li>
          <li>
            Chuyển khoản qua VietQR: mã QR ở trang thanh toán hiện đúng tổng
            tiền và nội dung chuyển khoản kèm mã đơn của bạn.
          </li>
          <li>
            Mã giảm giá CAMP10 giảm 10% tổng đơn, tối đa 200.000₫.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mt-8 font-bold">Vận chuyển</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Miễn phí vận chuyển khi tạm tính (chưa giảm giá) từ 500.000₫.
          </li>
          <li>
            Phí ship khi chưa đủ miễn phí: 20.000₫ ở Hà Nội và TP.HCM,
            30.000₫ ở tỉnh/thành khác.
          </li>
          <li>
            Thời gian giao dự kiến: 1–2 ngày ở Hà Nội và TP.HCM, 2–4 ngày ở
            tỉnh/thành khác.
          </li>
          <li>
            Bạn theo dõi đơn ở trang <Link to="/orders">Đơn hàng</Link>; mã
            vận đơn do shop cập nhật sau khi gửi hàng.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mt-8 font-bold">Sử dụng website</h2>
        <p className="mt-2">
          Bạn không được dùng website cho mục đích vi phạm pháp luật. Shop có
          quyền từ chối đơn hàng nghi ngờ gian lận.
        </p>
      </section>

      <section>
        <h2 className="mt-8 font-bold">Cập nhật điều khoản</h2>
        <p className="mt-2">
          Shop có thể cập nhật điều khoản này khi cần; bản mới nhất luôn được
          đăng tại trang này.
        </p>
      </section>
    </main>
  )
}
