import { create } from 'zustand';
import api from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('nexivora_token'),
  isAuthenticated: !!localStorage.getItem('nexivora_token'),
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', credentials);
      localStorage.setItem('nexivora_token', data.token);
      set({ user: data, token: data.token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', userData);
      localStorage.setItem('nexivora_token', data.token);
      set({ user: data, token: data.token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('nexivora_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('nexivora_token');
    if (!token) return;
    
    try {
      const { data } = await api.get('/auth/profile');
      set({ user: data, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('nexivora_token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  }
}));
