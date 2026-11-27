/**
 * Tiện ích dùng chung: tìm kiếm không dấu (tiếng Việt).
 * 'Lều trại' -> 'leu trai'; so khớp không phân biệt hoa/thường và dấu.
 */
function removeDiacritics(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function matchesQuery(product, q) {
  if (!q) return true;
  const needle = removeDiacritics(q.trim());
  if (!needle) return true;
  const haystack = removeDiacritics(
    `${product.name ?? ''} ${product.description ?? ''}`,
  );
  return needle.split(/\s+/).every((word) => haystack.includes(word));
}

function applyProductFilters(list, { q, category, sort }) {
  let out = list.filter((p) => p.status === 1);
  if (category) {
    const categoryId = Number(category);
    if (Number.isInteger(categoryId)) {
      out = out.filter((p) => p.id_category === categoryId);
    }
  }
  if (q) out = out.filter((p) => matchesQuery(p, q));
  if (sort === 'price_asc') out = [...out].sort((a, b) => a.price - b.price);
  if (sort === 'price_desc') out = [...out].sort((a, b) => b.price - a.price);
  return out;
}

function publicUser(user) {
  if (!user) return null;
  const { password_hash: _password_hash, ...rest } = user;
  return rest;
}

module.exports = { removeDiacritics, matchesQuery, applyProductFilters, publicUser };
