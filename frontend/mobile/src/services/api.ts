import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { API_BASE_URL } from '../config/api';

type ApiErrorBody = { message?: string; title?: string };

export const REFRESH_TOKEN_KEY = 'refreshToken';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
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
let refreshTokenGetter: () => string | null = () => null;
let tokenSetter: (access: string | null, refresh?: string | null) => void = () => {};
let unauthorizedHandler: () => void = () => {};

export function setTokenGetter(fn: () => string | null) {
  tokenGetter = fn;
}

export function setRefreshTokenGetter(fn: () => string | null) {
  refreshTokenGetter = fn;
}

export function setTokenSetter(fn: (access: string | null, refresh?: string | null) => void) {
  tokenSetter = fn;
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

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = refreshTokenGetter();
  if (!refresh) return null;
  try {
    const { data } = await axios.post<{ token?: string; refreshToken?: string }>(
      `${API_BASE_URL}/api/auth/refresh`,
      { refreshToken: refresh },
    );
    if (!data?.token) return null;
    tokenSetter(data.token, data.refreshToken ?? refresh);
    return data.token;
  } catch {
    tokenSetter(null, null);
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<ApiErrorBody | string>) => {
    const requestUrl = String(err.config?.url ?? '').toLowerCase();
    const isAuthLoginRequest = requestUrl.includes('/auth/login');
    const isAuthRefreshRequest = requestUrl.includes('/auth/refresh');
    const original = err.config;

    if (
      err.response?.status === 401 &&
      !isAuthLoginRequest &&
      !isAuthRefreshRequest &&
      original &&
      !(original as InternalAxiosRequestConfig & { _retry?: boolean })._retry
    ) {
      if (!refreshInFlight) refreshInFlight = refreshAccessToken().finally(() => { refreshInFlight = null; });
      const newToken = await refreshInFlight;
      if (newToken) {
        (original as InternalAxiosRequestConfig & { _retry?: boolean })._retry = true;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }
      unauthorizedHandler();
    } else if (err.response?.status === 401 && !isAuthLoginRequest) {
      unauthorizedHandler();
    }

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
  },
);
