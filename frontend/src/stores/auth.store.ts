import { create } from 'zustand';
import { User } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null, token?: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const getInitialUser = (): User | null => {
  try {
    const item = localStorage.getItem('quattro_user');
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
};

export const useAuth = create<AuthState>((set) => ({
  user: getInitialUser(),
  isLoading: false,
  setUser: (user, token) => {
    if (user) {
      localStorage.setItem('quattro_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('quattro_user');
    }
    if (token) {
      localStorage.setItem('quattro_token', token);
    }
    set({ user, isLoading: false });
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      localStorage.removeItem('quattro_user');
      localStorage.removeItem('quattro_token');
      set({ user: null, isLoading: false });
      window.location.href = '/login';
    }
  },
  checkAuth: async () => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data;
      localStorage.setItem('quattro_user', JSON.stringify(user));
      set({ user, isLoading: false });
    } catch (error) {
      const saved = getInitialUser();
      set({ user: saved, isLoading: false });
    }
  }
}));
