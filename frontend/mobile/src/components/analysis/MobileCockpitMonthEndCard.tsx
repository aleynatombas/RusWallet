import { View, Text, StyleSheet, Pressable } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AnalysisCard } from './AnalysisCard';
import { cockpitInsightLine } from '../../lib/cockpitInsightStack';
import type { FinancialCockpitDto } from '../../types/financialRoadmap';
import { useAnalysisPalette } from '../../theme/useAnalysisPalette';
import { EsnekRing, GradientFlexBar, fmtTry } from './cockpitPrimitives';

export function MobileCockpitMonthEndCard({ cockpit }: { cockpit: FinancialCockpitDto }) {
  const p = useAnalysisPalette();
  const m = cockpit.monthEnd;
  const hasDisp = m.hasDisposableReference ?? false;
  const monthDetailTitle = m.projectedUsesFixedPlusFlexibleSplit
    ? 'Tanıyalım sabit gider toplamı + kira/fatura/abonelik dışı esnek harcamaların temposunun ay sonuna yayılması. Anasayfadaki bu ay gider: bugüne kadar gerçek toplam.'
    : 'Tüm giderlerin bugüne kadar ortalamasının ay sonuna doğrusal yayılması. Anasayfadaki bu ay gider: bugüne kadar gerçek toplam.';

  const forecast =
    m.forecastNextMonthTotal != null && Number(m.forecastNextMonthTotal) > 0
      ? Number(m.forecastNextMonthTotal)
      : null;

  return (
    <AnalysisCard title="AI + predictive" subtitle="Bu ay sonu ve gelecek ay gider öngörüsü" headerBorder>
      <Text style={[styles.insightHint, { color: p.muted }]}>{cockpitInsightLine(m.insightStack, 'predictive_analysis')}</Text>
      <View style={[styles.inner, { borderColor: p.border, backgroundColor: p.innerBg }]}>
        <View style={styles.rowStart}>
          <View style={styles.flex1}>
            <Text style={[styles.projectedAmt, { color: p.fg }]}>{fmtTry(m.projectedMonthTotal)}</Text>
            {forecast != null ? (
              <Text style={[styles.forecastLine, { color: p.muted }]}>Gelecek ay öngörüsü: {fmtTry(forecast)}</Text>
            ) : null}
            <View style={styles.chipRow}>
              {hasDisp ? (
                <View style={[styles.chip, { borderColor: p.border, backgroundColor: p.chipBg }]}>
                  <MaterialCommunityIcons name="lightning-bolt" size={14} color={p.fg} />
                  <Text style={[styles.chipText, { color: p.fg }]}>{m.isOverPaceVersusDisposable ? 'Yüksek tempo' : 'Uyumlu tempo'}</Text>
                </View>
              ) : (
                <View style={[styles.chip, { borderColor: p.border, backgroundColor: p.chipBg }]}>
                  <Text style={[styles.chipText, { color: p.muted }]}>Referans yok</Text>
                </View>
              )}
              <View style={[styles.chipSm, { borderColor: p.border }]}>
                <Text style={[styles.chipSmText, { color: p.muted }]}>
                  {m.projectedUsesFixedPlusFlexibleSplit ? 'Sabit + esnek model' : 'Doğrusal ölçek'}
                </Text>
              </View>
              <Pressable accessibilityLabel="Hesaplama detayı" accessibilityHint={monthDetailTitle} hitSlop={8}>
                <MaterialCommunityIcons name="information-outline" size={18} color={p.muted} />
              </Pressable>
            </View>
          </View>
          <EsnekRing
            percent={m.budgetFillPercent}
            strokeColor={p.accent}
            trackColor={p.trackRing}
            textColor={p.fg}
          />
        </View>

        <View style={[styles.calendarRow, { borderColor: p.border, backgroundColor: p.calendarRowBg }]}>
          <View style={styles.rowCenter}>
            <MaterialCommunityIcons name="calendar-month-outline" size={16} color={p.muted} />
            <Text style={[styles.calendarText, { color: p.muted }]}>{m.daysRemainingInMonth} gün</Text>
          </View>
          <Text style={[styles.calendarHint, { color: p.muted }]}>ay sonuna</Text>
        </View>

        <View style={styles.barBlock}>
          <GradientFlexBar value={m.budgetFillPercent} trackColor={p.trackBar} gradientColors={p.flexBarGradient} />
          <Text style={[styles.progressCaption, { color: p.muted }]}>Esnek pay doluluğu</Text>
        </View>

        <Text style={[styles.shortMsg, { color: p.muted }]} numberOfLines={6}>
          {m.shortMessage}
        </Text>
      </View>
    </AnalysisCard>
  );
}

const styles = StyleSheet.create({
  insightHint: { fontSize: 10, lineHeight: 14, marginBottom: 8 },
  inner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  rowStart: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  flex1: { flex: 1, minWidth: 0 },
  projectedAmt: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  forecastLine: { marginTop: 6, fontSize: 11, lineHeight: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 10, fontWeight: '600' },
  chipSm: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  chipSmText: { fontSize: 9, fontWeight: '500' },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  calendarText: { fontSize: 10 },
  calendarHint: { fontSize: 9 },
  barBlock: { gap: 4 },
  progressCaption: { fontSize: 9 },
  shortMsg: { fontSize: 11, lineHeight: 16 },
});
