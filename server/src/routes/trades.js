const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { toCsv, parseCsv } = require('../utils/csv');

const router = express.Router();

const CSV_COLUMNS = [
  { key: 'stock_name', label: '公司' },
  { key: 'stock_code', label: '代码' },
  { key: 'point', label: '取点' },
  { key: 'strong_reversal', label: '强扭转' },
  { key: 'position_preferred', label: '位置优选' },
  { key: 'pullback_sufficient', label: '回踩充分' },
  { key: 'score', label: '优选打分' },
  { key: 'trade_date', label: '买入日期' },
  { key: 'price', label: '买入价格' },
  { key: 'shares', label: '买入股数' },
  { key: 'buy_amount', label: '买入金额' },
  { key: 'sell_date', label: '卖出日期' },
  { key: 'sell_price', label: '卖出价格' },
  { key: 'sell_shares', label: '卖出股数' },
  { key: 'sell_amount', label: '卖出金额' },
  { key: 'trend', label: '走势' },
  { key: 'reason', label: '原因' },
  { key: 'return_rate', label: '收益率' },
  { key: 'pnl', label: '盈亏金额' },
  { key: 'summary', label: '总结' },
];

const HEADER_MAP = {};
for (const c of CSV_COLUMNS) HEADER_MAP[c.label] = c.key;
for (const c of CSV_COLUMNS) HEADER_MAP[c.key] = c.key;

function applyFilters(base, query) {
  const { keyword, start_date, end_date } = query;
  if (start_date) base.where('trade_date', '>=', start_date);
  if (end_date) base.where('trade_date', '<=', end_date);
  if (keyword) {
    const kw = `%${keyword}%`;
    base.where(function () {
      this.where('stock_name', 'like', kw)
        .orWhere('stock_code', 'like', kw)
        .orWhere('reason', 'like', kw)
        .orWhere('summary', 'like', kw);
    });
  }
  return base;
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function toNum(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// 统一清洗并自动计算买入金额 / 盈亏 / 收益率 / 优选打分
function normalize(body) {
  const yes = (v) => (v === '是' ? '是' : '否');
  const strong_reversal = yes(body.strong_reversal);
  const position_preferred = yes(body.position_preferred);
  const pullback_sufficient = yes(body.pullback_sufficient);
  const score = [strong_reversal, position_preferred, pullback_sufficient].filter(
    (x) => x === '是'
  ).length;

  const t = {
    trade_date: body.trade_date,
    sell_date: body.sell_date || null,
    stock_name: body.stock_name || null,
    stock_code: body.stock_code || null,
    point: body.point || null,
    strong_reversal,
    position_preferred,
    pullback_sufficient,
    score,
    price: toNum(body.price),
    shares: body.shares == null || body.shares === '' ? null : Number(body.shares),
    sell_shares:
      body.sell_shares == null || body.sell_shares === '' ? null : Number(body.sell_shares),
    reason: body.reason || null,
    sell_price: toNum(body.sell_price),
    return_rate: toNum(body.return_rate),
    pnl: toNum(body.pnl),
    trend: body.trend || null,
    summary: body.summary || null,
    updated_at: new Date(),
  };

  // 买入金额 = 买入价格 × 买入股数（保留 2 位小数）
  t.buy_amount = t.price != null && t.shares != null ? round2(t.price * t.shares) : null;

  // 卖出金额 = 卖出价格 × 卖出股数（保留 2 位小数）
  t.sell_amount =
    t.sell_price != null && t.sell_shares != null ? round2(t.sell_price * t.sell_shares) : null;

  if (t.pnl == null && t.sell_amount != null && t.buy_amount != null) {
    t.pnl = round2(t.sell_amount - t.buy_amount);
  }
  if (t.return_rate == null && t.pnl != null && t.buy_amount != null && t.buy_amount !== 0) {
    t.return_rate = round2((t.pnl / t.buy_amount) * 100);
  }
  return t;
}

function validate(t) {
  if (!t.trade_date) return '买入日期不能为空';
  return null;
}

// 分页列表（支持关键字 / 日期范围 / 策略筛选）
router.get('/', auth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 10));
    const base = applyFilters(db('trades').where({ user_id: req.user.id }), req.query);

    const countQuery = base.clone();
    const [{ total }] = await countQuery.count({ total: '*' });
    const list = await base
      .clone()
      .orderBy('trade_date', 'asc')
      .orderBy('id', 'asc')
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return res.json({
      list,
      total: Number(total) || 0,
      page,
      pageSize,
    });
  } catch (e) {
    return next(e);
  }
});

// 统计
router.get('/stats', auth, async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const base = db('trades').where({ user_id: req.user.id });
    if (start_date) base.where('trade_date', '>=', start_date);
    if (end_date) base.where('trade_date', '<=', end_date);
    const rows = await base.orderBy('trade_date', 'asc').orderBy('id', 'asc');

    let win_count = 0;
    let win_amount = 0;
    let loss_count = 0;
    let loss_amount = 0;
    let total_pnl = 0;
    let total_buy = 0;
    let sum_return_rate = 0;
    let counted_rate = 0;

    const dailyMap = new Map();

    for (const r of rows) {
      const pnl = Number(r.pnl) || 0;
      total_pnl += pnl;
      total_buy += Number(r.buy_amount) || 0;
      if (r.return_rate != null) {
        sum_return_rate += Number(r.return_rate) || 0;
        counted_rate += 1;
      }
      if (pnl > 0) {
        win_count += 1;
        win_amount += pnl;
      } else if (pnl < 0) {
        loss_count += 1;
        loss_amount += Math.abs(pnl);
      }
      const day = r.trade_date;
      dailyMap.set(day, (dailyMap.get(day) || 0) + pnl);
    }

    const top_profit = rows
      .filter((r) => (Number(r.pnl) || 0) > 0)
      .sort((a, b) => (Number(b.pnl) || 0) - (Number(a.pnl) || 0))
      .slice(0, 5);

    const top_loss = rows
      .filter((r) => (Number(r.pnl) || 0) < 0)
      .sort((a, b) => (Number(a.pnl) || 0) - (Number(b.pnl) || 0))
      .slice(0, 5);

    const days = Array.from(dailyMap.keys()).sort();
    let cumulative = 0;
    const curve = days.map((d) => {
      cumulative += dailyMap.get(d);
      return {
        date: d,
        pnl: round2(dailyMap.get(d)),
        cumulative: round2(cumulative),
      };
    });

    const total_return_rate = total_buy > 0 ? round2((total_pnl / total_buy) * 100) : 0;
    const avg_return_rate = counted_rate > 0 ? round2(sum_return_rate / counted_rate) : 0;
    const win_rate =
      win_count + loss_count > 0
        ? round2((win_count / (win_count + loss_count)) * 100)
        : 0;

    return res.json({
      summary: {
        total_trades: rows.length,
        win_count,
        win_amount: round2(win_amount),
        loss_count,
        loss_amount: round2(loss_amount),
        total_pnl: round2(total_pnl),
        total_buy_amount: round2(total_buy),
        total_return_rate,
        avg_return_rate,
        win_rate,
      },
      curve,
      top_profit,
      top_loss,
    });
  } catch (e) {
    return next(e);
  }
});

// 导出 CSV
router.get('/export', auth, async (req, res, next) => {
  try {
    const base = applyFilters(db('trades').where({ user_id: req.user.id }), req.query);
    const rows = await base.orderBy('trade_date', 'asc').orderBy('id', 'asc');
    const data = rows.map((r) => {
      const o = {};
      for (const c of CSV_COLUMNS) o[c.key] = r[c.key];
      return o;
    });
    const csv = toCsv(data, CSV_COLUMNS);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="trades.csv"');
    return res.send('\uFEFF' + csv);
  } catch (e) {
    return next(e);
  }
});

// 导入 CSV
router.post('/import', auth, async (req, res, next) => {
  try {
    const content = req.body && req.body.content;
    if (!content) return res.status(400).json({ message: '缺少 CSV 内容' });
    const rows = parseCsv(content);
    if (rows.length < 2) return res.status(400).json({ message: 'CSV 数据为空' });

    const header = rows[0].map((h) => String(h).trim());
    const colKeys = header.map((h) => HEADER_MAP[h] || null);
    if (!colKeys.some((k) => k === 'trade_date')) {
      return res.status(400).json({ message: 'CSV 表头缺少「日期」列' });
    }

    const errors = [];
    const toInsert = [];
    rows.slice(1).forEach((cells, idx) => {
      const obj = {};
      colKeys.forEach((key, i) => {
        if (key) obj[key] = cells[i] == null ? '' : String(cells[i]).trim();
      });
      const t = normalize(obj);
      const err = validate(t);
      if (err) {
        errors.push(`第 ${idx + 2} 行：${err}`);
        return;
      }
      t.user_id = req.user.id;
      t.created_at = new Date();
      toInsert.push(t);
    });

    let imported = 0;
    const CHUNK = 200;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const chunk = toInsert.slice(i, i + CHUNK);
      await db('trades').insert(chunk);
      imported += chunk.length;
    }

    return res.json({ imported, failed: errors.length, errors });
  } catch (e) {
    return next(e);
  }
});

// 详情
router.get('/:id', auth, async (req, res, next) => {
  try {
    const row = await db('trades').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!row) return res.status(404).json({ message: '记录不存在' });
    return res.json(row);
  } catch (e) {
    return next(e);
  }
});

// 新增
router.post('/', auth, async (req, res, next) => {
  try {
    const t = normalize(req.body || {});
    const err = validate(t);
    if (err) return res.status(400).json({ message: err });
    t.user_id = req.user.id;
    t.created_at = new Date();
    const [id] = await db('trades').insert(t);
    const row = await db('trades').where({ id }).first();
    return res.status(201).json(row);
  } catch (e) {
    return next(e);
  }
});

// 更新
router.put('/:id', auth, async (req, res, next) => {
  try {
    const existing = await db('trades').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!existing) return res.status(404).json({ message: '记录不存在' });
    const t = normalize(req.body || {});
    const err = validate(t);
    if (err) return res.status(400).json({ message: err });
    await db('trades').where({ id: req.params.id }).update(t);
    const row = await db('trades').where({ id: req.params.id }).first();
    return res.json(row);
  } catch (e) {
    return next(e);
  }
});

// 删除
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const existing = await db('trades').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!existing) return res.status(404).json({ message: '记录不存在' });
    await db('trades').where({ id: req.params.id }).del();
    return res.json({ message: '删除成功' });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
