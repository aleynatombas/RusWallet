import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AnalysisCard } from './AnalysisCard';
import type { FinancialCockpitDto } from '../../types/financialRoadmap';
import { useAnalysisPalette } from '../../theme/useAnalysisPalette';
import { fmtTry } from './cockpitPrimitives';

export function MobileCockpitMonthEndCard({ cockpit }: { cockpit: FinancialCockpitDto }) {
  const p = useAnalysisPalette();
  const m = cockpit.monthEnd;
  const forecast =
    m.forecastNextMonthTotal != null && Number(m.forecastNextMonthTotal) > 0
      ? Number(m.forecastNextMonthTotal)
      : null;
  const prevMonthTotal = m.previousMonthTotal ?? null;
  const last3AvgTotal = m.last3MonthsAverageTotal ?? null;
  const daily = Number(m.dailyAverageSpend ?? 0);
  const changeVsPrev = percentChange(forecast, prevMonthTotal);
  const changeVsLast3 = percentChange(forecast, last3AvgTotal);

  return (
    <AnalysisCard title="Gelecek ay tahmini" headerBorder>
      {forecast != null ? (
        <Text style={[styles.amount, { color: p.fg }]}>{fmtTry(forecast)}</Text>
      ) : (
        <Text style={[styles.empty, { color: p.muted }]}>Henüz yeterli veri yok</Text>
      )}

      {forecast != null ? (
        <View style={styles.metrics}>
          <MetricBadgeRow label="Geçen Aya Göre" value={changeVsPrev} p={p} />
          <MetricBadgeRow label="Son 3 Ay Ortalamasına Göre" value={changeVsLast3} p={p} />
          <View style={[styles.avgRow, { borderColor: p.border, backgroundColor: p.cardBg }]}>
            <Text style={[styles.avgLabel, { color: p.muted }]}>Günlük Ortalama</Text>
            <Text style={[styles.avgValue, { color: p.fg }]}>{fmtTry(daily)}</Text>
          </View>
        </View>
      ) : null}

      {m.shortMessage ? (
        <Text style={[styles.explanation, { color: p.muted }]} numberOfLines={2}>
          {m.shortMessage}
        </Text>
      ) : null}

      {m.forecastDisclaimer ? <Text style={[styles.disclaimer, { color: p.muted }]} numberOfLines={1}>{m.forecastDisclaimer}</Text> : null}
    </AnalysisCard>
  );
}

function percentChange(current: number | null, baseline: number | null): number | null {
  if (current == null || baseline == null || baseline <= 0) return null;
  return ((current - baseline) / baseline) * 100;
}

function MetricBadgeRow({
  label,
  value,
  p,
}: {
  label: string;
  value: number | null;
  p: ReturnType<typeof useAnalysisPalette>;
}) {
  const tone = value == null ? 'neutral' : value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
  const badgeStyle =
    tone === 'up'
      ? { backgroundColor: 'rgba(244,63,94,0.12)', borderColor: 'rgba(244,63,94,0.25)' }
      : tone === 'down'
        ? { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.25)' }
        : { backgroundColor: p.chipBg, borderColor: p.border };
  const icon = tone === 'up' ? 'trending-up' : tone === 'down' ? 'trending-down' : 'minus';
  const textColor = tone === 'up' ? '#ef4444' : tone === 'down' ? '#10b981' : p.muted;

  return (
    <View style={[styles.badgeRow, { borderColor: p.border, backgroundColor: p.cardBg }]}>
      <Text style={[styles.badgeLabel, { color: p.muted }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={[styles.badge, badgeStyle]}>
        <MaterialCommunityIcons name={icon as any} size={11} color={textColor} />
        <Text style={[styles.badgeText, { color: textColor }]}>{value == null ? '--' : `${value > 0 ? '+' : ''}%${Math.round(value)}`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 6 },
  empty: { fontSize: 13 },
  metrics: { gap: 8, marginTop: 2 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  badgeLabel: { flex: 1, fontSize: 11, lineHeight: 15 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  avgLabel: { fontSize: 11, lineHeight: 15 },
  avgValue: { fontSize: 12, fontWeight: '700' },
  explanation: { marginTop: 2, fontSize: 11, lineHeight: 16 },
  disclaimer: { marginTop: 4, fontSize: 10, lineHeight: 14, opacity: 0.85 },
});
