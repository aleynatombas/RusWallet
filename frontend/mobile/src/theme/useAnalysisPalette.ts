import { useMemo } from 'react';
import { useTheme } from 'react-native-paper';
import { getChartPalette } from './webPaletteMobile';
import { themeColorAlpha } from './themeColorAlpha';

/**
 * Analizler ekranı — web koyu tema (cyan vurgu, slate yüzey) ile Paper hizalı.
 */
export function useAnalysisPalette() {
  const theme = useTheme();
  return useMemo(() => {
    const d = theme.dark;
    const chartColors = getChartPalette(d);
    const prim = theme.colors.primary;
    const outline = theme.colors.outline;
    const onSurf = theme.colors.onSurface;
    const skyEnd = d ? 'rgb(125, 211, 252)' : 'rgb(14, 165, 233)';

    return {
      pageBg: theme.colors.background,
      cardBg: theme.colors.surface,
      innerBg: d ? themeColorAlpha(onSurf, 0.06) : themeColorAlpha(onSurf, 0.04),
      chipBg: d ? themeColorAlpha(onSurf, 0.06) : themeColorAlpha(onSurf, 0.05),
      calendarRowBg: d ? themeColorAlpha(onSurf, 0.05) : themeColorAlpha(onSurf, 0.04),
      border: d ? themeColorAlpha(outline, 0.45) : themeColorAlpha(outline, 0.28),
      muted: theme.colors.onSurfaceVariant,
      fg: theme.colors.onSurface,
      subtitle: theme.colors.onSurfaceVariant,
      accent: prim,
      accentEnd: skyEnd,
      /** Web --chart-* ile uyumlu kategori / çoklu seri */
      chartColors,
      /** İlerleme çubuğu: birincil + cyan gökyüzü + grafik tonu */
      flexBarGradient: [prim, skyEnd, chartColors[2] ?? prim] as const,
      trackRing: d ? themeColorAlpha(onSurf, 0.12) : themeColorAlpha(onSurf, 0.12),
      trackBar: d ? themeColorAlpha(onSurf, 0.08) : themeColorAlpha(onSurf, 0.08),
      /** Hedef / varış kutuları — web’deki yeşil yerine primary (teal–cyan) ailesi */
      emeraldSoft: themeColorAlpha(prim, d ? 0.14 : 0.1),
      emeraldBorder: themeColorAlpha(prim, d ? 0.35 : 0.28),
      emeraldText: d ? 'rgb(186, 230, 253)' : prim,
      varisMutedBox: d ? themeColorAlpha(onSurf, 0.04) : themeColorAlpha(onSurf, 0.05),
      goalFlagBg: d ? themeColorAlpha(onSurf, 0.08) : themeColorAlpha(onSurf, 0.06),
      sparkleBg: themeColorAlpha(prim, d ? 0.2 : 0.15),
      firsatTileBg: d ? themeColorAlpha(theme.colors.scrim, 0.28) : themeColorAlpha(onSurf, 0.06),
      radarEmptyBg: d ? themeColorAlpha(onSurf, 0.03) : themeColorAlpha(onSurf, 0.04),
      hitRowBg: d ? themeColorAlpha(onSurf, 0.04) : themeColorAlpha(onSurf, 0.03),
      deltaBadgeBg: d ? themeColorAlpha(onSurf, 0.06) : themeColorAlpha(onSurf, 0.06),
      dashedBoxBg: d ? themeColorAlpha(onSurf, 0.03) : themeColorAlpha(onSurf, 0.03),
      onboardBtnBg: themeColorAlpha(prim, d ? 0.14 : 0.1),
      onboardBtnText: d ? 'rgb(186, 230, 253)' : prim,
      barTrackLifestyle: d ? themeColorAlpha(onSurf, 0.08) : themeColorAlpha(onSurf, 0.08),
      sliderTrackMax: d ? themeColorAlpha(onSurf, 0.12) : themeColorAlpha(onSurf, 0.15),
      sliderThumb: theme.colors.onSurface,
      outlineBtnBorder: d ? themeColorAlpha(onSurf, 0.2) : themeColorAlpha(onSurf, 0.2),
      varisDateLight: d ? theme.colors.onSurface : prim,
      varisLabelLight: d ? theme.colors.primary : prim,
      lifestyleBarMandatory: d ? 'rgba(248,250,252,0.82)' : '#0f172a',
      lifestyleBarDiscretionary: d ? 'rgba(148,163,184,0.42)' : '#94a3b8',
    };
  }, [theme]);
}
