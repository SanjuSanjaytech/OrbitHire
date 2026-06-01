import { create } from 'zustand';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  preferences: {
    emailNotifications: boolean;
    schedulerEnabled: boolean;
    timezone: string;
  };
  lastLogin?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (v: boolean) => void;
  initFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, token) => {
    localStorage.setItem('jh_token', token);
    localStorage.setItem('jh_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    localStorage.removeItem('jh_token');
    localStorage.removeItem('jh_user');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (v) => set({ isLoading: v }),

  initFromStorage: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('jh_token');
    const userStr = localStorage.getItem('jh_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
      } catch {
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
