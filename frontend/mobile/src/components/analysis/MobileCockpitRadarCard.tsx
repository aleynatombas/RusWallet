import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AnalysisCard } from './AnalysisCard';
import { cockpitInsightLine } from '../../lib/cockpitInsightStack';
import type { FinancialCockpitDto } from '../../types/financialRoadmap';
import { useAnalysisPalette } from '../../theme/useAnalysisPalette';
import { CockpitSkeletonLines, fmtTry } from './cockpitPrimitives';

export function MobileCockpitRadarCard({ cockpit }: { cockpit: FinancialCockpitDto }) {
  const p = useAnalysisPalette();
  const r = cockpit.radar;

  return (
    <AnalysisCard title="ML — anomali" subtitle="Sıradışı harcama tespiti" headerBorder>
      <Text style={[styles.insightHint, { color: p.muted }]}>{cockpitInsightLine(r.insightStack, 'ml_anomaly')}</Text>
      <View style={[styles.inner, r.isLowData && { opacity: 0.55 }]}>
        {r.hasUnusualSpending ? (
          <View style={[styles.chip, { borderColor: p.border, backgroundColor: p.chipBg }]}>
            <MaterialCommunityIcons name="alert-outline" size={16} color={p.muted} />
            <Text style={[styles.chipText, { color: p.fg }]}>Sinyal var</Text>
          </View>
        ) : null}

        {r.isLowData ? (
          <>
            <CockpitSkeletonLines />
            <Text style={[styles.shortMsg, { color: p.muted }]}>{r.shortMessage}</Text>
          </>
        ) : r.hits.length > 0 ? (
          <View style={styles.gap2}>
            {r.hits.map((h, i) => (
              <View key={`${h.categoryLabel}-${i}`} style={[styles.hitRow, { borderColor: p.border, backgroundColor: p.hitRowBg }]}>
                <View style={styles.rowCenter}>
                  <View style={[styles.hitIcon, { borderColor: p.border, backgroundColor: p.chipBg }]}>
                    <MaterialCommunityIcons name="alert-outline" size={18} color={p.muted} />
                  </View>
                  <Text style={[styles.hitCat, { color: p.fg }]} numberOfLines={1}>
                    {h.categoryLabel}
                  </Text>
                </View>
                <Text style={[styles.hitAmt, { color: p.fg }]}>{fmtTry(h.amount)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.radarEmpty, { borderColor: p.border, backgroundColor: p.radarEmptyBg }]}>
            <View style={[styles.radarIconCircle, { borderColor: p.border, backgroundColor: p.chipBg }]}>
              <MaterialCommunityIcons name="radar" size={28} color={p.muted} />
            </View>
            {r.topMonthCategoryLabel != null && r.topMonthCategoryAmount != null ? (
              <View style={styles.centerText}>
                <Text style={[styles.topHint, { color: p.muted }]}>Bu ay öne çıkan</Text>
                <Text style={[styles.topCat, { color: p.fg }]}>{r.topMonthCategoryLabel}</Text>
                <Text style={[styles.topAmt, { color: p.muted }]}>{fmtTry(r.topMonthCategoryAmount)}</Text>
              </View>
            ) : (
              <Text style={[styles.shortMsg, { color: p.muted, textAlign: 'center' }]}>{r.shortMessage}</Text>
            )}
          </View>
        )}
      </View>
    </AnalysisCard>
  );
}

const styles = StyleSheet.create({
  insightHint: { fontSize: 10, lineHeight: 14, marginBottom: 8 },
  inner: { gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 10, fontWeight: '600' },
  gap2: { gap: 8 },
  hitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hitIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hitCat: { fontSize: 12, fontWeight: '600', flex: 1 },
  hitAmt: { fontSize: 14, fontWeight: '700' },
  radarEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 12,
  },
  radarIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  centerText: { alignItems: 'center' },
  topHint: { fontSize: 10, fontWeight: '500' },
  topCat: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  topAmt: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  shortMsg: { fontSize: 11, lineHeight: 16 },
});
