// 轻量 CSV 序列化 / 解析，避免引入额外依赖

// 转义单个字段
function esc(v) {
  if (v == null || v === '') return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// rows: 对象数组；columns: [{ key, label }]
function toCsv(rows, columns) {
  const header = columns.map((c) => esc(c.label)).join(',');
  const lines = [header];
  for (const r of rows) {
    lines.push(columns.map((c) => esc(r[c.key])).join(','));
  }
  return lines.join('\r\n');
}

// 解析 CSV 文本为二维数组，支持引号包裹、逗号/换行、双引号转义
function parseCsv(text) {
  const s = String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }

  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => String(cell).trim() !== ''));
}

module.exports = { toCsv, parseCsv };
