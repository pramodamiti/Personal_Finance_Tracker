import axios from 'axios';
import { clearAuthSnapshot, getAuthSnapshot, replaceAuthSnapshot } from '../store/authStore';

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function resolveBaseURL(): string {
  const env = import.meta.env.VITE_API_BASE_URL as string | undefined;

  // If we're served from a Worker/Pages site that proxies `/api/*`, keep everything same-origin.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith('.workers.dev') || host.endsWith('.pages.dev')) {
      return '/api';
    }
  }

  // Cloudflare Workers static-assets deployments can't use runtime "Worker vars",
  // so allow setting the API base URL via a query param once and persist it.
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      const fromQuery = url.searchParams.get('apiBaseUrl');
      if (fromQuery) {
        const normalized = normalizeBaseUrl(fromQuery);
        try {
          localStorage.setItem('pft-api-base-url', normalized);
        } catch {
          // Ignore storage failures (e.g. private browsing); still use the query override for this session.
        }
        url.searchParams.delete('apiBaseUrl');
        window.history.replaceState({}, '', url.toString());
        return normalized;
      }

      const stored = localStorage.getItem('pft-api-base-url');
      if (stored) return normalizeBaseUrl(stored);
    } catch {
      // Ignore URL/localStorage failures and fall back.
    }

    // Helpful default for Codespaces when running frontend + backend there.
    const { hostname } = window.location;
    if (hostname.endsWith('.app.github.dev')) {
      return `https://${hostname.replace(/-\\d+\\.app\\.github\\.dev$/, '-8080.app.github.dev')}/api`;
    }
  }

  if (env) return normalizeBaseUrl(env);
  return 'https://friendly-pancake-69749gv7xp9qhrwx-8080.app.github.dev/api';
}

const baseURL = resolveBaseURL();
export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const auth = getAuthSnapshot();
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const auth = getAuthSnapshot();
    if (error.response?.status === 401 && auth.refreshToken) {
      if (!error.config._retry) {
        error.config._retry = true;
        try {
          const refresh = await axios.post(`${baseURL}/auth/refresh`, { refreshToken: auth.refreshToken });
          const next = replaceAuthSnapshot(refresh.data);
          error.config.headers.Authorization = `Bearer ${next.accessToken}`;
          return api.request(error.config);
        } catch (refreshError) {
          clearAuthSnapshot();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      clearAuthSnapshot();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
