import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaperProvider, type MD3Theme } from 'react-native-paper';
import { darkPaperTheme, lightPaperTheme } from '../theme/paperThemes';

const STORAGE_KEY = 'ruswallet-theme';

type Mode = 'light' | 'dark';

interface ThemeContextValue {
  mode: Mode;
  toggleTheme: () => void;
  /** Web’deki `setTheme` ile aynı: açık / koyu seçimi */
  setThemeMode: (mode: Mode) => void;
  paperTheme: MD3Theme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** İlk açılış koyu (giriş ekranı referansı); kayıtlı tercih AsyncStorage’dan. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('dark');

  useEffect(() => {
    void (async () => {
      try {
        const v = await AsyncStorage.getItem(STORAGE_KEY);
        if (v === 'dark' || v === 'light') setMode(v);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next: Mode = prev === 'dark' ? 'light' : 'dark';
      void AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const setThemeMode = useCallback((next: Mode) => {
    setMode(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const paperTheme = useMemo(() => (mode === 'dark' ? darkPaperTheme : lightPaperTheme), [mode]);

  const value = useMemo(
    () => ({ mode, toggleTheme, setThemeMode, paperTheme }),
    [mode, toggleTheme, setThemeMode, paperTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
