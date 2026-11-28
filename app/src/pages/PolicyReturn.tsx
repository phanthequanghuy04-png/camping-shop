/**
 * Trang Đổi trả & hoàn tiền — /chinh-sach/doi-tra.
 * Quy định đã chốt với chủ shop: đổi/trả trong 7 ngày kể từ ngày nhận hàng.
 */
import PolicyNav from '../components/PolicyNav'

export default function PolicyReturn() {
  return (
    <main className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
      <h1 className="font-bold">Đổi trả &amp; hoàn tiền</h1>
      <p className="mt-2 text-muted-foreground">
        Bạn có thể đổi hoặc trả hàng trong 7 ngày kể từ ngày nhận hàng, theo
        các điều kiện dưới đây.
      </p>
      <PolicyNav current="doi-tra" />

      <section>
        <h2 className="mt-8 font-bold">Điều kiện đổi trả</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Sản phẩm chưa qua sử dụng, còn nguyên tem/tag.</li>
          <li>
            Đầy đủ phụ kiện và hộp đựng đi kèm (nếu có) như lúc giao hàng.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mt-8 font-bold">Cách đổi hoặc trả hàng</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Liên hệ shop qua chat Trợ giúp trên website (nút tròn ở góc phải
            dưới màn hình), nêu mã đơn hàng và lý do đổi/trả.
          </li>
          <li>Hai bên thống nhất phương án đổi hoặc trả.</li>
          <li>Bạn gửi hàng về theo hướng dẫn của shop.</li>
          <li>
            Shop kiểm tra hàng trả rồi hoàn tiền hoặc gửi hàng đổi cho bạn.
          </li>
        </ol>
      </section>

      <section>
        <h2 className="mt-8 font-bold">Hoàn tiền</h2>
        <p className="mt-2">
          Tiền được hoàn về đúng phương thức bạn đã thanh toán: đơn trả bằng
          tiền mặt khi nhận hàng (COD) thì shop hoàn qua chuyển khoản theo
          thông tin bạn cung cấp; đơn đã chuyển khoản thì shop hoàn về đúng
          tài khoản bạn đã chuyển. Thời gian hoàn tiền là 1–3 ngày làm việc
          sau khi shop nhận và kiểm tra hàng trả.
        </p>
      </section>

      <section>
        <h2 className="mt-8 font-bold">Ai chịu phí ship trả hàng</h2>
        <p className="mt-2">
          Bạn chịu phí ship gửi hàng về cho shop, trừ trường hợp shop giao
          sai mẫu, sai hàng hoặc hàng bị lỗi do shop — khi đó shop chịu phí
          vận chuyển cả 2 chiều.
        </p>
      </section>

      <section>
        <h2 className="mt-8 font-bold">Trường hợp không áp dụng</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Hàng đã qua sử dụng.</li>
          <li>Hàng hư hỏng do bạn sử dụng hoặc bảo quản không đúng cách.</li>
          <li>Hàng thiếu phụ kiện hoặc hộp đựng đi kèm.</li>
        </ul>
      </section>

      <section>
        <h2 className="mt-8 font-bold">Đổi sang sản phẩm khác</h2>
        <p className="mt-2">
          Đổi sang sản phẩm khác áp dụng cùng quy trình trên. Nếu sản phẩm
          mới đắt hơn, bạn thanh toán thêm phần chênh lệch; nếu rẻ hơn, shop
          hoàn lại phần chênh lệch tương ứng.
        </p>
      </section>
    </main>
  )
}
