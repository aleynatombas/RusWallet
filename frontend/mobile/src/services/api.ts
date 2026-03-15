import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { API_BASE_URL } from '../config/api';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15 saniye (mobil ağda timeout exceeded azalsın)
});

let tokenGetter: () => string | null = () => null;
let unauthorizedHandler: () => void = () => {};

export function setTokenGetter(fn: () => string | null) {
  tokenGetter = fn;
}

export function setUnauthorizedHandler(fn: () => void) {
  unauthorizedHandler = fn;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenGetter();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) unauthorizedHandler();
    return Promise.reject(err);
  }
);
