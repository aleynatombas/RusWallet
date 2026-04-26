/**
 * Web DashboardProfileSummaryCard ile aynı: tanıtımdan gelen net gelir/gider ve hedef → Analiz.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Card, useTheme } from 'react-native-paper';
import { getCardShadow } from '../theme/cardShadow';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { OnboardingStateDto } from '../types/onboarding';
import type { MainTabParamList } from '../navigation/types';

function formatTry(n: number): string {
  return `${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`;
}

export function MobileDashboardProfileSummaryCard() {
  const theme = useTheme();
  const isDark = theme.dark;
  const { user } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [state, setState] = useState<OnboardingStateDto | null>(null);

  useEffect(() => {
    if (!user?.onboardingCompleted) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<OnboardingStateDto>('/Onboarding/state');
        if (cancelled) return;
        setState(data);
      } catch {
        if (!cancelled) setState(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.onboardingCompleted, user?.userId]);

  if (!user?.onboardingCompleted || !state?.completed) return null;

  const p = state.profile;
  const inc = p?.monthlyIncomeNet != null && p.monthlyIncomeNet > 0 ? Number(p.monthlyIncomeNet) : null;
  const fix = p?.monthlyFixedCostsApprox != null && p.monthlyFixedCostsApprox > 0 ? Number(p.monthlyFixedCostsApprox) : null;
  const goal = p?.mainGoal?.trim();

  if (inc == null && fix == null && !goal) return null;

  const fg = isDark ? '#f8fafc' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const violetIcon = isDark ? '#a78bfa' : '#7c3aed';

  function goAnalysisGoal() {
    navigation.navigate('Analysis', { scrollToGoal: true });
  }

  const cardShadow = getCardShadow(isDark);

  return (
    <Card
      style={[
        styles.card,
        cardShadow,
        {
          borderColor: isDark ? 'rgba(139, 92, 246, 0.35)' : 'rgba(139, 92, 246, 0.25)',
          backgroundColor: isDark ? 'rgba(76, 29, 149, 0.12)' : 'rgba(237, 233, 254, 0.5)',
        },
      ]}
      mode="outlined"
    >
      <Card.Content style={styles.pad}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="star-four-points-outline" size={22} color={violetIcon} />
          <Text style={[styles.title, { color: fg }]}>Sohbetle kaydettiğin profil</Text>
        </View>
        <Text style={[styles.desc, { color: muted }]}>
          Net gelir ve sabit gider değerlerin bu ay için otomatik işlem satırı olarak da eklenir; gerçek hareketlerin
          geldikçe listeyi güncelleyebilirsin.
        </Text>

        {(inc != null || fix != null) && (
          <View style={styles.statGrid}>
            {inc != null ? (
              <View style={[styles.statBox, { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]}>
                <View style={[styles.statIcon, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)' }]}>
                  <MaterialCommunityIcons name="wallet-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.statTextCol}>
                  <Text style={[styles.statLabel, { color: muted }]}>Net gelir</Text>
                  <Text style={[styles.statValue, { color: fg }]}>{formatTry(inc)}</Text>
                </View>
              </View>
            ) : null}
            {fix != null ? (
              <View
                style={[
                  styles.statBox,
                  {
                    borderColor: isDark ? 'rgba(244,63,94,0.35)' : 'rgba(244,63,94,0.25)',
                    backgroundColor: isDark ? 'rgba(244,63,94,0.08)' : 'rgba(244,63,94,0.06)',
                  },
                ]}
              >
                <View style={[styles.statIcon, { backgroundColor: isDark ? 'rgba(244,63,94,0.2)' : 'rgba(244,63,94,0.12)' }]}>
                  <MaterialCommunityIcons name="receipt-text-outline" size={20} color={theme.colors.error} />
                </View>
                <View style={styles.statTextCol}>
                  <Text style={[styles.statLabel, { color: muted }]}>Sabit giderler (ay)</Text>
                  <Text style={[styles.statValue, { color: fg }]}>{formatTry(fix)}</Text>
                </View>
              </View>
            ) : null}
          </View>
        )}

        {goal ? (
          <Pressable
            onPress={goAnalysisGoal}
            style={({ pressed }) => [
              styles.goalPress,
              {
                borderColor: isDark ? 'rgba(245,158,11,0.4)' : 'rgba(245,158,11,0.35)',
                backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)',
                opacity: pressed ? 0.92 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Hedefi analizlerde aç"
          >
            <MaterialCommunityIcons name="target" size={22} color={isDark ? '#fbbf24' : '#d97706'} style={styles.goalIcon} />
            <View style={styles.goalTextWrap}>
              <Text style={[styles.goalKicker, { color: isDark ? 'rgba(251,191,36,0.9)' : '#b45309' }]}>
                Hedef · Analizlerde aç
              </Text>
              <Text style={[styles.goalBody, { color: fg }]} numberOfLines={4}>
                {goal}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={muted} />
          </Pressable>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16 },
  pad: { paddingVertical: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontSize: 17, fontWeight: '600', flex: 1 },
  desc: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  statGrid: { gap: 10 },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextCol: { flex: 1, minWidth: 0 },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalPress: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  goalIcon: { marginTop: 2 },
  goalTextWrap: { flex: 1, minWidth: 0 },
  goalKicker: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  goalBody: { fontSize: 14, lineHeight: 20 },
});
