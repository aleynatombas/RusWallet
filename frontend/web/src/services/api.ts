import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';

const apiRoot = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
export const api = axios.create({
  baseURL: apiRoot ? `${apiRoot}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

const REFRESH_KEY = 'refreshToken';

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setAuthTokens(access: string | null, refresh?: string | null) {
  if (access) localStorage.setItem('token', access);
  else localStorage.removeItem('token');
  if (refresh !== undefined) {
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    else localStorage.removeItem(REFRESH_KEY);
  }
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const { data } = await axios.post<{
      token?: string;
      refreshToken?: string;
    }>(`${api.defaults.baseURL}/auth/refresh`, { refreshToken: refresh });
    if (!data?.token) return null;
    setAuthTokens(data.token, data.refreshToken ?? refresh);
    return data.token;
  } catch {
    setAuthTokens(null, null);
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<{ message?: string; title?: string }>) => {
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
      localStorage.removeItem('token');
      localStorage.removeItem(REFRESH_KEY);
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
  },
);
