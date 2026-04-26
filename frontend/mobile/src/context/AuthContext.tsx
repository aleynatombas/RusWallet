import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setTokenGetter, setUnauthorizedHandler } from '../services/api';
import type { AuthUser, AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';
import type { OnboardingStateDto } from '../types/onboarding';

const TOKEN_KEY = 'token';
const USER_KEY = 'ruswallet_user';
const VOLUNTARY_PROFILE_UPDATE_KEY = 'ruswallet_voluntary_profile_update';

function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Partial<AuthUser>;
    if (typeof o.userId !== 'number' || typeof o.email !== 'string') return null;
    return {
      userId: o.userId,
      firstName: o.firstName ?? '',
      lastName: o.lastName ?? '',
      email: o.email,
      onboardingCompleted: o.onboardingCompleted ?? false,
    };
  } catch {
    return null;
  }
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  voluntaryProfileUpdate: boolean;
}

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  applyAuthResponse: (res: AuthResponse) => void;
  setOnboardingCompletedLocal: (completed: boolean) => void;
  setVoluntaryProfileUpdate: (active: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
    voluntaryProfileUpdate: false,
  });

  const logout = useCallback(() => {
    AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, VOLUNTARY_PROFILE_UPDATE_KEY]);
    setState({ token: null, user: null, isLoading: false, voluntaryProfileUpdate: false });
  }, []);

  const setVoluntaryProfileUpdate = useCallback((active: boolean) => {
    void (active
      ? AsyncStorage.setItem(VOLUNTARY_PROFILE_UPDATE_KEY, '1')
      : AsyncStorage.removeItem(VOLUNTARY_PROFILE_UPDATE_KEY));
    setState((s) => ({ ...s, voluntaryProfileUpdate: active }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tokEntry, userEntry, volEntry] = await AsyncStorage.multiGet([
          TOKEN_KEY,
          USER_KEY,
          VOLUNTARY_PROFILE_UPDATE_KEY,
        ]);
        const t = tokEntry[1];
        if (!t) {
          if (!cancelled)
            setState({ token: null, user: null, isLoading: false, voluntaryProfileUpdate: false });
          return;
        }
        const parsed = parseStoredUser(userEntry[1]);
        if (!parsed) {
          await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, VOLUNTARY_PROFILE_UPDATE_KEY]);
          if (!cancelled)
            setState({ token: null, user: null, isLoading: false, voluntaryProfileUpdate: false });
          return;
        }
        let completed = parsed.onboardingCompleted;
        try {
          const { data } = await api.get<OnboardingStateDto>('/Onboarding/state', {
            headers: { Authorization: `Bearer ${t}` },
          });
          completed = data.completed;
        } catch {
          /* çevrimdışı: yerel bayrak */
        }
        const user: AuthUser = { ...parsed, onboardingCompleted: completed };
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        const voluntaryProfileUpdate = volEntry[1] === '1';
        if (!cancelled) setState({ token: t, user, isLoading: false, voluntaryProfileUpdate });
      } catch {
        if (!cancelled)
          setState({ token: null, user: null, isLoading: false, voluntaryProfileUpdate: false });
      }
    })();
    return () => {
      cancelled = true;
    };
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
      const { data: res } = await api.post<AuthUser & { token: string; onboardingCompleted?: boolean }>(
        '/auth/login',
        data
      );
      if (!res?.token) throw new Error('No token');
      const user: AuthUser = {
        userId: res.userId,
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email,
        onboardingCompleted: res.onboardingCompleted ?? false,
      };
      await AsyncStorage.multiSet([
        [TOKEN_KEY, res.token],
        [USER_KEY, JSON.stringify(user)],
      ]);
      await AsyncStorage.removeItem(VOLUNTARY_PROFILE_UPDATE_KEY);
      setState({ token: res.token, user, isLoading: false, voluntaryProfileUpdate: false });
    } finally {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const { data: res } = await api.post<AuthUser & { token: string; onboardingCompleted?: boolean }>(
        '/auth/register',
        data
      );
      if (!res?.token) throw new Error('No token');
      const user: AuthUser = {
        userId: res.userId,
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email,
        onboardingCompleted: res.onboardingCompleted ?? false,
      };
      await AsyncStorage.multiSet([
        [TOKEN_KEY, res.token],
        [USER_KEY, JSON.stringify(user)],
      ]);
      await AsyncStorage.removeItem(VOLUNTARY_PROFILE_UPDATE_KEY);
      setState({ token: res.token, user, isLoading: false, voluntaryProfileUpdate: false });
    } finally {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const applyAuthResponse = useCallback((res: AuthResponse) => {
    setState((s) => {
      const user: AuthUser = {
        userId: res.userId,
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email,
        onboardingCompleted: res.onboardingCompleted ?? s.user?.onboardingCompleted ?? true,
      };
      if (res.token) {
        void AsyncStorage.multiSet([
          [TOKEN_KEY, res.token],
          [USER_KEY, JSON.stringify(user)],
        ]);
        return { ...s, user, token: res.token };
      }
      void AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      return { ...s, user };
    });
  }, []);

  const setOnboardingCompletedLocal = useCallback((completed: boolean) => {
    setState((s) => {
      if (!s.user) return s;
      const user: AuthUser = { ...s.user, onboardingCompleted: completed };
      void AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      return { ...s, user };
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        applyAuthResponse,
        setOnboardingCompletedLocal,
        setVoluntaryProfileUpdate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
