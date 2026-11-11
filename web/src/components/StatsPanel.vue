<template>
  <div class="stats-panel panel" :class="{ collapsed }">
    <div class="stats-head">
      <el-button
        text
        size="small"
        class="collapse-btn"
        :title="collapsed ? '展开统计' : '收起统计'"
        @click="emit('toggle')"
      >
        <el-icon><component :is="collapsed ? 'ArrowLeft' : 'ArrowRight'" /></el-icon>
      </el-button>
      <div v-if="!collapsed" class="stats-title">统计概览</div>
    </div>

    <div v-show="!collapsed" class="stats-body">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        value-format="YYYY-MM-DD"
        range-separator="至"
        start-placeholder="开始"
        end-placeholder="结束"
        size="small"
        :shortcuts="shortcuts"
        class="stats-date"
        @change="load"
      />

      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-label">总收益率</div>
          <div class="stat-value num" :class="pnlClass(summary.total_return_rate)">
            {{ fmtPercent(summary.total_return_rate) }}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">总盈亏</div>
          <div class="stat-value num" :class="pnlClass(summary.total_pnl)">
            {{ fmtMoney(summary.total_pnl) }}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">胜率</div>
          <div class="stat-value num">{{ fmtPercent(summary.win_rate) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">盈利 / 亏损</div>
          <div class="stat-value num">
            <span class="profit">{{ summary.win_count }}</span>
            <span class="sep">/</span>
            <span class="loss">{{ summary.loss_count }}</span>
          </div>
          <div class="stat-sub">
            <span class="profit num">{{ fmtMoney(summary.win_amount) }}</span>
            <span class="sep">/</span>
            <span class="loss num">{{ fmtMoney(summary.loss_amount) }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">总笔数</div>
          <div class="stat-value num">{{ summary.total_trades }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">平均收益率</div>
          <div class="stat-value num" :class="pnlClass(summary.avg_return_rate)">
            {{ fmtPercent(summary.avg_return_rate) }}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">盈亏比</div>
          <div class="stat-value num">{{ summary.profit_loss_ratio || '--' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">平均持仓</div>
          <div class="stat-value num">{{ summary.avg_holding_days }}天</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">总买入金额</div>
          <div class="stat-value num">{{ fmtMoney(summary.total_buy_amount) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">总卖出金额</div>
          <div class="stat-value num">{{ fmtMoney(summary.total_sell_amount) }}</div>
        </div>
        <div class="stat-card hold-card">
          <div class="stat-label">持仓金额</div>
          <div class="stat-value num">{{ fmtMoney(summary.holding_amount) }}</div>
        </div>
      </div>

      <div class="chart-block">
        <div class="chart-title">收益金额曲线</div>
        <div ref="chartRef" class="chart"></div>
      </div>

      <div v-if="factorList.length" class="factor-block">
        <div class="factor-title">策略因子胜率</div>
        <div v-for="g in factorList" :key="g.key" class="factor-group">
          <div class="factor-name">{{ g.label }}</div>
          <div v-for="item in g.items" :key="item.value" class="factor-row">
            <span class="f-value">{{ item.value }}</span>
            <span class="f-count num">{{ item.count }}笔</span>
            <span class="f-win num">{{ item.win_rate }}%</span>
            <span class="f-avg num" :class="pnlClass(item.avg_return_rate)">{{ fmtPercent(item.avg_return_rate) }}</span>
          </div>
        </div>
      </div>

      <div class="top-block">
        <div class="top-title profit">盈利 TOP5</div>
        <div v-if="topProfit.length === 0" class="empty">暂无盈利记录</div>
        <div v-for="(r, i) in topProfit" :key="'p' + r.id" class="top-row">
          <span class="rank">{{ i + 1 }}</span>
          <div class="t-main">
            <div class="t-name">{{ r.stock_name || '--' }}</div>
            <div class="t-meta">{{ r.stock_code || '' }} · {{ holdingText(r) }}</div>
          </div>
          <span class="t-rate profit num">{{ fmtPercent(r.return_rate) }}</span>
          <span class="t-val profit num">{{ fmtMoney(r.pnl) }}</span>
        </div>
      </div>

      <div class="top-block">
        <div class="top-title loss">亏损 TOP5</div>
        <div v-if="topLoss.length === 0" class="empty">暂无亏损记录</div>
        <div v-for="(r, i) in topLoss" :key="'l' + r.id" class="top-row">
          <span class="rank">{{ i + 1 }}</span>
          <div class="t-main">
            <div class="t-name">{{ r.stock_name || '--' }}</div>
            <div class="t-meta">{{ r.stock_code || '' }} · {{ holdingText(r) }}</div>
          </div>
          <span class="t-rate loss num">{{ fmtPercent(r.return_rate) }}</span>
          <span class="t-val loss num">{{ fmtMoney(r.pnl) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import api from '../api';
import { fmtMoney, fmtPercent, pnlClass } from '../utils/format';
import { useThemeStore } from '../store/theme';

const props = defineProps({
  collapsed: { type: Boolean, default: false },
});
const emit = defineEmits(['toggle']);

const dateRange = ref([]);
const summary = reactive({
  total_trades: 0,
  win_count: 0,
  win_amount: 0,
  loss_count: 0,
  loss_amount: 0,
  total_pnl: 0,
  total_buy_amount: 0,
  total_sell_amount: 0,
  holding_amount: 0,
  total_return_rate: 0,
  avg_return_rate: 0,
  avg_holding_days: 0,
  profit_loss_ratio: 0,
  win_rate: 0,
});
const topProfit = ref([]);
const topLoss = ref([]);
const chartRef = ref(null);
let chart = null;
const lastCurve = ref([]);
const themeStore = useThemeStore();
const factors = ref({});

const factorDefs = [
  { key: 'score', label: '优选打分' },
  { key: 'point', label: '取点' },
  { key: 'strong_reversal', label: '强扭转' },
  { key: 'position_preferred', label: '位置优选' },
  { key: 'pullback_sufficient', label: '回踩充分' },
  { key: 'trend', label: '走势' },
  { key: 'reason', label: '原因' },
];
const factorList = computed(() =>
  factorDefs
    .map((d) => ({
      key: d.key,
      label: d.label,
      items: (factors.value[d.key] || []).filter((x) => x.count > 0),
    }))
    .filter((g) => g.items.length > 0)
);

const shortcuts = [
  {
    text: '近7天',
    value: () => [dayjs().subtract(6, 'day').toDate(), new Date()],
  },
  {
    text: '近30天',
    value: () => [dayjs().subtract(29, 'day').toDate(), new Date()],
  },
  {
    text: '近90天',
    value: () => [dayjs().subtract(89, 'day').toDate(), new Date()],
  },
  {
    text: '今年以来',
    value: () => [dayjs().startOf('year').toDate(), new Date()],
  },
];

function holdingDays(r) {
  const start = dayjs(r.trade_date);
  if (!start.isValid()) return null;
  const end = r.sell_date ? dayjs(r.sell_date) : dayjs();
  if (!end.isValid()) return null;
  return Math.max(0, end.diff(start, 'day'));
}
function holdingText(r) {
  const d = holdingDays(r);
  return d == null ? '--' : `持股${d}天`;
}

async function load() {
  const params = {};
  if (dateRange.value && dateRange.value.length === 2) {
    params.start_date = dateRange.value[0];
    params.end_date = dateRange.value[1];
  }
  try {
    const data = await api.get('/trades/stats', { params });
    Object.assign(summary, data.summary);
    topProfit.value = data.top_profit || [];
    topLoss.value = data.top_loss || [];
    factors.value = data.factors || {};
    lastCurve.value = data.curve || [];
    renderChart(lastCurve.value);
  } catch (e) {
    // 错误提示由拦截器统一处理
  }
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function renderChart(curve) {
  if (!chart) return;
  const dates = curve.map((c) => c.date);
  const dailies = curve.map((c) => c.pnl);
  const cumulatives = curve.map((c) => c.cumulative);
  const chartText = cssVar('--chart-text') || '#8b99b0';
  const chartAxis = cssVar('--chart-axis') || '#2a3a58';
  const chartSplit = cssVar('--chart-split') || 'rgba(42,58,88,0.45)';
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['当日盈亏', '累计盈亏'],
      textStyle: { color: chartText },
      top: 0,
      right: 0,
    },
    grid: { left: 6, right: 14, top: 32, bottom: 24, containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: chartAxis } },
      axisLabel: { color: chartText },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: chartSplit } },
      axisLabel: { color: chartText },
    },
    series: [
      {
        name: '当日盈亏',
        type: 'bar',
        data: dailies,
        barMaxWidth: 16,
        itemStyle: {
          borderRadius: [2, 2, 0, 0],
          color: (p) => (p.value >= 0 ? '#ff4d4f' : '#00b578'),
        },
      },
      {
        name: '累计盈亏',
        type: 'line',
        data: cumulatives,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#d4a643', width: 2 },
        itemStyle: { color: '#d4a643' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(212,166,67,0.25)' },
            { offset: 1, color: 'rgba(212,166,67,0)' },
          ]),
        },
      },
    ],
  });
}

watch(
  () => themeStore.current,
  () => {
    if (chart) renderChart(lastCurve.value);
  }
);

function onResize() {
  if (chart) chart.resize();
}

let resizeObserver = null;

onMounted(() => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value);
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => chart && chart.resize());
      resizeObserver.observe(chartRef.value);
    }
  }
  window.addEventListener('resize', onResize);
  load();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (chart) {
    chart.dispose();
    chart = null;
  }
});

defineExpose({ reload: load });
</script>

<style scoped>
.stats-panel {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.stats-panel.collapsed {
  padding: 14px 6px;
  align-items: center;
}

.stats-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.stats-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.stats-panel.collapsed .stats-head {
  justify-content: center;
}
.collapse-btn {
  padding: 2px;
  color: var(--text-2);
  font-size: 16px;
}
.collapse-btn:hover {
  color: var(--gold-soft);
}
.stats-title {
  font-size: 16px;
  font-weight: 600;
}
.stats-date {
  width: 100% !important;
}

.stats-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.hold-card {
  grid-column: 1 / -1;
}
.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
}
.stat-label {
  color: var(--text-2);
  font-size: 12px;
  margin-bottom: 6px;
}
.stat-value {
  font-size: 20px;
  font-weight: 700;
}
.stat-sub {
  margin-top: 4px;
  font-size: 13px;
}
.sep {
  color: var(--text-2);
  margin: 0 2px;
}

.chart-block {
  border-top: 1px solid var(--border);
  padding-top: 14px;
}
.chart-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}
.chart {
  height: 220px;
  width: 100%;
}

.factor-block {
  border-top: 1px solid var(--border);
  padding-top: 12px;
}
.factor-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}
.factor-group {
  margin-bottom: 10px;
}
.factor-group:last-child {
  margin-bottom: 0;
}
.factor-name {
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 4px;
}
.factor-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}
.f-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.f-count {
  color: var(--text-2);
  flex-shrink: 0;
}
.f-win {
  width: 44px;
  text-align: right;
  flex-shrink: 0;
}
.f-avg {
  width: 62px;
  text-align: right;
  flex-shrink: 0;
}

.top-block {
  border-top: 1px solid var(--border);
  padding-top: 12px;
}
.top-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}
.empty {
  color: var(--text-2);
  font-size: 13px;
  padding: 8px 0;
}
.top-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px dashed rgba(42, 58, 88, 0.5);
}
.top-row:last-child {
  border-bottom: none;
}
.rank {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-2);
  font-size: 12px;
  font-weight: 700;
}
.t-main {
  flex: 1;
  min-width: 0;
}
.t-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.t-meta {
  font-size: 12px;
  color: var(--text-2);
}
.t-rate {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.t-val {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
