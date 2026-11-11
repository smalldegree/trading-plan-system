import { createRouter, createWebHistory } from 'vue-router';
import Layout from '../components/Layout.vue';

const routes = [
  {
    path: '/login',
    component: () => import('../views/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/register',
    component: () => import('../views/Register.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', redirect: '/trades' },
      { path: 'trades', component: () => import('../views/Dashboard.vue') },
      { path: 'settings', component: () => import('../views/Settings.vue') },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const token = localStorage.getItem('token');
  if (!to.meta.public && !token) return '/login';
  if (to.meta.public && token) return '/trades';
  return true;
});

export default router;
