import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Card, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

function fmtTry(n: number): string {
  return `${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`;
}

function RingArc({
  progress,
  size,
  stroke,
  color,
  trackColor,
}: {
  progress: number;
  size: number;
  stroke: number;
  color: string;
  trackColor: string;
}) {
  const p = Math.max(0, Math.min(1, progress));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - p);
  const cx = size / 2;
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={cx} cy={cx} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
      <Circle
        cx={cx}
        cy={cx}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={offset}
      />
    </Svg>
  );
}

export interface MobileSavingsGoalRingPlannerProps {
  targetAmount: number;
  currentBalance: number;
  monthlyIncomeNet: number | null;
  monthlyFixedCosts: number | null;
  defaultMonthlySaving?: number;
}

export function MobileSavingsGoalRingPlanner({
  targetAmount,
  currentBalance,
  monthlyIncomeNet,
  monthlyFixedCosts,
  defaultMonthlySaving = 5_000,
}: MobileSavingsGoalRingPlannerProps) {
  const theme = useTheme();
  const [monthly, setMonthly] = useState(defaultMonthlySaving);

  const surplus =
    monthlyIncomeNet != null && monthlyFixedCosts != null
      ? Math.max(0, monthlyIncomeNet - monthlyFixedCosts)
      : null;

  const outerProgress = targetAmount > 0 ? currentBalance / targetAmount : 0;
  const remaining = Math.max(0, targetAmount - currentBalance);
  const pctTowardGoal = targetAmount > 0 ? Math.round(Math.min(100, outerProgress * 100)) : 0;

  const monthsNeeded = useMemo(() => {
    if (remaining <= 0 || monthly <= 0) return null;
    return Math.ceil(remaining / monthly);
  }, [remaining, monthly]);

  const innerProgress = surplus != null && surplus > 0 ? Math.min(1, monthly / surplus) : 0;

  const sliderMax = useMemo(() => {
    return Math.max(
      5_000,
      Math.ceil(monthly),
      Math.ceil(targetAmount / 12),
      surplus != null && surplus > 0 ? Math.ceil(surplus * 2.5) : 200_000
    );
  }, [monthly, targetAmount, surplus]);

  const sliderClamped = Math.min(monthly, sliderMax);
  const step = 500;

  const amber = '#f59e0b';
  const violet = '#8b5cf6';
  const muted = theme.colors.onSurfaceVariant;
  const fg = theme.colors.onSurface;

  return (
    <Card style={[styles.card, { borderColor: 'rgba(245,158,11,0.25)', backgroundColor: theme.colors.elevation.level1 }]} mode="outlined">
      <Card.Content>
        <Text style={[styles.h3, { color: fg }]}>Hedef planı</Text>
        <Text style={[styles.legend, { color: muted }]}>
          Dış halka: bakiye / hedef · İç halka: aylık plan / (net gelir − sabit gider)
        </Text>

        <View style={styles.ringRow}>
          <View style={styles.ringWrap}>
            <View style={StyleSheet.absoluteFillObject}>
              <RingArc
                progress={outerProgress}
                size={188}
                stroke={16}
                color={amber}
                trackColor={theme.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}
              />
            </View>
            <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', zIndex: 1 }]} pointerEvents="none">
              <RingArc
                progress={surplus != null && surplus > 0 ? innerProgress : 0}
                size={120}
                stroke={9}
                color={violet}
                trackColor={theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}
              />
            </View>
            <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', zIndex: 2 }]} pointerEvents="none">
              <Text style={[styles.pctLabel, { color: muted }]}>İlerleme</Text>
              <Text style={[styles.pct, { color: fg }]}>{pctTowardGoal}%</Text>
              {remaining > 0 ? (
                <Text style={[styles.kalan, { color: muted }]} numberOfLines={2}>
                  {fmtTry(remaining)} kalan
                </Text>
              ) : (
                <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '600' }}>Hedef tamam</Text>
              )}
            </View>
          </View>

          <View style={styles.statsCol}>
            <View style={[styles.statBox, { borderColor: theme.colors.outline }]}>
              <Text style={[styles.statLbl, { color: muted }]}>Hedef</Text>
              <Text style={[styles.statVal, { color: fg }]}>{fmtTry(targetAmount)}</Text>
            </View>
            <View style={[styles.statBox, { borderColor: theme.colors.outline }]}>
              <Text style={[styles.statLbl, { color: muted }]}>Bakiye</Text>
              <Text style={[styles.statVal, { color: fg }]}>{fmtTry(currentBalance)}</Text>
              <Text style={[styles.statHint, { color: muted }]}>
                Kayıtlı gelirler − giderler (tanıtımdaki sabit gider dahil).
              </Text>
            </View>
            <View style={[styles.statBox, { borderColor: theme.colors.outline }]}>
              <Text style={[styles.statLbl, { color: muted }]}>Kalan</Text>
              <Text style={[styles.statVal, { color: fg }]}>{remaining > 0 ? fmtTry(remaining) : '—'}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.scenario, { borderColor: 'rgba(245,158,11,0.35)', backgroundColor: theme.dark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)' }]}>
          <Text style={[styles.scenarioLbl, { color: fg }]}>
            Aylık biriktirme: <Text style={{ color: amber, fontWeight: '700' }}>{fmtTry(sliderClamped)}</Text>
          </Text>
          <View style={styles.stepRow}>
            <Pressable
              style={[styles.stepBtn, { borderColor: theme.colors.outline }]}
              onPress={() => setMonthly((m) => Math.max(0, m - step))}
              accessibilityLabel="Azalt"
            >
              <MaterialCommunityIcons name="minus" size={22} color={fg} />
            </Pressable>
            <Text style={[styles.stepHint, { color: muted }]}>±{step} ₺</Text>
            <Pressable
              style={[styles.stepBtn, { borderColor: theme.colors.outline }]}
              onPress={() => setMonthly((m) => Math.min(sliderMax, m + step))}
              accessibilityLabel="Artır"
            >
              <MaterialCommunityIcons name="plus" size={22} color={fg} />
            </Pressable>
          </View>
          <Text style={[styles.monthsTxt, { color: muted }]}>
            {monthsNeeded != null
              ? `Bu tempoda kalan tutar için yaklaşık ${monthsNeeded} ay.`
              : remaining <= 0
                ? 'Hedefe ulaşıldıysa senaryoyu alışkanlık için oynatabilirsin.'
                : 'Aylık tutarı artır; süre hesabı için pozitif birikim kullan.'}
          </Text>
          {monthlyIncomeNet != null && monthlyFixedCosts != null ? (
            <Text style={[styles.profileTxt, { color: muted }]}>
              Tanıtımdaki tahminler: net gelir {fmtTry(monthlyIncomeNet)}, sabit gider {fmtTry(monthlyFixedCosts)}
              {surplus != null ? ` → serbest pay ≈ ${fmtTry(surplus)} / ay.` : '.'} İşlemler listesinde Maaş ve Faturalar
              satırlarına bak.
            </Text>
          ) : (
            <Text style={[styles.profileTxt, { color: muted }]}>
              Net gelir ve sabit gider tanıtımdan gelmediyse iç halka devreye girmez.
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  h3: { fontSize: 15, fontWeight: '600' },
  legend: { fontSize: 11, marginTop: 6, lineHeight: 16 },
  ringRow: { marginTop: 16, flexDirection: 'column', gap: 16 },
  ringWrap: { width: 188, height: 188, alignSelf: 'center', position: 'relative' },
  pctLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  pct: { fontSize: 26, fontWeight: '700' },
  kalan: { fontSize: 10, textAlign: 'center', marginTop: 2 },
  statsCol: { gap: 10 },
  statBox: { borderWidth: 1, borderRadius: 12, padding: 12 },
  statLbl: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  statVal: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  statHint: { fontSize: 10, marginTop: 6, lineHeight: 14 },
  scenario: { marginTop: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, padding: 14 },
  scenarioLbl: { fontSize: 13 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 12 },
  stepBtn: { borderWidth: 1, borderRadius: 10, padding: 10 },
  stepHint: { fontSize: 12 },
  monthsTxt: { fontSize: 12, marginTop: 12, lineHeight: 18 },
  profileTxt: { fontSize: 11, marginTop: 10, lineHeight: 16 },
});
