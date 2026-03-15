import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { api } from '../services/api';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth';

const AUTH_USER_KEY = 'ruswallet_user';

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    token: localStorage.getItem('token'),
    user: loadStoredUser(),
    isLoading: false,
  }));

  const login = useCallback(async (data: LoginRequest) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const { data: res } = await api.post<AuthState['user'] & { token: string }>('/auth/login', data);
      if (!res?.token) throw new Error('No token');
      const user: AuthUser = {
        userId: res.userId,
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email,
      };
      localStorage.setItem('token', res.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      setState({ token: res.token, user, isLoading: false });
    } finally {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const { data: res } = await api.post<AuthState['user'] & { token: string }>('/auth/register', data);
      if (!res?.token) throw new Error('No token');
      const user: AuthUser = {
        userId: res.userId,
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email,
      };
      localStorage.setItem('token', res.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      setState({ token: res.token, user, isLoading: false });
    } finally {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem(AUTH_USER_KEY);
    setState({ token: null, user: null, isLoading: false });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
