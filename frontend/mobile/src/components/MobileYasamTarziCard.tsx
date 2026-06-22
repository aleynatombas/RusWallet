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

  return (
    <View style={styles.shareRoot}>
      <View style={styles.legendCol}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: p.lifestyleBarMandatory }]} />
          <Text style={[styles.legendText, { color: p.muted }]}>Zorunlu {m.toFixed(0)}%</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDotSm, { backgroundColor: p.lifestyleBarDiscretionary }]} />
          <Text style={[styles.legendText, { color: p.muted }]}>Esnek {d.toFixed(0)}%</Text>
        </View>
      </View>

      <View style={styles.barRows}>
        <View style={styles.barRow}>
          <Text style={[styles.barLabel, { color: p.muted }]}>Zorunlu</Text>
          <View
            style={[styles.barTrack, { backgroundColor: p.barTrackLifestyle }]}
            accessibilityRole="image"
            accessibilityLabel={`Zorunlu yüzde ${m.toFixed(0)}`}
          >
            <View style={[styles.barSeg, { width: `${m}%`, backgroundColor: p.lifestyleBarMandatory }]} />
          </View>
        </View>
        <View style={styles.barRow}>
          <Text style={[styles.barLabel, { color: p.muted }]}>Esnek</Text>
          <View
            style={[styles.barTrack, { backgroundColor: p.barTrackLifestyle }]}
            accessibilityRole="image"
            accessibilityLabel={`Esnek yüzde ${d.toFixed(0)}`}
          >
            <View style={[styles.barSeg, { width: `${d}%`, backgroundColor: p.lifestyleBarDiscretionary }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function MobileYasamTarziCard({ lifestyle }: { lifestyle: LifestyleProfileDto }) {
  const p = useAnalysisPalette();
  return (
    <AnalysisCard title="Yaşam tarzı profili" subtitle="Bu ay zorunlu / esnek dağılımı" headerBorder>
      <View style={styles.row}>
        <LifestyleShareBar lifestyle={lifestyle} />
        <Text style={[styles.summary, { color: p.muted }]}>{lifestyle.summary}</Text>
      </View>
    </AnalysisCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'column', gap: 12 },
  shareRoot: { gap: 10 },
  legendCol: { gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 6, height: 6, borderRadius: 2 },
  legendDotSm: { width: 6, height: 6, borderRadius: 2, opacity: 0.45 },
  legendText: { fontSize: 10 },
  barRows: { gap: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 56, fontSize: 10 },
  barTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    flex: 1,
  },
  barSeg: { height: '100%' },
  summary: { fontSize: 11, lineHeight: 17 },
});
