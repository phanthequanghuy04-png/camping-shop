/**
 * Trang Bảo mật — /chinh-sach/bao-mat.
 * Chỉ nêu những gì shop thật sự thu thập và làm với dữ liệu đó.
 */
import PolicyNav from '../components/PolicyNav'

export default function PolicyPrivacy() {
  return (
    <main className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
      <h1 className="font-bold">Bảo mật</h1>
      <p className="mt-2 text-muted-foreground">
        Shop chỉ thu thập những thông tin cần thiết để giao hàng và cập nhật
        đơn hàng cho bạn.
      </p>
      <PolicyNav current="bao-mat" />

      <section>
        <h2 className="mt-8 font-bold">Shop thu thập thông tin gì</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Họ tên, số điện thoại, địa chỉ giao hàng, email.</li>
          <li>Lịch sử đơn hàng của bạn trên website.</li>
        </ul>
      </section>

      <section>
        <h2 className="mt-8 font-bold">Dùng thông tin để làm gì</h2>
        <p className="mt-2">
          Các thông tin trên chỉ dùng để giao hàng và cập nhật tình trạng đơn
          hàng cho bạn. Shop không lưu thông tin thẻ ngân hàng hay thẻ tín
          dụng trên website — thanh toán chuyển khoản thực hiện qua mã VietQR
          ở trang thanh toán, còn tiền mặt thì bạn trả khi nhận hàng.
        </p>
      </section>

      <section>
        <h2 className="mt-8 font-bold">Dữ liệu lưu trong trình duyệt của bạn</h2>
        <p className="mt-2">
          Giỏ hàng, phiên đăng nhập và chế độ sáng/tối được lưu ngay trong
          trình duyệt của bạn, không gửi về máy chủ của shop. Xóa dữ liệu
          trình duyệt sẽ làm mất giỏ hàng chưa đồng bộ và đăng xuất tài
          khoản trên thiết bị đó.
        </p>
      </section>

      <section>
        <h2 className="mt-8 font-bold">Chia sẻ thông tin</h2>
        <p className="mt-2">
          Shop không chia sẻ thông tin của bạn cho bên thứ ba, trừ đơn vị vận
          chuyển — và chỉ chia sẻ họ tên, số điện thoại, địa chỉ để giao
          hàng cho bạn.
        </p>
      </section>

      <section>
        <h2 className="mt-8 font-bold">Quyền của bạn</h2>
        <p className="mt-2">
          Bạn có thể yêu cầu xem, sửa hoặc xóa thông tin cá nhân của mình bất
          cứ lúc nào bằng cách liên hệ shop qua chat Trợ giúp trên website
          (nút tròn ở góc phải dưới màn hình).
        </p>
      </section>

      <section>
        <h2 className="mt-8 font-bold">Tự bảo vệ tài khoản của bạn</h2>
        <p className="mt-2">
          Hãy tự giữ kín mật khẩu của mình và nên đăng xuất khi dùng chung
          thiết bị với người khác.
        </p>
      </section>
    </main>
  )
}
