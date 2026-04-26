import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';
import { DARK_OUTLINE, DARK_PAGE_BACKGROUND, DARK_SURFACE, DARK_SURFACE_VARIANT } from './darkPalette';

const fontConfig = configureFonts({ config: {} });

/**
 * Web `src/index.css` :root ve .dark HSL değişkenleriyle birebir hizalı (shadcn).
 * Açık: --background 0 0% 100%, --foreground 222.2 84% 4.9%, --primary 238 84% 55%, vb.
 * Koyu: --background 222.2 84% 4.9%, --foreground 210 40% 98%, vb.
 */

/** :root — background / card beyaz; yüzey varyantı --muted (210 40% 96.1%) */
export const lightPaperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: 'rgb(79, 70, 229)', // hsl(238 84% 55%) ≈ indigo-600
    primaryContainer: 'rgb(238, 242, 255)',
    onPrimary: 'rgb(255, 255, 255)',
    onPrimaryContainer: 'rgb(30, 27, 75)',
    background: 'rgb(255, 255, 255)', // --background: 0 0% 100%
    surface: 'rgb(255, 255, 255)', // --card: 0 0% 100%
    surfaceVariant: 'rgb(241, 245, 249)', // --muted: 210 40% 96.1%
    surfaceDisabled: 'rgb(241, 245, 249)',
    onSurface: 'rgb(2, 8, 23)', // --foreground: 222.2 84% 4.9%
    onSurfaceVariant: 'rgb(100, 116, 139)', // --muted-foreground: 215.4 16.3% 46.9%
    onSurfaceDisabled: 'rgb(148, 163, 184)',
    outline: 'rgb(226, 232, 240)', // --border: 214.3 31.8% 91.4%
    outlineVariant: 'rgb(226, 232, 240)',
    shadow: 'rgb(2, 8, 23)',
    scrim: 'rgb(2, 8, 23)',
    inverseSurface: 'rgb(2, 8, 23)',
    inverseOnSurface: 'rgb(248, 250, 252)',
    inversePrimary: 'rgb(165, 180, 252)',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: 'rgb(255, 255, 255)',
      level2: 'rgb(255, 255, 255)',
      level3: 'rgb(255, 255, 255)',
      level4: 'rgb(255, 255, 255)',
      level5: 'rgb(255, 255, 255)',
    },
    error: 'rgb(239, 68, 68)',
    onError: 'rgb(255, 255, 255)',
    errorContainer: 'rgb(254, 226, 226)',
    onErrorContainer: 'rgb(69, 10, 10)',
  },
  fonts: fontConfig,
};

/** .dark — canlı lacivert zemin + kart yüzeyi (`darkPalette.ts`) */
export const darkPaperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4f56f1',
    primaryContainer: 'rgb(49, 46, 129)',
    onPrimary: '#ffffff',
    onPrimaryContainer: 'rgb(224, 231, 255)',
    background: DARK_PAGE_BACKGROUND,
    surface: DARK_SURFACE,
    surfaceVariant: DARK_SURFACE_VARIANT,
    surfaceDisabled: 'rgb(30, 41, 59)',
    onSurface: '#ffffff',
    onSurfaceVariant: '#9ca3af',
    onSurfaceDisabled: 'rgb(100, 116, 139)',
    outline: DARK_OUTLINE,
    outlineVariant: DARK_OUTLINE,
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(248, 250, 252)',
    inverseOnSurface: 'rgb(15, 23, 42)',
    inversePrimary: 'rgb(67, 56, 202)',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: 'transparent',
      level1: DARK_SURFACE,
      level2: DARK_SURFACE_VARIANT,
      level3: DARK_SURFACE_VARIANT,
      level4: 'rgb(51, 65, 85)',
      level5: 'rgb(51, 65, 85)',
    },
    error: 'rgb(248, 113, 113)',
    onError: 'rgb(127, 29, 29)',
    errorContainer: 'rgb(69, 10, 10)',
    onErrorContainer: 'rgb(254, 226, 226)',
  },
  fonts: fontConfig,
};
