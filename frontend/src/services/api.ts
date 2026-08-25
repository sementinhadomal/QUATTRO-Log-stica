import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/me');

    if (error.response?.status === 401 && !isAuthRoute && window.location.pathname !== '/login') {
      localStorage.removeItem('quattro_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
