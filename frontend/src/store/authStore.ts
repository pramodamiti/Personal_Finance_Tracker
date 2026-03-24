import { create } from 'zustand';

type User = { id: string; email: string; displayName: string };
type StoredAuth = { accessToken?: string; refreshToken?: string; user?: User };

type AuthState = {
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  setAuth: (payload: Partial<AuthState>) => void;
  logout: () => void;
};

const emptyAuth: StoredAuth = { accessToken: undefined, refreshToken: undefined, user: undefined };

function readStoredAuth(): StoredAuth {
  if (typeof window === 'undefined') {
    return emptyAuth;
  }

  try {
    return JSON.parse(localStorage.getItem('pft-auth') || '{}');
  } catch {
    return emptyAuth;
  }
}

function writeStoredAuth(payload: Partial<StoredAuth>) {
  const next = { ...readStoredAuth(), ...payload };
  if (typeof window !== 'undefined') {
    localStorage.setItem('pft-auth', JSON.stringify(next));
  }
  return next;
}

const initial = readStoredAuth();
export const useAuthStore = create<AuthState>((set) => ({
  ...initial,
  setAuth: (payload) => {
    const next = writeStoredAuth(payload);
    set(next);
  },
  logout: () => {
    clearAuthSnapshot();
    set(emptyAuth);
  }
}));

export function getAuthSnapshot(): StoredAuth {
  const state = useAuthStore.getState();
  const stored = readStoredAuth();

  return {
    accessToken: state.accessToken ?? stored.accessToken,
    refreshToken: state.refreshToken ?? stored.refreshToken,
    user: state.user ?? stored.user
  };
}

export function replaceAuthSnapshot(payload: Partial<StoredAuth>) {
  const next = writeStoredAuth(payload);
  useAuthStore.setState(next);
  return next;
}

export function clearAuthSnapshot() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pft-auth');
  }
  useAuthStore.setState(emptyAuth);
}

export type { User };
