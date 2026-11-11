<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑交易计划' : '新增交易计划'"
    width="820px"
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <el-form :model="form" label-position="top" class="trade-form">
      <div class="grid-3">
        <el-form-item label="公司 / 股票名称">
          <el-input v-model="form.stock_name" placeholder="如：贵州茅台" />
        </el-form-item>

        <el-form-item label="代码">
          <el-input v-model="form.stock_code" placeholder="如：600519" />
        </el-form-item>

        <el-form-item label="取点">
          <el-select v-model="form.point" placeholder="选择" clearable style="width: 100%">
            <el-option label="弱势" value="弱势" />
            <el-option label="强势" value="强势" />
          </el-select>
        </el-form-item>
      </div>

      <div class="grid-4">
        <el-form-item label="强扭转">
          <el-radio-group v-model="form.strong_reversal">
            <el-radio-button label="是">是</el-radio-button>
            <el-radio-button label="否">否</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="位置优选">
          <el-radio-group v-model="form.position_preferred">
            <el-radio-button label="是">是</el-radio-button>
            <el-radio-button label="否">否</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="回踩充分">
          <el-radio-group v-model="form.pullback_sufficient">
            <el-radio-button label="是">是</el-radio-button>
            <el-radio-button label="否">否</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="优选打分">
          <div class="score-display">{{ scoreCount }} 分</div>
        </el-form-item>
      </div>

      <div class="grid-4">
        <el-form-item label="买入日期" required>
          <el-date-picker
            v-model="form.trade_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="买入价格">
          <el-input-number
            v-model="form.price"
            :min="0"
            :precision="2"
            :step="0.01"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="买入股数">
          <el-input-number
            v-model="form.shares"
            :min="0"
            :step="100"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="买入金额">
          <div class="money-display">{{ buyAmountText }}</div>
        </el-form-item>
      </div>

      <div class="form-divider"></div>

      <div class="grid-4">
        <el-form-item label="卖出日期">
          <el-date-picker
            v-model="form.sell_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="卖出价格">
          <el-input-number
            v-model="form.sell_price"
            :min="0"
            :precision="2"
            :step="0.01"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="卖出股数">
          <el-input-number
            v-model="form.sell_shares"
            :min="0"
            :step="100"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="卖出金额">
          <div class="money-display">{{ sellAmountText }}</div>
        </el-form-item>
      </div>

      <div class="form-divider"></div>

      <div class="grid-4">
        <el-form-item label="走势">
          <el-select v-model="form.trend" placeholder="选择" clearable style="width: 100%">
            <el-option label="正常回踩" value="正常回踩" />
            <el-option label="弱势回踩" value="弱势回踩" />
            <el-option label="强势回踩" value="强势回踩" />
          </el-select>
        </el-form-item>

        <el-form-item label="原因">
          <el-select v-model="form.reason" placeholder="选择原因" clearable style="width: 100%">
            <el-option label="止盈" value="止盈" />
            <el-option label="纠错" value="纠错" />
          </el-select>
        </el-form-item>

        <el-form-item label="收益率 (%)">
          <div class="money-display">{{ returnRateText }}</div>
        </el-form-item>

        <el-form-item label="盈亏金额">
          <div class="money-display">{{ pnlText }}</div>
        </el-form-item>
      </div>

      <el-form-item label="总结">
        <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="交易复盘总结" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import api from '../api';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  trade: { type: Object, default: null },
});
const emit = defineEmits(['update:modelValue', 'saved']);

const saving = ref(false);
const isEdit = computed(() => !!props.trade?.id);

function emptyForm() {
  return {
    trade_date: '',
    sell_date: '',
    stock_name: '',
    stock_code: '',
    point: '弱势',
    strong_reversal: '否',
    position_preferred: '否',
    pullback_sufficient: '否',
    price: null,
    shares: null,
    sell_shares: null,
    reason: '止盈',
    sell_price: null,
    trend: '正常回踩',
    summary: '',
  };
}

const form = reactive(emptyForm());

const scoreCount = computed(() =>
  [form.strong_reversal, form.position_preferred, form.pullback_sufficient].filter(
    (v) => v === '是'
  ).length
);

const buyAmountText = computed(() =>
  form.price != null && form.shares != null ? (form.price * form.shares).toFixed(2) : '--'
);
const sellAmountText = computed(() =>
  form.sell_price != null && form.sell_shares != null
    ? (form.sell_price * form.sell_shares).toFixed(2)
    : '--'
);
const pnlText = computed(() => {
  const buy = form.price != null && form.shares != null ? form.price * form.shares : null;
  const sell =
    form.sell_price != null && form.sell_shares != null ? form.sell_price * form.sell_shares : null;
  return buy != null && sell != null ? (sell - buy).toFixed(2) : '--';
});
const returnRateText = computed(() => {
  const buy = form.price != null && form.shares != null ? form.price * form.shares : null;
  const sell =
    form.sell_price != null && form.sell_shares != null ? form.sell_price * form.sell_shares : null;
  if (buy == null || buy === 0 || sell == null) return '--';
  return (((sell - buy) / buy) * 100).toFixed(2) + '%';
});

function fillForm() {
  const base = emptyForm();
  const t = props.trade || {};
  Object.assign(form, base, {
    trade_date: t.trade_date || '',
    sell_date: t.sell_date || '',
    stock_name: t.stock_name || '',
    stock_code: t.stock_code || '',
    point: t.point || '弱势',
    strong_reversal: t.strong_reversal || '否',
    position_preferred: t.position_preferred || '否',
    pullback_sufficient: t.pullback_sufficient || '否',
    price: t.price ?? null,
    shares: t.shares ?? null,
    sell_shares: t.sell_shares ?? null,
    reason: t.reason || '止盈',
    sell_price: t.sell_price ?? null,
    trend: t.trend || '正常回踩',
    summary: t.summary || '',
  });
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) fillForm();
  }
);

async function onSave() {
  if (!form.trade_date) {
    ElMessage.warning('请选择买入日期');
    return;
  }
  saving.value = true;
  try {
    const payload = { ...form };
    if (isEdit.value) {
      await api.put(`/trades/${props.trade.id}`, payload);
    } else {
      await api.post('/trades', payload);
    }
    ElMessage.success('保存成功');
    emit('update:modelValue', false);
    emit('saved');
  } catch (e) {
    // 错误提示由拦截器统一处理
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0 16px;
}
.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0 16px;
}
.form-divider {
  border-top: 1px dashed #d6dde7;
  margin: 4px 0 14px;
}
.score-display {
  width: 100%;
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #d6dde7;
  border-radius: 6px;
  background: #f0f3f8;
  color: #a97c2a;
  font-weight: 600;
}
.money-display {
  width: 100%;
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #d6dde7;
  border-radius: 6px;
  background: #f0f3f8;
  color: #1f2d3d;
  font-variant-numeric: tabular-nums;
}
</style>
