/**
 * Web AnalysisComponent «Hedef ve yol haritası» ile aynı akış: hourglass simülatörü veya boş durum metni.
 */
import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
  forecastNextMonthSpending?: number | null;
  onGoOnboarding?: () => void;
}

export function MobileFinancialGoalSection({
  mainGoal,
  profile,
  balance,
  monthlyDisposableCap,
  disposableSource,
  defaultAllocation,
  forecastNextMonthSpending,
  onGoOnboarding,
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
    <AnalysisCard title="Hedef ve yol haritası" headerBorder>
      {!hasGoalSimulator ? (
        <View style={styles.emptyState}>
          <Text style={[styles.muted, { color: p.muted }]}>
            Tanıtımda hedef ve tutar eklediğinde simülasyon burada görünür.
          </Text>
          {onGoOnboarding ? (
            <Pressable
              onPress={onGoOnboarding}
              style={({ pressed }) => [
                styles.onboardBtn,
                { borderColor: p.border, backgroundColor: p.dashedBoxBg, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={[styles.onboardBtnText, { color: p.fg }]}>Tanıtıma git</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <MobileGoalHourglassSimulator
          mainGoalShort={formatGoalTitleDisplay(trimmed.slice(0, 120))}
          targetAmount={effectiveTarget!}
          currentBalance={balance}
          monthlyDisposableCap={monthlyDisposableCap}
          disposableSource={disposableSource}
          defaultAllocation={defaultAllocation}
          forecastNextMonthSpending={forecastNextMonthSpending}
        />
      )}
    </AnalysisCard>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    gap: 10,
  },
  muted: { fontSize: 12, lineHeight: 18 },
  onboardBtn: {
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  onboardBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
