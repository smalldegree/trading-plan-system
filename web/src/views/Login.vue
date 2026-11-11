<template>
  <div class="auth-page">
    <div class="auth-card panel">
      <div class="auth-brand">领</div>
      <h1 class="auth-title">交易计划记录系统</h1>
      <p class="auth-subtitle">做有计划的交易</p>

      <el-form @submit.prevent="onSubmit">
        <el-form-item>
          <el-input v-model="username" placeholder="用户名" size="large" autocomplete="username">
            <template #prefix><el-icon><User /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="password"
            type="password"
            placeholder="密码"
            size="large"
            show-password
            autocomplete="current-password"
            @keyup.enter="onSubmit"
          >
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          class="auth-btn"
          :loading="loading"
          @click="onSubmit"
        >
          登 录
        </el-button>
      </el-form>

      <div class="auth-links">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '../api';
import { useAuthStore } from '../store/auth';

const router = useRouter();
const auth = useAuthStore();

const username = ref('');
const password = ref('');
const loading = ref(false);

async function onSubmit() {
  if (!username.value || !password.value) {
    ElMessage.warning('请输入用户名和密码');
    return;
  }
  loading.value = true;
  try {
    const data = await api.post('/auth/login', {
      username: username.value,
      password: password.value,
    });
    auth.setAuth(data.token, data.user);
    ElMessage.success('登录成功');
    router.push('/trades');
  } catch (e) {
    // 错误提示由拦截器统一处理
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.auth-card {
  width: 380px;
  padding: 38px 34px 30px;
  text-align: center;
}
.auth-brand {
  width: 52px;
  height: 52px;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #d4a643, #a97c2a);
  color: #14100a;
  font-size: 26px;
  font-weight: 700;
}
.auth-title {
  font-size: 20px;
  margin: 0;
  letter-spacing: 1px;
}
.auth-subtitle {
  color: var(--text-2);
  font-size: 13px;
  margin: 6px 0 24px;
}
.auth-btn {
  width: 100%;
  margin-top: 4px;
}
.auth-links {
  margin-top: 18px;
  font-size: 13px;
  color: var(--text-2);
}
.auth-links a {
  color: var(--gold-soft);
  text-decoration: none;
}
</style>
