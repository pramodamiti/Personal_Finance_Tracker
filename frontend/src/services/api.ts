import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'https://your-codespace-name-8080.app.github.dev/api';
export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const auth = localStorage.getItem('pft-auth');
  if (auth) {
    const parsed = JSON.parse(auth);
    if (parsed.accessToken) config.headers.Authorization = `Bearer ${parsed.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const auth = localStorage.getItem('pft-auth');
    if (error.response?.status === 401 && auth) {
      const parsed = JSON.parse(auth);
      if (parsed.refreshToken && !error.config._retry) {
        error.config._retry = true;
        const refresh = await axios.post(`${baseURL}/auth/refresh`, { refreshToken: parsed.refreshToken });
        const next = { ...parsed, ...refresh.data };
        localStorage.setItem('pft-auth', JSON.stringify(next));
        error.config.headers.Authorization = `Bearer ${next.accessToken}`;
        return api.request(error.config);
      }
      localStorage.removeItem('pft-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
