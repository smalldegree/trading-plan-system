<template>
  <div class="dashboard">
    <section class="content-main">
      <div class="toolbar panel">
        <el-input
          v-model="keyword"
          placeholder="搜索公司 / 代码 / 原因"
          clearable
          class="search"
          @keyup.enter="onSearch"
          @clear="onSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>

        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="filter-date"
          @change="onSearch"
        />

        <div class="spacer"></div>

        <div class="theme-selector">
          <el-button
            v-for="t in THEMES"
            :key="t.key"
            :type="themeStore.current === t.key ? 'primary' : 'default'"
            @click="themeStore.set(t.key)"
          >{{ t.label }}</el-button>
        </div>

        <el-button @click="onImportClick">
          <el-icon><Upload /></el-icon>
          <span>导入</span>
        </el-button>
        <el-button @click="onExport">
          <el-icon><Download /></el-icon>
          <span>导出</span>
        </el-button>
        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>
          <span>新增记录</span>
        </el-button>
        <input
          ref="importInput"
          type="file"
          accept=".csv,text/csv"
          style="display: none"
          @change="onImportFile"
        />
      </div>

      <div class="table-wrap panel">
        <el-table
          :data="list"
          v-loading="loading"
          stripe
          style="width: 100%"
          :default-sort="{ prop: 'trade_date', order: 'ascending' }"
        >
          <el-table-column type="index" label="序号" width="50" fixed="left" align="center" />
          <el-table-column prop="stock_name" label="公司" width="80" fixed="left" show-overflow-tooltip />
          <el-table-column prop="stock_code" label="代码" min-width="40" sortable />
          <el-table-column prop="point" label="取点" min-width="22" align="center">
            <template #default="{ row }">
              <span v-if="row.point" :class="row.point === '强势' ? 'point-strong' : 'point-weak'">{{ row.point }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column prop="strong_reversal" label="强扭转" min-width="46" align="center">
            <template #default="{ row }">
              <el-icon v-if="row.strong_reversal === '是'" class="yes-icon"><Check /></el-icon>
              <el-icon v-else class="no-icon"><Close /></el-icon>
            </template>
          </el-table-column>
          <el-table-column prop="position_preferred" label="位置优选" min-width="40" align="center">
            <template #default="{ row }">
              <el-icon v-if="row.position_preferred === '是'" class="yes-icon"><Check /></el-icon>
              <el-icon v-else class="no-icon"><Close /></el-icon>
            </template>
          </el-table-column>
          <el-table-column prop="pullback_sufficient" label="回踩充分" min-width="50" align="center">
            <template #default="{ row }">
              <el-icon v-if="row.pullback_sufficient === '是'" class="yes-icon"><Check /></el-icon>
              <el-icon v-else class="no-icon"><Close /></el-icon>
            </template>
          </el-table-column>
          <el-table-column prop="score" label="优选打分" min-width="60" align="center" sortable :sort-method="sortByScore" />
          <el-table-column prop="trade_date" label="买入日期" min-width="55" sortable />
          <el-table-column label="买入价格" min-width="46" align="right">
            <template #default="{ row }">
              <span class="num">{{ fmtPlainMoney(row.price) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="买入股数" min-width="52" align="right">
            <template #default="{ row }">
              <span class="num">{{ row.shares ?? '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="买入金额" min-width="58" align="right">
            <template #default="{ row }">
              <span class="num">{{ fmtPlainMoney(row.buy_amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sell_date" label="卖出日期" min-width="72" align="center"/>
          <el-table-column label="卖出价格" min-width="40" align="right">
            <template #default="{ row }">
              <span class="num">{{ fmtPlainMoney(row.sell_price) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="卖出股数" min-width="50" align="right">
            <template #default="{ row }">
              <span class="num">{{ row.sell_shares ?? '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="卖出金额" min-width="70" align="right">
            <template #default="{ row }">
              <span class="num">{{ fmtPlainMoney(row.sell_amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="trend" label="走势" min-width="60" show-overflow-tooltip align="center">
            <template #default="{ row }">
              <span v-if="row.trend" :class="trendClass(row.trend)">{{ row.trend }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="原因" min-width="30" align="center">
            <template #default="{ row }">
              <span v-if="row.reason" :class="row.reason === '止盈' ? 'reason-red' : 'reason-green'">{{ row.reason }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column prop="return_rate" label="收益率" min-width="60" align="center" sortable>
            <template #default="{ row }">
              <span class="num" :class="pnlClass(row.return_rate)">{{ fmtPercent(row.return_rate) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="pnl" label="盈亏金额" min-width="60" align="center" sortable>
            <template #default="{ row }">
              <span class="num" :class="pnlClass(row.pnl)">{{ fmtMoney(row.pnl) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="summary" label="总结" min-width="70" show-overflow-tooltip />
          <el-table-column label="操作" width="90" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="onDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pager">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            :page-size="pageSize"
            :current-page="page"
            :page-sizes="[10, 20, 50, 100]"
            @current-change="onPageChange"
            @size-change="onSizeChange"
          />
        </div>
      </div>
    </section>

    <div v-if="!sideCollapsed" class="resizer" @mousedown="startResize"></div>

    <aside class="content-side" :style="sideStyle">
      <StatsPanel ref="statsPanelRef" :collapsed="sideCollapsed" @toggle="toggleSide" />
    </aside>

    <TradeFormDialog v-model="dialogVisible" :trade="editing" @saved="onSaved" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import api from '../api';
import StatsPanel from '../components/StatsPanel.vue';
import TradeFormDialog from '../components/TradeFormDialog.vue';
import { fmtMoney, fmtPercent, fmtPlainMoney, pnlClass } from '../utils/format';
import { THEMES, useThemeStore } from '../store/theme';

const themeStore = useThemeStore();

const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const keyword = ref('');
const dateRange = ref([]);
const loading = ref(false);

const dialogVisible = ref(false);
const editing = ref(null);
const statsPanelRef = ref(null);
const importInput = ref(null);

const sideWidth = ref(400);
const sideCollapsed = ref(true);
const sideStyle = computed(() => ({
  width: sideCollapsed.value ? '44px' : sideWidth.value + 'px',
}));

async function load() {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
    };
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0];
      params.end_date = dateRange.value[1];
    }
    const data = await api.get('/trades', { params });
    list.value = data.list;
    total.value = data.total;
  } catch (e) {
    // 错误提示由拦截器统一处理
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  page.value = 1;
  load();
}
function onPageChange(p) {
  page.value = p;
  load();
}
function onSizeChange(s) {
  pageSize.value = s;
  page.value = 1;
  load();
}

function openCreate() {
  editing.value = null;
  dialogVisible.value = true;
}
function openEdit(row) {
  editing.value = row;
  dialogVisible.value = true;
}
function onSaved() {
  load();
  statsPanelRef.value?.reload();
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${row.stock_name || row.stock_code || '该记录'}」吗？`,
      '提示',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    );
  } catch (e) {
    return;
  }
  try {
    await api.delete(`/trades/${row.id}`);
    ElMessage.success('删除成功');
    load();
    statsPanelRef.value?.reload();
  } catch (e) {
    // 错误提示由拦截器统一处理
  }
}

async function onExport() {
  try {
    const params = {
      keyword: keyword.value || undefined,
    };
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0];
      params.end_date = dateRange.value[1];
    }
    const blob = await api.get('/trades/export', { params, responseType: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `交易计划_${dayjs().format('YYYYMMDD')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    // 错误提示由拦截器统一处理
  }
}

function onImportClick() {
  if (importInput.value) importInput.value.click();
}

function onImportFile(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const res = await api.post('/trades/import', { content: reader.result });
      if (res.errors && res.errors.length) {
        ElMessage.warning(
          `导入完成：成功 ${res.imported} 条，失败 ${res.failed} 条（${res.errors.slice(0, 3).join('；')}）`
        );
      } else {
        ElMessage.success(`导入完成：成功 ${res.imported} 条`);
      }
      load();
      statsPanelRef.value?.reload();
    } catch (err) {
      // 错误提示由拦截器统一处理
    }
  };
  reader.readAsText(file, 'utf-8');
  e.target.value = '';
}

function startResize(e) {
  e.preventDefault();
  const startX = e.clientX;
  const startWidth = sideWidth.value;
  const onMove = (ev) => {
    const w = Math.min(800, Math.max(280, startWidth + (startX - ev.clientX)));
    sideWidth.value = w;
  };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

function toggleSide() {
  sideCollapsed.value = !sideCollapsed.value;
}

function sortByScore(a, b) {
  const diff = (a.score ?? 0) - (b.score ?? 0);
  if (diff !== 0) return diff;
  return String(a.stock_code ?? '').localeCompare(String(b.stock_code ?? ''));
}

function trendClass(v) {
  if (v === '强势回踩') return 'trend-strong';
  if (v === '正常回踩') return 'trend-normal';
  return 'trend-weak';
}

onMounted(load);
</script>

<style scoped>
.dashboard {
  display: flex;
  align-items: flex-start;
}

.content-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-right: 12px;
}

.resizer {
  width: 5px;
  flex-shrink: 0;
  align-self: stretch;
  cursor: col-resize;
  margin-right: 12px;
  background: var(--border);
  border-radius: 3px;
  opacity: 0.5;
  transition: opacity 0.15s;
}
.resizer:hover {
  opacity: 1;
}

.content-side {
  flex-shrink: 0;
  transition: width 0.2s ease;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}
.toolbar .el-button + .el-button {
  margin-left: 0;
}
.search {
  width: 240px;
}
.filter-date {
  width: 260px;
}
.filter-strategy {
  width: 130px;
}
.spacer {
  flex: 1;
}
.theme-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
}
.theme-selector .el-button {
  margin: 0;
  border-radius: 7px;
}

.table-wrap {
  padding: 8px;
}
.pager {
  display: flex;
  justify-content: flex-end;
  padding: 14px 8px 6px;
}
.yes-icon {
  color: #00b578;
  font-size: 16px;
}
.no-icon {
  color: #ff4d4f;
  font-size: 16px;
}
.reason-red {
  color: #ff4d4f;
  font-weight: 600;
}
.reason-green {
  color: #00b578;
  font-weight: 600;
}
.point-strong {
  color: #ff4d4f;
  font-weight: 600;
}
.point-weak {
  color: #00b578;
  font-weight: 600;
}
.trend-strong {
  color: #ff4d4f;
  font-weight: 600;
}
.trend-normal {
  color: #ff8fb8;
  font-weight: 600;
}
.trend-weak {
  color: #38bdf8;
  font-weight: 600;
}
</style>
