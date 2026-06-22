import { View, Text, StyleSheet } from 'react-native';
import { AnalysisCard } from './AnalysisCard';
import type { FinancialCockpitDto } from '../../types/financialRoadmap';
import { useAnalysisPalette } from '../../theme/useAnalysisPalette';
import { CockpitSkeletonLines, fmtTry } from './cockpitPrimitives';

export function MobileCockpitFirsatCard({ cockpit }: { cockpit: FinancialCockpitDto }) {
  const p = useAnalysisPalette();
  const o = cockpit.opportunities;
  const totalMonthlyPotential = o.tiles.reduce((sum, t) => sum + (t.estimatedSaving ?? 0), 0);
  const totalYearlyPotential = totalMonthlyPotential > 0 ? totalMonthlyPotential * 12 : 0;

  return (
    <AnalysisCard title="Tasarruf Fırsatları" headerBorder>
      {o.isLearning ? (
        <View style={styles.inner}>
          <CockpitSkeletonLines />
          <View style={[styles.learningBox, { borderColor: p.border, backgroundColor: p.dashedBoxBg }]}>
            <Text style={[styles.shortMsg, { color: p.muted }]}>{o.shortMessage}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.inner}>
          <View style={styles.tileWrap}>
            {o.tiles.map((tile, i) => {
              const detail = [tile.subtitle?.trim()].filter(Boolean).join('. ');
              return (
                <View key={`${tile.label}-${i}`} style={[styles.detailRow, { borderBottomColor: p.border }]}>
                  <Text style={[styles.detailText, { color: p.fg }]}>{detail || tile.label}</Text>
                </View>
              );
            })}
          </View>

          <View style={[styles.summaryBox, { borderColor: p.border, backgroundColor: p.dashedBoxBg }]}>
            <Text style={[styles.firsatMsg, { color: p.fg }]}>{o.shortMessage}</Text>
            <View style={styles.summaryGrid}>
              <Text style={[styles.summaryLine, { color: p.muted }]}>
                Aylık potansiyel:{' '}
                <Text style={[styles.summaryValue, { color: p.fg }]}>
                  {totalMonthlyPotential > 0 ? fmtTry(totalMonthlyPotential) : '-'}
                </Text>
              </Text>
              <Text style={[styles.summaryLine, { color: p.muted }]}>
                Yıllık potansiyel:{' '}
                <Text style={[styles.summaryValue, { color: p.fg }]}>
                  {totalYearlyPotential > 0 ? fmtTry(totalYearlyPotential) : '-'}
                </Text>
              </Text>
            </View>
          </View>
        </View>
      )}
    </AnalysisCard>
  );
}

const styles = StyleSheet.create({
  inner: { gap: 10 },
  learningBox: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tileWrap: { gap: 0 },
  detailRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
    marginBottom: 10,
  },
  detailText: { fontSize: 13, lineHeight: 19 },
  summaryBox: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  firsatMsg: { fontSize: 13, lineHeight: 19 },
  summaryGrid: { gap: 4 },
  summaryLine: { fontSize: 12, lineHeight: 17 },
  summaryValue: { fontWeight: '700' },
  shortMsg: { fontSize: 11, lineHeight: 16 },
});
