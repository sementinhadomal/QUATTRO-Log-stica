import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('quattro_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/me');

    if (error.response?.status === 401 && !isAuthRoute && window.location.pathname !== '/login') {
      localStorage.removeItem('quattro_user');
      localStorage.removeItem('quattro_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
