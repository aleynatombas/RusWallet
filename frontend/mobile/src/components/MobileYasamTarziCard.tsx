/**
 * Web YasamTarziCard — Esneklik skoru + zorunlu/esnek çubuk (oran noktaları ile).
 */
import { View, Text, StyleSheet } from 'react-native';
import { AnalysisCard } from './analysis/AnalysisCard';
import type { LifestyleProfileDto } from '../types/financialRoadmap';
import { useAnalysisPalette } from '../theme/useAnalysisPalette';

function LifestyleShareBar({ lifestyle }: { lifestyle: LifestyleProfileDto }) {
  const p = useAnalysisPalette();
  const m = Math.min(100, Math.max(0, lifestyle.mandatorySharePercent));
  const d = Math.min(100, Math.max(0, lifestyle.discretionarySharePercent));
  const score = Math.round(lifestyle.flexibilityScore);
  const sum = m + d;
  const mBar = sum > 0 ? (m / sum) * 100 : 50;
  const dBar = sum > 0 ? (d / sum) * 100 : 50;

  return (
    <View style={styles.shareRoot}>
      <View style={styles.shareTop}>
        <View>
          <Text style={[styles.esnekLabel, { color: p.muted }]}>ESNEKLİK</Text>
          <Text style={[styles.scoreLine, { color: p.fg }]}>
            {score}
            <Text style={[styles.scoreDenom, { color: p.muted }]}>/100</Text>
          </Text>
        </View>
        <View style={styles.legendCol}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: p.fg }]} />
            <Text style={[styles.legendText, { color: p.muted }]}>
              Zorunlu {m.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDotSm, { backgroundColor: p.muted }]} />
            <Text style={[styles.legendText, { color: p.muted }]}>
              Esnek {d.toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>
      <View
        style={[styles.barTrack, { backgroundColor: p.barTrackLifestyle }]}
        accessibilityRole="image"
        accessibilityLabel={`Zorunlu yüzde ${m.toFixed(0)}, esnek yüzde ${d.toFixed(0)}`}
      >
        <View style={[styles.barSeg, { width: `${mBar}%`, backgroundColor: p.lifestyleBarMandatory }]} />
        <View style={[styles.barSeg, { width: `${dBar}%`, backgroundColor: p.lifestyleBarDiscretionary }]} />
      </View>
    </View>
  );
}

export function MobileYasamTarziCard({ lifestyle }: { lifestyle: LifestyleProfileDto }) {
  const p = useAnalysisPalette();
  return (
    <AnalysisCard title="Yaşam tarzı profili" subtitle="Bu ay zorunlu / esnek dağılımı" headerBorder>
      <View style={styles.row}>
        <View style={styles.leftCol}>
          <LifestyleShareBar lifestyle={lifestyle} />
        </View>
        <View style={styles.summaryCol}>
          <Text style={[styles.summary, { color: p.muted }]} numberOfLines={6}>
            {lifestyle.summary}
          </Text>
        </View>
      </View>
    </AnalysisCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'column', gap: 12 },
  leftCol: { width: '100%' },
  summaryCol: { width: '100%' },
  shareRoot: { gap: 8 },
  shareTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 },
  esnekLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.6 },
  scoreLine: { fontSize: 28, fontWeight: '700' },
  scoreDenom: { fontSize: 14, fontWeight: '500' },
  legendCol: { gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 6, height: 6, borderRadius: 2 },
  legendDotSm: { width: 6, height: 6, borderRadius: 2, opacity: 0.45 },
  legendText: { fontSize: 10 },
  barTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
  barSeg: { height: '100%' },
  summary: { fontSize: 11, lineHeight: 17 },
});
