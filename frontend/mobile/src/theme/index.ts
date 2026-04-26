import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { webPaletteMobile } from './webPaletteMobile';

const fontConfig = configureFonts({ config: {} });
const L = webPaletteMobile.light;

/**
 * Eski `appTheme` tüketicileri — web `index.css` :root ile aynı ana renkler.
 */
export const appTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: L.primary,
    primaryContainer: L.accent,
    onPrimary: L.onPrimary,
    onPrimaryContainer: L.onAccent,
    surface: L.card,
    surfaceVariant: L.muted,
    outline: L.border,
    onSurface: L.foreground,
    onSurfaceVariant: L.mutedForeground,
  },
  fonts: fontConfig,
};

export type AppTheme = typeof appTheme;
