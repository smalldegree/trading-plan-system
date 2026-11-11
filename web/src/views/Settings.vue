<template>
  <div class="settings">
    <h2 class="page-title">系统设置</h2>

    <div class="panel account-card">
      <el-avatar :size="52" class="account-avatar">{{ avatarText }}</el-avatar>
      <div class="account-info">
        <div class="account-name">{{ auth.user?.username || '--' }}</div>
        <div class="account-sub">当前登录账户</div>
      </div>
    </div>

    <div class="panel pwd-card">
      <h3 class="card-title">修改密码</h3>
      <el-form label-width="96px" class="pwd-form" :model="form">
        <el-form-item label="原密码">
          <el-input v-model="form.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="form.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="form.confirmPassword" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onSubmit">保存修改</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import api from '../api';
import { useAuthStore } from '../store/auth';

const auth = useAuthStore();
const loading = ref(false);
const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const avatarText = computed(() => (auth.user?.username || '?').slice(0, 1).toUpperCase());

async function onSubmit() {
  if (!form.oldPassword || !form.newPassword) {
    ElMessage.warning('请填写原密码和新密码');
    return;
  }
  if (form.newPassword !== form.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致');
    return;
  }
  loading.value = true;
  try {
    await api.post('/auth/change-password', {
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    });
    ElMessage.success('密码修改成功');
    form.oldPassword = '';
    form.newPassword = '';
    form.confirmPassword = '';
  } catch (e) {
    // 错误提示由拦截器统一处理
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.settings {
  max-width: 720px;
}
.page-title {
  font-size: 22px;
  margin: 0 0 20px;
}
.account-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 24px;
  margin-bottom: 20px;
}
.account-avatar {
  background: linear-gradient(135deg, #d4a643, #a97c2a);
  color: #14100a;
  font-weight: 700;
  font-size: 22px;
}
.account-name {
  font-size: 18px;
  font-weight: 600;
}
.account-sub {
  color: var(--text-2);
  font-size: 13px;
  margin-top: 4px;
}
.pwd-card {
  padding: 22px 24px 10px;
}
.card-title {
  margin: 0 0 20px;
  font-size: 16px;
}
.pwd-form {
  max-width: 440px;
}
</style>
