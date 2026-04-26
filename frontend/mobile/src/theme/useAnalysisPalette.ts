import { useMemo } from 'react';
import { useTheme } from 'react-native-paper';

/**
 * Analizler ekranı — Paper temasına bağlı (aydınlık / koyu).
 */
export function useAnalysisPalette() {
  const theme = useTheme();
  return useMemo(() => {
    const d = theme.dark;
    return {
      pageBg: theme.colors.background,
      cardBg: theme.colors.surface,
      innerBg: d ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
      chipBg: d ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
      calendarRowBg: d ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)',
      border: d ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.12)',
      muted: theme.colors.onSurfaceVariant,
      fg: theme.colors.onSurface,
      subtitle: theme.colors.onSurfaceVariant,
      accent: theme.colors.primary,
      accentEnd: '#818cf8',
      trackRing: d ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)',
      trackBar: d ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
      emeraldSoft: d ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.1)',
      emeraldBorder: d ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.28)',
      emeraldText: d ? '#a7f3d0' : '#047857',
      varisMutedBox: d ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.05)',
      goalFlagBg: d ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
      sparkleBg: d ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)',
      firsatTileBg: d ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.04)',
      radarEmptyBg: d ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.04)',
      hitRowBg: d ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)',
      deltaBadgeBg: d ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
      dashedBoxBg: d ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.03)',
      onboardBtnBg: d ? 'rgba(79,86,241,0.12)' : 'rgba(79,86,241,0.1)',
      onboardBtnText: d ? '#c4b5fd' : theme.colors.primary,
      barTrackLifestyle: d ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
      sliderTrackMax: d ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.15)',
      sliderThumb: d ? '#f8fafc' : theme.colors.onSurface,
      outlineBtnBorder: d ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.2)',
      varisDateLight: d ? '#ecfdf5' : '#065f46',
      varisLabelLight: d ? '#6ee7b7' : '#047857',
      lifestyleBarMandatory: d ? 'rgba(248,250,252,0.82)' : '#0f172a',
      lifestyleBarDiscretionary: d ? 'rgba(148,163,184,0.42)' : '#94a3b8',
    };
  }, [theme]);
}
