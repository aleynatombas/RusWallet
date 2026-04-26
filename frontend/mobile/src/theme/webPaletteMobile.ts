/**
 * Web `frontend/web/src/index.css` @layer base (:root / .dark) — HSL → rgb().
 * Mobil Paper + doğrudan hex kullanan bileşenlerle aynı palet.
 */
export const webPaletteMobile = {
  light: {
    background: 'rgb(246, 248, 249)',
    foreground: 'rgb(15, 23, 41)',
    card: 'rgb(255, 255, 255)',
    primary: 'rgb(25, 117, 154)',
    onPrimary: 'rgb(248, 251, 252)',
    muted: 'rgb(235, 238, 239)',
    mutedForeground: 'rgb(90, 104, 124)',
    border: 'rgb(221, 225, 227)',
    secondary: 'rgb(235, 238, 240)',
    onSecondary: 'rgb(29, 68, 83)',
    accent: 'rgb(228, 237, 242)',
    onAccent: 'rgb(29, 68, 83)',
  },
  dark: {
    background: 'rgb(10, 13, 20)',
    foreground: 'rgb(243, 246, 247)',
    card: 'rgb(15, 18, 26)',
    primary: 'rgb(36, 173, 219)',
    onPrimary: 'rgb(12, 17, 29)',
    muted: 'rgb(30, 36, 47)',
    mutedForeground: 'rgb(141, 155, 176)',
    border: 'rgb(37, 44, 55)',
    secondary: 'rgb(27, 34, 44)',
    accent: 'rgb(30, 41, 51)',
  },
} as const;

/** Web `:root` --chart-1 … --chart-5 (HSL → hex) */
export const chartPaletteLight = [
  '#3c869a',
  '#adccd7',
  '#4aa0b5',
  '#9abecb',
  '#69abbf',
] as const;

/** Web `.dark` aynı değişkenler */
export const chartPaletteDark = [
  '#409cb5',
  '#9cc5d3',
  '#54aac0',
  '#89b7c8',
  '#65adc3',
] as const;

export function getChartPalette(isDark: boolean): readonly string[] {
  return isDark ? chartPaletteDark : chartPaletteLight;
}
