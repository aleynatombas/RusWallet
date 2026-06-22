import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';

const baseURL = '/api'; // Vite proxy → backend (5140)

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Token: web'de localStorage'dan okuyoruz
function getToken(): string | null {
  return localStorage.getItem('token');
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // multipart boundary için varsayılan application/json üstbilgisini kaldır
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ message?: string; title?: string }>) => {
    const requestUrl = String(err.config?.url ?? '').toLowerCase();
    const isAuthLoginRequest = requestUrl.includes('/auth/login');
    if (err.response?.status === 401 && !isAuthLoginRequest) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const data = err.response?.data;
    const detail =
      typeof data === 'string'
        ? data
        : data && typeof data === 'object'
          ? (data as { message?: string }).message ?? (data as { title?: string }).title
          : undefined;
    if (detail && err.message) {
      err.message = `${err.message} — ${detail}`;
    } else if (detail) {
      err.message = detail;
    }
    return Promise.reject(err);
  }
);
