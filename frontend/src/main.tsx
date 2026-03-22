import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import './styles/index.css';
import { App } from './app/App';

const queryClient = new QueryClient();

const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
const syncTheme = (isDark: boolean) => {
  document.documentElement.classList.toggle('dark', isDark);
};

syncTheme(colorScheme.matches);
const handleThemeChange = (event: MediaQueryListEvent) => syncTheme(event.matches);
const legacyColorScheme = colorScheme as MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

if ('addEventListener' in colorScheme) {
  colorScheme.addEventListener('change', handleThemeChange);
} else if (legacyColorScheme.addListener) {
  legacyColorScheme.addListener(handleThemeChange);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
