import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAnalysisPalette } from '../../theme/useAnalysisPalette';

export function formatGoalAmountTry(n: number): string {
  return `${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`;
}

export function formatGoalMoneyTry(n: number, maximumFractionDigits: 0 | 2 = 2): string {
  return `${n.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  })} ₺`;
}

function addMonthsLabel(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

export interface MobileGoalHourglassSimulatorProps {
  mainGoalShort: string;
  targetAmount: number;
  currentBalance: number;
  monthlyDisposableCap: number;
  disposableSource: 'records' | 'onboarding';
  defaultAllocation: number;
}

/**
 * Web `GoalHourglassSimulator` ile aynı mantık: üstte hedef + varış, altta sürgü.
 */
export function MobileGoalHourglassSimulator({
  mainGoalShort,
  targetAmount,
  currentBalance,
  monthlyDisposableCap,
  disposableSource,
  defaultAllocation,
}: MobileGoalHourglassSimulatorProps) {
  const theme = useTheme();
  const p = useAnalysisPalette();
  const [allocation, setAllocation] = useState(defaultAllocation);
  const remaining = Math.max(0, targetAmount - currentBalance);
  const disposableMonthly = Math.max(0, monthlyDisposableCap);

  const maxSlider = useMemo(() => {
    if (disposableMonthly > 0) {
      if (disposableSource === 'records') {
        return Math.max(1, Math.floor(disposableMonthly));
      }
      return Math.max(250, Math.ceil(disposableMonthly / 250) * 250);
    }
    if (disposableSource === 'records') {
      return 0;
    }
    return Math.max(500, Math.ceil(remaining / 12) || 1, 5_000);
  }, [disposableMonthly, remaining, disposableSource]);

  const sliderStep = disposableSource === 'records' && disposableMonthly > 0 ? 1 : 250;
  const allocationClamped = Math.min(allocation, maxSlider);

  useEffect(() => {
    setAllocation((a) => Math.min(a, maxSlider));
  }, [maxSlider]);

  const monthsNeeded = useMemo(() => {
    if (remaining <= 0 || allocationClamped <= 0) return null;
    return Math.ceil(remaining / allocationClamped);
  }, [remaining, allocationClamped]);

  const etaLabel = monthsNeeded != null ? addMonthsLabel(monthsNeeded) : null;

  const varışPanel =
    remaining <= 0 ? (
      <View style={[styles.varisBox, { borderColor: p.emeraldBorder, backgroundColor: 'rgba(16,185,129,0.08)' }]}>
        <Text style={[styles.varisEmeraldText, { color: p.emeraldText }]}>Kayıtlı bakiyene göre hedef tutarına ulaşılmış görünüyor.</Text>
      </View>
    ) : allocationClamped <= 0 ? (
      <View style={[styles.varisBox, { borderColor: p.border, backgroundColor: p.varisMutedBox }]}>
        <Text style={[styles.varisMuted, { color: p.muted }]}>Aylık tutarı artırdığında tahmini varış güncellenir.</Text>
      </View>
    ) : monthsNeeded != null && etaLabel ? (
      <View style={[styles.varisBox, { borderColor: p.emeraldBorder, backgroundColor: p.emeraldSoft }]}>
        <View style={styles.varisRow}>
          <View style={[styles.sparkleCircle, { backgroundColor: p.sparkleBg }]}>
            <MaterialCommunityIcons name="star-four-points" size={20} color={theme.dark ? '#6ee7b7' : '#059669'} />
          </View>
          <View style={styles.flex1}>
            <Text style={[styles.varisLabel, { color: p.varisLabelLight }]}>Hedefe varış tarihin</Text>
            <Text style={[styles.varisDate, { color: p.varisDateLight }]}>{etaLabel}</Text>
          </View>
        </View>
      </View>
    ) : null;

  return (
    <View style={styles.root}>
      <View style={styles.topGrid}>
        <View style={[styles.goalBox, { borderColor: p.border, backgroundColor: p.varisMutedBox }]}>
          <View style={styles.goalRow}>
            <View style={[styles.flagCircle, { backgroundColor: p.goalFlagBg }]}>
              <MaterialCommunityIcons name="flag-variant-outline" size={20} color={p.muted} />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.goalTitle, { color: p.muted }]} numberOfLines={3}>
                {mainGoalShort}
              </Text>
              <Text style={[styles.goalAmt, { color: p.fg }]}>{formatGoalAmountTry(targetAmount)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.varisCol}>{varışPanel}</View>
      </View>

      <View style={styles.sliderBlock}>
        <Text style={[styles.sliderLabel, { color: p.muted }]}>Her ay hedefe ayıracağın tutar</Text>
        <Text style={[styles.sliderAmt, { color: p.fg }]}>
          {disposableSource === 'records'
            ? formatGoalMoneyTry(allocationClamped, 2)
            : formatGoalAmountTry(allocationClamped)}
        </Text>
        {remaining > 0 && allocationClamped > 0 && monthsNeeded != null ? (
          <Text style={[styles.sliderHint, { color: p.muted }]}>
            Bu tempoda yaklaşık <Text style={{ fontWeight: '700', color: p.fg }}>{monthsNeeded} ay</Text> sürebilir.
          </Text>
        ) : null}

        {maxSlider > 0 ? (
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={maxSlider}
            step={sliderStep}
            value={allocationClamped}
            onValueChange={(v) => setAllocation(v)}
            minimumTrackTintColor={p.accent}
            maximumTrackTintColor={p.sliderTrackMax}
            thumbTintColor={p.sliderThumb}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  topGrid: { flexDirection: 'column', gap: 8 },
  goalBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  goalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  flagCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: { flex: 1, minWidth: 0 },
  goalTitle: { fontSize: 11, fontWeight: '600', lineHeight: 15 },
  goalAmt: { marginTop: 4, fontSize: 16, fontWeight: '700' },
  varisCol: { minHeight: 0 },
  varisBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 72,
    justifyContent: 'center',
  },
  varisRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sparkleCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  varisLabel: { fontSize: 11, fontWeight: '600' },
  varisDate: { marginTop: 2, fontSize: 15, fontWeight: '700' },
  varisEmeraldText: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
  varisMuted: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
  sliderBlock: { gap: 6, paddingTop: 4 },
  sliderLabel: { fontSize: 12, fontWeight: '600' },
  sliderAmt: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  sliderHint: { fontSize: 11, lineHeight: 16 },
  slider: { width: '100%', height: 36 },
});
