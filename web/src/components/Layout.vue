<template>
  <div class="layout">
    <aside class="sidebar" :class="{ collapsed }">
      <div class="brand">
        <div class="brand-logo">领</div>
        <div v-show="!collapsed" class="brand-text">
          <div class="brand-title">交易计划</div>
          <div class="brand-sub">做有计划的交易</div>
        </div>
      </div>

      <nav class="nav">
        <router-link to="/trades" class="nav-item" active-class="active" :title="collapsed ? '交易计划' : ''">
          <el-icon><DataLine /></el-icon>
          <span v-show="!collapsed">交易计划</span>
        </router-link>
        <router-link to="/settings" class="nav-item" active-class="active" :title="collapsed ? '系统设置' : ''">
          <el-icon><Setting /></el-icon>
          <span v-show="!collapsed">系统设置</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="user-box">
          <el-avatar :size="32" class="user-avatar">{{ avatarText }}</el-avatar>
          <div v-show="!collapsed" class="user-name">{{ auth.user?.username || '--' }}</div>
        </div>
        <el-button text class="logout-btn" @click="onLogout" :title="collapsed ? '退出登录' : ''">
          <el-icon><SwitchButton /></el-icon>
          <span v-show="!collapsed">退出登录</span>
        </el-button>
      </div>

      <div class="collapse-toggle" @click="collapsed = !collapsed">
        <el-icon><component :is="collapsed ? 'Expand' : 'Fold'" /></el-icon>
      </div>
    </aside>

    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { useAuthStore } from '../store/auth';

const auth = useAuthStore();
const router = useRouter();

const collapsed = ref(true);

const avatarText = computed(() => (auth.user?.username || '?').slice(0, 1).toUpperCase());

async function onLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
      type: 'warning',
      confirmButtonText: '退出',
      cancelButtonText: '取消',
    });
  } catch (e) {
    return;
  }
  auth.logout();
  router.push('/login');
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100%;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ffffff 0%, #f5f7fb 100%);
  border-right: 1px solid var(--border);
  transition: width 0.2s ease;
}
.sidebar.collapsed {
  width: 64px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px;
  border-bottom: 1px solid var(--border);
  transition: padding 0.2s ease;
}
.sidebar.collapsed .brand {
  padding: 16px 12px;
  justify-content: center;
}

.brand-logo {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(135deg, #d4a643 0%, #a97c2a 100%);
  color: #14100a;
  font-size: 20px;
  font-weight: 700;
}

.brand-title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}
.brand-sub {
  font-size: 11px;
  color: var(--text-2);
  margin-top: 2px;
}

.nav {
  flex: 1;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-radius: 9px;
  color: var(--text-2);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.15s;
}
.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 11px 0;
}
.nav-item:hover {
  color: var(--text);
  background: var(--hover-bg);
}
.nav-item.active {
  color: var(--gold-soft);
  background: linear-gradient(90deg, rgba(212, 166, 67, 0.16) 0%, rgba(212, 166, 67, 0.04) 100%);
}

.sidebar-footer {
  padding: 14px;
  border-top: 1px solid var(--border);
}
.user-box {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.sidebar.collapsed .user-box {
  justify-content: center;
}
.user-avatar {
  background: linear-gradient(135deg, #d4a643, #a97c2a);
  color: #14100a;
  font-weight: 700;
}
.user-name {
  font-size: 14px;
  font-weight: 500;
}
.logout-btn {
  width: 100%;
  justify-content: flex-start;
  color: var(--text-2);
  padding-left: 10px;
}
.sidebar.collapsed .logout-btn {
  justify-content: center;
  padding-left: 0;
  padding-right: 0;
}
.logout-btn:hover {
  color: var(--profit);
}

.collapse-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  border-top: 1px solid var(--border);
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.15s;
}
.collapse-toggle:hover {
  color: var(--gold-soft);
  background: var(--hover-bg);
}

.main {
  flex: 1;
  min-width: 0;
  overflow: auto;
  padding: 22px 24px;
}
</style>
