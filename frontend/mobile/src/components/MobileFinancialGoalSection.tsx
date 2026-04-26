/**
 * Web AnalysisComponent «Hedef ve yol haritası» ile aynı akış: hourglass simülatörü veya boş durum metni.
 */
import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { UserFinancialProfilePayload } from '../types/onboarding';
import { parseSavingsTargetFromGoalText } from '../lib/parseSavingsTargetFromGoalText';
import { formatGoalTitleDisplay } from '../lib/formatDisplayName';
import { AnalysisCard } from './analysis/AnalysisCard';
import { MobileGoalHourglassSimulator } from './analysis/MobileGoalHourglassSimulator';
import { useAnalysisPalette } from '../theme/useAnalysisPalette';

export interface MobileFinancialGoalSectionProps {
  mainGoal?: string | null;
  profile?: UserFinancialProfilePayload | null;
  balance: number;
  monthlyDisposableCap: number;
  disposableSource: 'records' | 'onboarding';
  defaultAllocation: number;
}

export function MobileFinancialGoalSection({
  mainGoal,
  profile,
  balance,
  monthlyDisposableCap,
  disposableSource,
  defaultAllocation,
}: MobileFinancialGoalSectionProps) {
  const p = useAnalysisPalette();
  const trimmed = mainGoal?.trim() ?? '';
  const parsedFromText = useMemo(() => parseSavingsTargetFromGoalText(trimmed), [trimmed]);
  const storedTarget =
    profile?.savingsTargetAmount != null && profile.savingsTargetAmount > 0
      ? Number(profile.savingsTargetAmount)
      : null;
  const effectiveTarget = storedTarget ?? parsedFromText;
  const hasGoalSection = trimmed.length > 0;
  const hasGoalSimulator = hasGoalSection && effectiveTarget != null && effectiveTarget > 0;

  return (
    <AnalysisCard
      title="Hedef ve yol haritası"
      subtitle="Hedef ve tasarruf özeti; veriler profil ve işlemlerden gelir."
      headerBorder
    >
      {!hasGoalSection ? (
        <View style={[styles.dashed, { borderColor: p.border, backgroundColor: p.dashedBoxBg }]}>
          <Text style={[styles.muted, { color: p.muted }]}>
            Profilde hedef metni tanımlandığında bu bölümde simülasyon görünür.
          </Text>
        </View>
      ) : !hasGoalSimulator ? (
        <View style={[styles.dashed, { borderColor: p.border, backgroundColor: p.dashedBoxBg }]}>
          <Text style={[styles.muted, { color: p.muted }]}>
            Hedef tutarı netleştiğinde simülasyon burada görünür.
          </Text>
        </View>
      ) : (
        <MobileGoalHourglassSimulator
          mainGoalShort={formatGoalTitleDisplay(trimmed.slice(0, 120))}
          targetAmount={effectiveTarget!}
          currentBalance={balance}
          monthlyDisposableCap={monthlyDisposableCap}
          disposableSource={disposableSource}
          defaultAllocation={defaultAllocation}
        />
      )}
    </AnalysisCard>
  );
}

const styles = StyleSheet.create({
  dashed: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
  },
  muted: { fontSize: 12, lineHeight: 18 },
});
