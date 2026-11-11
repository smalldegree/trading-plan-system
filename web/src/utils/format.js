// 金融风格格式化工具

export function fmtMoney(v) {
  if (v == null || v === '') return '--';
  const n = Number(v);
  if (!Number.isFinite(n)) return '--';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtPlainMoney(v) {
  if (v == null || v === '') return '--';
  const n = Number(v);
  if (!Number.isFinite(n)) return '--';
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtPercent(v) {
  if (v == null || v === '') return '--';
  const n = Number(v);
  if (!Number.isFinite(n)) return '--';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

// 根据盈亏返回样式类：profit / loss / flat
export function pnlClass(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return 'flat';
  return n > 0 ? 'profit' : 'loss';
}
