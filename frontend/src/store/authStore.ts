import { create } from 'zustand';

type User = { id: string; email: string; displayName: string };

type AuthState = {
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  setAuth: (payload: Partial<AuthState>) => void;
  logout: () => void;
};

const initial = JSON.parse(localStorage.getItem('pft-auth') || '{}');
export const useAuthStore = create<AuthState>((set) => ({
  ...initial,
  setAuth: (payload) => {
    const next = { ...JSON.parse(localStorage.getItem('pft-auth') || '{}'), ...payload };
    localStorage.setItem('pft-auth', JSON.stringify(next));
    set(next);
  },
  logout: () => {
    localStorage.removeItem('pft-auth');
    set({ accessToken: undefined, refreshToken: undefined, user: undefined });
  }
}));
