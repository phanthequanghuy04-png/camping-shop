/**
 * Xử lý ảnh sản phẩm tải lên từ thiết bị (form Thêm sản phẩm, trang quản
 * trị) TRƯỚC KHI gửi lên server.
 *
 * Ảnh admin tải lên là ảnh đã tách nền sẵn (PNG/WebP trong suốt) — nhưng
 * file tách nền thường vẫn còn lề trong suốt thừa rất lớn quanh sản phẩm
 * (vd lều Cloud Up 2: lề trên tới 274px), làm sản phẩm nhỏ lại trong
 * khung và hiệu ứng bật ra khỏi thẻ không đều. Hàm này làm đúng việc đã
 * làm tay cho 73 ảnh WebP (PIL, 2026-11-28) nhưng ngay trên trình duyệt:
 * - Đọc ảnh, quét kênh alpha, cắt về khung chứa sản phẩm + chừa lề 12px.
 * - Thu nhỏ nếu cạnh dài nhất vượt 1600px (ảnh sản phẩm hiện tại 1600).
 * - Xuất WebP quality 0.9 (nhỏ hơn PNG nhiều, vẫn giữ kênh alpha);
 *   trình duyệt không xuất được WebP thì fallback PNG.
 * Ảnh không trong suốt (JPG nền đặc) thì khung chứa = toàn ảnh nên
 * không cắt gì, chỉ nén lại thành WebP.
 */

export interface PreparedImage {
  /** Data URL để gửi lên server (image_data) và để xem trước. */
  dataUrl: string;
  /** Tên file gợi ý (chỉ để hiển thị; server đặt tên theo tên sản phẩm). */
  fileName: string;
  /** Kích thước (bytes) sau xử lý. */
  size: number;
  width: number;
  height: number;
  /** true khi đã cắt bớt lề trong suốt thừa. */
  trimmed: boolean;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB trước xử lý
const MAX_DIMENSION = 1600;
const ALPHA_THRESHOLD = 10;
const TRIM_PAD = 12;

function slugifyFileName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return slug || 'anh-san-pham';
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không đọc được file ảnh này.'));
    };
    img.src = url;
  });
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement,
): Promise<{ dataUrl: string; size: number }> {
  return new Promise((resolve, reject) => {
    const done = (blob: Blob | null) => {
      if (!blob) {
        reject(new Error('Không xuất được ảnh.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () =>
        resolve({ dataUrl: String(reader.result), size: blob.size });
      reader.onerror = () =>
        reject(new Error('Không đọc được ảnh sau xử lý.'));
      reader.readAsDataURL(blob);
    };
    // Ưu tiên WebP (nhỏ, giữ alpha); không được thì PNG.
    canvas.toBlob(
      (blob) => {
        if (blob) done(blob);
        else canvas.toBlob((png) => done(png), 'image/png');
      },
      'image/webp',
      0.9,
    );
  });
}

export async function prepareProductImage(
  file: File,
): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Vui lòng chọn file ảnh (PNG, WebP hoặc JPG).');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Ảnh quá lớn (tối đa 5 MB).');
  }
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
  ctx.drawImage(img, 0, 0, w, h);

  // Quét kênh alpha tìm khung chứa sản phẩm (ngưỡng > 10 để bỏ viền mờ).
  let trimmed = false;
  try {
    const data = ctx.getImageData(0, 0, w, h).data;
    let x0 = w;
    let y0 = h;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        if (data[(y * w + x) * 4 + 3] > ALPHA_THRESHOLD) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 >= 0) {
      const cx0 = Math.max(0, x0 - TRIM_PAD);
      const cy0 = Math.max(0, y0 - TRIM_PAD);
      const cx1 = Math.min(w, x1 + 1 + TRIM_PAD);
      const cy1 = Math.min(h, y1 + 1 + TRIM_PAD);
      if (cx0 > 0 || cy0 > 0 || cx1 < w || cy1 < h) {
        const cropped = document.createElement('canvas');
        cropped.width = cx1 - cx0;
        cropped.height = cy1 - cy0;
        const cctx = cropped.getContext('2d');
        if (cctx) {
          cctx.drawImage(
            canvas,
            cx0,
            cy0,
            cropped.width,
            cropped.height,
            0,
            0,
            cropped.width,
            cropped.height,
          );
          canvas.width = cropped.width;
          canvas.height = cropped.height;
          const nctx = canvas.getContext('2d');
          nctx?.drawImage(cropped, 0, 0);
          trimmed = true;
        }
      }
    }
  } catch {
    // getImageData lỗi (ảnh cross-origin…) thì giữ nguyên ảnh gốc.
  }

  const { dataUrl, size } = await canvasToDataUrl(canvas);
  const ext = dataUrl.startsWith('data:image/png') ? 'png' : 'webp';
  const baseName = slugifyFileName(
    file.name.replace(/\.[^.]+$/, '') || 'anh-san-pham',
  );
  return {
    dataUrl,
    fileName: `${baseName}.${ext}`,
    size,
    width: canvas.width,
    height: canvas.height,
    trimmed,
  };
}
