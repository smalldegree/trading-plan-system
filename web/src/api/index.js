import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '../router';

const api = axios.create({ baseURL: '/api', timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message || '请求失败，请稍后重试';
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login');
      }
    }
    ElMessage.error(message);
    return Promise.reject(err);
  }
);

export default api;
