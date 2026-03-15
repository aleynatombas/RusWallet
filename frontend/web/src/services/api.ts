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
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
