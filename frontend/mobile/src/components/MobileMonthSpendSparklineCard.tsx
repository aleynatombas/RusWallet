/**
 * Web MonthSpendSparklineCard — pürüzsüz çizgi + hafif alan dolgusu (react-native-svg Path).
 */
import { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import { AnalysisCard } from './analysis/AnalysisCard';
import type { MonthSpendSparklineDto } from '../types/financialRoadmap';
import { cubicLinePath, areaPathFromLine, type Pt } from './analysis/chartPath';
import { useAnalysisPalette } from '../theme/useAnalysisPalette';

const CHART_H = 128;
const PAD_X = 8;
const PAD_Y = 12;

export function MobileMonthSpendSparklineCard({
  sparkline,
}: {
  sparkline: MonthSpendSparklineDto | null | undefined;
}) {
  const p = useAnalysisPalette();
  const points = sparkline?.points ?? [];
  const data = points.map((pt) => ({ name: pt.shortLabel, expense: Number(pt.totalExpense) }));
  const hasData = data.length > 0;

  const [w, setW] = useState(300);

  let lo = 0;
  let hi = 1;
  if (hasData) {
    const maxV = Math.max(...data.map((d) => d.expense), 1);
    const minV = Math.min(...data.map((d) => d.expense));
    const span = Math.max(maxV - minV, maxV * 0.06, 80);
    lo = minV - span * 0.12;
    hi = maxV + span * 0.12;
  }

  const innerW = Math.max(0, w - PAD_X * 2);
  const innerH = CHART_H - PAD_Y * 2 - 14;
  const n = data.length;
  const bottomY = PAD_Y + innerH;

  const pts: Pt[] = hasData
    ? data.map((d, i) => {
      const x = PAD_X + (n <= 1 ? innerW / 2 : (i / Math.max(1, n - 1)) * innerW);
      const t = hi > lo ? (d.expense - lo) / (hi - lo) : 0.5;
      const y = PAD_Y + innerH - t * innerH;
      return { x, y };
    })
    : [];

  const linePath = pts.length > 0 ? cubicLinePath(pts) : '';
  const first = pts[0];
  const last = pts[pts.length - 1];
  const areaPath =
    pts.length > 0 && first && last ? areaPathFromLine(linePath, last, first, bottomY + 0.5) : '';

  function onLayout(e: LayoutChangeEvent) {
    const width = e.nativeEvent.layout.width;
    if (width > 0) setW(width);
  }

  const delta = sparkline?.percentChangeVsPreviousMonth;
  const deltaBadge = (() => {
    if (!sparkline?.hasComparableData) {
      return <Text style={[styles.deltaMuted, { color: p.muted }]}>Kayıt az</Text>;
    }
    if (delta == null) {
      return <Text style={[styles.deltaMuted, { color: p.muted }]}>Önceki ay için veri yok</Text>;
    }

    const abs = Math.abs(delta);
    const formatted = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(abs);
    const worse = delta > 2;
    const better = delta < -2;
    const color = worse ? '#ef4444' : better ? p.accent : p.muted;
    const arrow = delta >= 0 ? '↑' : '↓';

    return (
      <Text style={[styles.deltaStrong, { color }]}>
        {arrow} %{formatted}
      </Text>
    );
  })();

  return (
    <AnalysisCard title="Son 6 ay — gider eğrisi" subtitle="Aynı güne kadar toplam" headerBorder>
      <View style={styles.titleRow}>{deltaBadge}</View>
      <View onLayout={onLayout} style={styles.chartWrap}>
        {!hasData ? (
          <Text style={[styles.empty, { color: p.muted }]}>Bu grafik için yeterli işlem yok.</Text>
        ) : (
          <Svg width={w} height={CHART_H}>
            <Defs>
              <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={p.accent} stopOpacity="0.35" />
                <Stop offset="1" stopColor={p.accentEnd} stopOpacity="0.02" />
              </LinearGradient>
            </Defs>
            <Line
              x1={PAD_X}
              y1={bottomY}
              x2={w - PAD_X}
              y2={bottomY}
              stroke={p.muted}
              strokeOpacity={0.25}
              strokeWidth={1}
            />
            {areaPath ? <Path d={areaPath} fill="url(#areaFill)" /> : null}
            {linePath ? (
              <Path d={linePath} fill="none" stroke={p.accent} strokeWidth={2.25} strokeLinecap="round" />
            ) : null}
            {data.map((d, i) => {
              const x = PAD_X + (n <= 1 ? innerW / 2 : (i / Math.max(1, n - 1)) * innerW);
              const label = d.name.length > 3 ? d.name.slice(0, 3) : d.name;
              return (
                <SvgText key={`${d.name}-${i}`} x={x} y={CHART_H - 2} fontSize={9} fill={p.muted} textAnchor="middle">
                  {label}
                </SvgText>
              );
            })}
          </Svg>
        )}
      </View>
    </AnalysisCard>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4, marginTop: -8 },
  chartWrap: { minHeight: CHART_H, paddingTop: 4 },
  empty: { fontSize: 11, textAlign: 'center', paddingVertical: 24 },
  deltaMuted: { fontSize: 10, fontWeight: '500' },
  deltaStrong: { fontSize: 11, fontWeight: '700' },
});
