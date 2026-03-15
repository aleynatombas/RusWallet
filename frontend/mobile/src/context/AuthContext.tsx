import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setTokenGetter, setUnauthorizedHandler } from '../services/api';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth';

const TOKEN_KEY = 'token';
const USER_KEY = 'ruswallet_user';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
  });

  const logout = useCallback(() => {
    AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setState({ token: null, user: null, isLoading: false });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [token, userJson] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
        const t = token[1];
        const user = userJson[1] ? (JSON.parse(userJson[1]) as AuthUser) : null;
        setState({ token: t, user, isLoading: false });
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  useEffect(() => {
    setTokenGetter(() => state.token);
  }, [state.token]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  const login = useCallback(async (data: LoginRequest) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const { data: res } = await api.post<AuthUser & { token: string }>('/auth/login', data);
      if (!res?.token) throw new Error('No token');
      const user: AuthUser = {
        userId: res.userId,
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email,
      };
      await AsyncStorage.multiSet([
        [TOKEN_KEY, res.token],
        [USER_KEY, JSON.stringify(user)],
      ]);
      setState({ token: res.token, user, isLoading: false });
    } finally {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const { data: res } = await api.post<AuthUser & { token: string }>('/auth/register', data);
      if (!res?.token) throw new Error('No token');
      const user: AuthUser = {
        userId: res.userId,
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email,
      };
      await AsyncStorage.multiSet([
        [TOKEN_KEY, res.token],
        [USER_KEY, JSON.stringify(user)],
      ]);
      setState({ token: res.token, user, isLoading: false });
    } finally {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
