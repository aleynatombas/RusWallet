import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../services/api';
import type { AuthUser, AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';
import type { OnboardingStateDto } from '../types/onboarding';

const AUTH_USER_KEY = 'ruswallet_user';
/** Gönüllü profil güncelleme sohbeti (yeniden aç) — sayfa yenilense bile hatırlansın. */
const VOLUNTARY_PROFILE_UPDATE_KEY = 'ruswallet_voluntary_profile_update';

function readVoluntaryFromSession(): boolean {
  try {
    return sessionStorage.getItem(VOLUNTARY_PROFILE_UPDATE_KEY) === '1';
  } catch {
    return false;
  }
}

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
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
  /** Token varken onboarding durumu API ile doğrulanana kadar false. */
  authHydrated: boolean;
  /** Profil tamamlanmış kullanıcı “sohbetle güncelle” ile açtıysa; ana sayfaya çıkışa izin vermek için. */
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

function readToken(): string | null {
  return localStorage.getItem('token');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = readToken();
    return {
      token,
      user: loadStoredUser(),
      isLoading: false,
      authHydrated: !token,
      voluntaryProfileUpdate: readVoluntaryFromSession(),
    };
  });

  useEffect(() => {
    const token = state.token;
    if (!token) {
      setState((s) => ({ ...s, authHydrated: true }));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<OnboardingStateDto>('/Onboarding/state');
        if (cancelled) return;
        setState((s) => {
          const base = s.user ?? loadStoredUser();
          if (!base) return { ...s, authHydrated: true };
          const next: AuthUser = { ...base, onboardingCompleted: data.completed };
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(next));
          return { ...s, user: next, authHydrated: true };
        });
      } catch {
        if (!cancelled) setState((s) => ({ ...s, authHydrated: true }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.token]);

  const login = useCallback(async (data: LoginRequest) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const { data: res } = await api.post<
        AuthUser & { token: string; onboardingCompleted?: boolean }
      >('/auth/login', data);
      if (!res?.token) throw new Error('No token');
      const user: AuthUser = {
        userId: res.userId,
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email,
        onboardingCompleted: res.onboardingCompleted ?? false,
      };
      localStorage.setItem('token', res.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      try {
        sessionStorage.removeItem(VOLUNTARY_PROFILE_UPDATE_KEY);
      } catch {
        /* ignore */
      }
      setState({
        token: res.token,
        user,
        isLoading: false,
        authHydrated: false,
        voluntaryProfileUpdate: false,
      });
    } finally {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const { data: res } = await api.post<
        AuthUser & { token: string; onboardingCompleted?: boolean }
      >('/auth/register', data);
      if (!res?.token) throw new Error('No token');
      const user: AuthUser = {
        userId: res.userId,
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email,
        onboardingCompleted: res.onboardingCompleted ?? false,
      };
      localStorage.setItem('token', res.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      try {
        sessionStorage.removeItem(VOLUNTARY_PROFILE_UPDATE_KEY);
      } catch {
        /* ignore */
      }
      setState({
        token: res.token,
        user,
        isLoading: false,
        authHydrated: false,
        voluntaryProfileUpdate: false,
      });
    } finally {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem(AUTH_USER_KEY);
    try {
      sessionStorage.removeItem(VOLUNTARY_PROFILE_UPDATE_KEY);
    } catch {
      /* ignore */
    }
    setState({
      token: null,
      user: null,
      isLoading: false,
      authHydrated: true,
      voluntaryProfileUpdate: false,
    });
  }, []);

  const setVoluntaryProfileUpdate = useCallback((active: boolean) => {
    try {
      if (active) sessionStorage.setItem(VOLUNTARY_PROFILE_UPDATE_KEY, '1');
      else sessionStorage.removeItem(VOLUNTARY_PROFILE_UPDATE_KEY);
    } catch {
      /* ignore */
    }
    setState((s) => ({ ...s, voluntaryProfileUpdate: active }));
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
      if (res.token) localStorage.setItem('token', res.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      return { ...s, user, token: res.token ?? s.token };
    });
  }, []);

  const setOnboardingCompletedLocal = useCallback((completed: boolean) => {
    setState((s) => {
      if (!s.user) return s;
      const user: AuthUser = { ...s.user, onboardingCompleted: completed };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      return { ...s, user };
    });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    applyAuthResponse,
    setOnboardingCompletedLocal,
    setVoluntaryProfileUpdate,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
