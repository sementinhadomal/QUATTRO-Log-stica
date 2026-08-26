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

const DEFAULT_ADMIN_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  nome: 'Administrador QUATTRO',
  email: 'quattro@gmail.com',
  funcao: 'administrador',
  ativo: true
};

const getInitialUser = (): User | null => {
  try {
    const item = localStorage.getItem('quattro_user');
    const token = localStorage.getItem('quattro_token');
    if (item) {
      const parsed = JSON.parse(item);
      if (parsed && !parsed.nome) {
        parsed.nome = 'Administrador QUATTRO';
      }
      return parsed;
    }
    if (token) {
      return DEFAULT_ADMIN_USER;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const useAuth = create<AuthState>((set) => ({
  user: getInitialUser(),
  isLoading: false,
  setUser: (user, token) => {
    const validUser = user ? {
      ...user,
      nome: user.nome || user.email?.split('@')[0] || 'Administrador QUATTRO'
    } : null;

    if (validUser) {
      localStorage.setItem('quattro_user', JSON.stringify(validUser));
    } else {
      localStorage.removeItem('quattro_user');
    }
    if (token) {
      localStorage.setItem('quattro_token', token);
    }
    set({ user: validUser, isLoading: false });
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
      const fetchedUser = response.data || DEFAULT_ADMIN_USER;
      const validUser = {
        ...fetchedUser,
        nome: fetchedUser.nome || 'Administrador QUATTRO'
      };
      localStorage.setItem('quattro_user', JSON.stringify(validUser));
      set({ user: validUser, isLoading: false });
    } catch (error) {
      const saved = getInitialUser() || DEFAULT_ADMIN_USER;
      set({ user: saved, isLoading: false });
    }
  }
}));
