// Thông tin tài khoản nhận tiền của shop (chuyển khoản / VietQR).
// Cấu hình bằng biến môi trường lúc build (Vite) — xem app/.env.example:
//   VITE_BANK_CODE    mã ngân hàng VietQR, vd VCB, TCB, MB, ACB, BIDV
//   VITE_BANK_NAME    tên hiển thị, vd Vietcombank
//   VITE_BANK_ACCOUNT số tài khoản
//   VITE_BANK_HOLDER  tên chủ tài khoản
// Chưa cấu hình thì getBankConfig() trả null và trang thanh toán chỉ hiện
// "shop sẽ liên hệ gửi thông tin chuyển khoản" — KHÔNG hiện QR giả hay
// số tài khoản giả. Điền thông tin thật của shop trước khi mở bán.

export interface BankConfig {
  bankCode: string
  bankName: string
  accountNumber: string
  accountName: string
}

export function getBankConfig(): BankConfig | null {
  const bankCode = import.meta.env.VITE_BANK_CODE as string | undefined
  const bankName = import.meta.env.VITE_BANK_NAME as string | undefined
  const accountNumber = import.meta.env.VITE_BANK_ACCOUNT as
    | string
    | undefined
  const accountName = import.meta.env.VITE_BANK_HOLDER as string | undefined
  const code = bankCode?.trim()
  const account = accountNumber?.trim()
  const holder = accountName?.trim()
  if (!code || !account || !holder) return null
  return {
    bankCode: code,
    bankName: bankName?.trim() || code,
    accountNumber: account,
    accountName: holder,
  }
}

/**
 * Ảnh mã VietQR — dịch vụ công khai img.vietqr.io, không cần key/tài khoản.
 * Khách quét bằng app ngân hàng bất kỳ là chuyển đúng số tiền + nội dung.
 */
export function vietQrUrl(
  config: BankConfig,
  amount: number,
  orderId: number,
): string {
  const addInfo = encodeURIComponent(`CampingShop DH${orderId}`)
  return `https://img.vietqr.io/image/${config.bankCode}-${config.accountNumber}-compact2.png?amount=${Math.round(amount)}&addInfo=${addInfo}`
}
