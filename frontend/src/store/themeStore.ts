import { create } from 'zustand';

type ThemeMode = 'light' | 'dark';

type ThemeState = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const storageKey = 'pft-theme';

function readStoredTheme(): ThemeMode | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const value = window.localStorage.getItem(storageKey);
  return value === 'light' || value === 'dark' ? value : undefined;
}

function resolveTheme(): ThemeMode {
  const storedTheme = readStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKey, theme);
  }
}

const initialTheme = resolveTheme();

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    set({ theme: nextTheme });
  }
}));

export function getInitialTheme() {
  return initialTheme;
}
