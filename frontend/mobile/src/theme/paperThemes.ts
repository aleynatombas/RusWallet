import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';
import { DARK_OUTLINE, DARK_PAGE_BACKGROUND, DARK_SURFACE, DARK_SURFACE_VARIANT } from './darkPalette';
import { webPaletteMobile } from './webPaletteMobile';

const fontConfig = configureFonts({ config: {} });

const L = webPaletteMobile.light;
const D = webPaletteMobile.dark;

/**
 * Web `frontend/web/src/index.css` @layer base ile aynı palet (cyan / slate ailesi).
 */
export const lightPaperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: L.primary,
    primaryContainer: L.accent,
    onPrimary: L.onPrimary,
    onPrimaryContainer: L.onAccent,
    background: L.background,
    surface: L.card,
    surfaceVariant: L.muted,
    surfaceDisabled: L.muted,
    onSurface: L.foreground,
    onSurfaceVariant: L.mutedForeground,
    onSurfaceDisabled: 'rgb(148, 163, 184)',
    outline: L.border,
    outlineVariant: L.border,
    shadow: L.foreground,
    scrim: L.foreground,
    inverseSurface: L.foreground,
    inverseOnSurface: L.background,
    inversePrimary: D.primary,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: L.card,
      level2: L.card,
      level3: L.card,
      level4: L.card,
      level5: L.card,
    },
    error: 'rgb(239, 68, 68)',
    onError: 'rgb(255, 255, 255)',
    errorContainer: 'rgb(254, 226, 226)',
    onErrorContainer: 'rgb(69, 10, 10)',
  },
  fonts: fontConfig,
};

export const darkPaperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: D.primary,
    primaryContainer: D.secondary,
    onPrimary: D.onPrimary,
    onPrimaryContainer: D.foreground,
    background: DARK_PAGE_BACKGROUND,
    surface: DARK_SURFACE,
    surfaceVariant: DARK_SURFACE_VARIANT,
    surfaceDisabled: D.muted,
    onSurface: D.foreground,
    onSurfaceVariant: D.mutedForeground,
    onSurfaceDisabled: 'rgb(100, 116, 139)',
    outline: DARK_OUTLINE,
    outlineVariant: DARK_OUTLINE,
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: L.foreground,
    inverseOnSurface: D.background,
    inversePrimary: L.primary,
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: 'transparent',
      level1: DARK_SURFACE,
      level2: DARK_SURFACE_VARIANT,
      level3: DARK_SURFACE_VARIANT,
      level4: D.muted,
      level5: D.muted,
    },
    error: 'rgb(248, 113, 113)',
    onError: 'rgb(127, 29, 29)',
    errorContainer: 'rgb(69, 10, 10)',
    onErrorContainer: 'rgb(254, 226, 226)',
  },
  fonts: fontConfig,
};
