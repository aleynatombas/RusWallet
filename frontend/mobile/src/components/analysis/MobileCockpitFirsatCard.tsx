import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from 'react-native-paper';
import { AnalysisCard } from './AnalysisCard';
import { cockpitInsightLine } from '../../lib/cockpitInsightStack';
import type { FinancialCockpitDto } from '../../types/financialRoadmap';
import { useAnalysisPalette } from '../../theme/useAnalysisPalette';
import { CockpitSkeletonLines, fmtTry } from './cockpitPrimitives';

export function MobileCockpitFirsatCard({
  cockpit,
  onHarcamaEkle,
}: {
  cockpit: FinancialCockpitDto;
  onHarcamaEkle: () => void;
}) {
  const theme = useTheme();
  const p = useAnalysisPalette();
  const o = cockpit.opportunities;
  const onPrimary = theme.colors.onPrimary;

  return (
    <AnalysisCard title="ML — tasarruf ve kazanç" subtitle="Fırsat sinyalleri" headerBorder>
      <Text style={[styles.insightHint, { color: p.muted }]}>{cockpitInsightLine(o.insightStack, 'ml_opportunity')}</Text>
      <View style={[styles.inner, { borderColor: p.border, backgroundColor: p.dashedBoxBg }]}>
        {o.isLearning ? (
          <>
            <CockpitSkeletonLines />
            <Text style={[styles.shortMsg, { color: p.muted }]}>{o.shortMessage}</Text>
          </>
        ) : (
          <>
            <View style={styles.tileWrap}>
              {o.tiles.map((tile, i) => (
                <View key={`${tile.label}-${i}`} style={[styles.tile, { borderColor: p.border, backgroundColor: p.firsatTileBg }]}>
                  <Text style={[styles.tileTitle, { color: p.fg }]}>
                    {tile.iconEmoji ? `${tile.iconEmoji} ` : ''}
                    {tile.label}
                  </Text>
                  {tile.subtitle ? <Text style={[styles.tileSub, { color: p.muted }]}>{tile.subtitle}</Text> : null}
                  {tile.estimatedSaving != null ? (
                    <Text style={[styles.tileSave, { color: p.fg }]}>≈ {fmtTry(tile.estimatedSaving)}</Text>
                  ) : null}
                </View>
              ))}
            </View>
            <Text style={[styles.firsatMsg, { color: p.fg }]} numberOfLines={8}>
              {o.shortMessage}
            </Text>
          </>
        )}
        <Pressable
          onPress={onHarcamaEkle}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: p.accent, opacity: pressed ? 0.9 : 1 },
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.primaryBtnText, { color: onPrimary }]}>Harcama ekle</Text>
        </Pressable>
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
  tileWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    flexGrow: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  tileTitle: { fontSize: 12, fontWeight: '600' },
  tileSub: { fontSize: 10, marginTop: 4 },
  tileSave: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  firsatMsg: { fontSize: 11, lineHeight: 16 },
  shortMsg: { fontSize: 11, lineHeight: 16 },
  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
    width: '100%',
  },
  primaryBtnText: { fontSize: 12, fontWeight: '700' },
});
