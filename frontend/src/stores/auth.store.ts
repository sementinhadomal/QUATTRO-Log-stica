import { create } from 'zustand';
import { User } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      set({ user: null });
      window.location.href = '/login';
    }
  },
  checkAuth: async () => {
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
    }
  }
}));
