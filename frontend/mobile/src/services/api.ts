import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { API_BASE_URL } from '../config/api';

type ApiErrorBody = { message?: string; title?: string };

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  /** Mobil / yavaş ağ ve soğuk API: 15s sık yetmez; analiz ve fiş uçları uzun sürebilir */
  timeout: 60000,
});

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const isTimeout =
      err.code === 'ECONNABORTED' || /timeout/i.test(String(err.message ?? ''));
    if (!err.response && isTimeout) {
      return 'Sunucu zamanında yanıt vermedi. Bağlantınızı ve API adresini kontrol edip tekrar deneyin.';
    }
    const data = err.response?.data as string | ApiErrorBody | undefined;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
      const msg = data.message ?? data.title;
      if (typeof msg === 'string' && msg.trim()) return msg;
    }
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

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
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiErrorBody | string>) => {
    if (err.response?.status === 401) unauthorizedHandler();
    const data = err.response?.data;
    const detail =
      typeof data === 'string'
        ? data
        : data && typeof data === 'object'
          ? data.message ?? data.title
          : undefined;
    if (detail && err.message) {
      err.message = `${err.message} — ${detail}`;
    } else if (detail) {
      err.message = detail;
    }
    return Promise.reject(err);
  }
);
