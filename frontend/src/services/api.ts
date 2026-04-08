import axios from 'axios';
import { clearAuthSnapshot, getAuthSnapshot, replaceAuthSnapshot } from '../store/authStore';

function resolveBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8080/api';
    }

    return `${window.location.origin.replace(/\/+$/, '')}/api`;
  }

  return '/api';
}

const baseURL = resolveBaseUrl();
export const api = axios.create({
  baseURL,
  timeout: 15000
});

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
