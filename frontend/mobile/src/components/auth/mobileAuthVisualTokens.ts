import { DARK_OUTLINE, DARK_PAGE_BACKGROUND, DARK_SURFACE, DARK_SURFACE_VARIANT } from '../../theme/darkPalette';
import { webPaletteMobile } from '../../theme/webPaletteMobile';

const L = webPaletteMobile.light;
const D = webPaletteMobile.dark;

/** Web `index.css` ile aynı tonlar — giriş / kahraman / splash gradientleri */
export const mobileAuthVisual = {
  light: {
    pageGradient: [L.background, L.card, 'rgb(238, 246, 250)'] as const,
    text: L.foreground,
    muted: L.mutedForeground,
    border: L.border,
    inputBg: 'rgba(255,255,255,0.92)',
    tabActive: L.foreground,
    tabInactive: L.mutedForeground,
    tabUnderline: ['rgb(25, 117, 154)', 'rgb(14, 165, 233)'] as const,
    linkPrimary: 'rgb(3, 105, 161)',
    destructive: 'rgb(220, 38, 38)',
    success: 'rgb(22, 163, 74)',
    gradientBtn: ['rgb(25, 117, 154)', 'rgb(8, 145, 178)', 'rgb(14, 165, 233)'] as const,
    gradientBtnDark: ['rgb(14, 165, 233)', 'rgb(34, 211, 238)', 'rgb(56, 189, 248)'] as const,
  },
  dark: {
    pageGradient: [DARK_PAGE_BACKGROUND, DARK_SURFACE, DARK_SURFACE_VARIANT] as const,
    text: D.foreground,
    muted: D.mutedForeground,
    border: DARK_OUTLINE,
    inputBg: 'rgba(15, 18, 26, 0.88)',
    tabActive: D.foreground,
    tabInactive: D.mutedForeground,
    tabUnderline: ['rgb(56, 189, 248)', 'rgb(34, 211, 238)'] as const,
    linkPrimary: 'rgb(125, 211, 252)',
    destructive: 'rgb(248, 113, 113)',
    success: 'rgb(74, 222, 128)',
    gradientBtn: ['rgb(25, 117, 154)', 'rgb(8, 145, 178)', 'rgb(14, 165, 233)'] as const,
    gradientBtnDark: ['rgb(14, 165, 233)', 'rgb(34, 211, 238)', 'rgb(56, 189, 248)'] as const,
  },
} as const;

export const FIELD_HEIGHT = 44;
export const FIELD_RADIUS = 8;
