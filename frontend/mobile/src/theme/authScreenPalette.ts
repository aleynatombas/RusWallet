/**
 * Koyu giriş/kayıt ekranı — `darkPalette` ile ana uygulama zemini aynı.
 */
import { DARK_OUTLINE, DARK_PAGE_BACKGROUND, DARK_SURFACE } from './darkPalette';

export const AUTH_SCREEN_DARK = {
  pageBg: DARK_PAGE_BACKGROUND,
  cardBg: DARK_SURFACE,
  border: DARK_OUTLINE,
  title: '#ffffff',
  subtitle: '#9ca3af',
  inputFill: DARK_SURFACE,
  placeholder: '#64748b',
  primaryButton: '#4f56f1',
  onPrimary: '#ffffff',
  /** "Şifreni sıfırla" — soluk, vurgusuz */
  mutedLink: '#9ca3af',
  /** "Kayıt ol" — birincil renk */
  linkAccent: '#4f56f1',
} as const;
