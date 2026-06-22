/**
 * Mobil sıra: AI+predictive → ML anomali → ML fırsat → Hedef ve yol haritası → Yaşam tarzı → Son 6 ay gider (+ kısa soru).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  DeviceEventEmitter,
  type LayoutChangeEvent,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import axios from 'axios';
import { api } from '../services/api';
import type { FinanceSummary, TransactionRow } from '../types/dashboard';
import type { OnboardingStateDto, UserFinancialProfilePayload } from '../types/onboarding';
import type { FinancialRoadmapResponseDto } from '../types/financialRoadmap';
import type { MainTabParamList } from '../navigation/types';
import { MobileFinancialGoalSection } from './MobileFinancialGoalSection';
import { MobileYasamTarziCard } from './MobileYasamTarziCard';
import { MobileMonthSpendSparklineCard } from './MobileMonthSpendSparklineCard';
import { formatRoadmapLoadError } from '../lib/formatRoadmapLoadError';
import { getCurrentMonthRangeStrings } from '../lib/monthRange';
import { useAnalysisPalette } from '../theme/useAnalysisPalette';
import { CARD_SHADOW_BLEED, getCardShadow } from '../theme/cardShadow';
import { MobileCockpitMonthEndCard } from './analysis/MobileCockpitMonthEndCard';
import { MobileCockpitRadarCard } from './analysis/MobileCockpitRadarCard';
import { MobileCockpitFirsatCard } from './analysis/MobileCockpitFirsatCard';
import { MobileKisaSoruCard } from './analysis/MobileKisaSoruCard';

export function MobileAnalysisComponent() {
  const theme = useTheme();
  const p = useAnalysisPalette();
  const route = useRoute<RouteProp<MainTabParamList, 'Analysis'>>();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const scrollRef = useRef<ScrollView>(null);
  const goalSectionY = useRef(0);
  const pendingScrollToGoal = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roadmapError, setRoadmapError] = useState('');
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [roadmap, setRoadmap] = useState<FinancialRoadmapResponseDto | null>(null);
  const [onboardingProfile, setOnboardingProfile] = useState<UserFinancialProfilePayload | null>(null);
  const [monthTransactions, setMonthTransactions] = useState<TransactionRow[]>([]);

  const load = useCallback(async () => {
    setError('');
    setRoadmapError('');
    setLoading(true);
    try {
      const { start, end } = getCurrentMonthRangeStrings();
      const settled = await Promise.allSettled([
        api.get<FinanceSummary>('/Analysis/summary'),
        api.get<FinancialRoadmapResponseDto>('/Analysis/roadmap'),
        api.get<TransactionRow[]>(`/Transaction?start=${start}&end=${end}`),
      ]);

      const sumResult = settled[0];
      if (sumResult.status === 'fulfilled') {
        setSummary(sumResult.value.data ?? null);
      } else {
        setSummary(null);
        setError(sumResult.reason instanceof Error ? sumResult.reason.message : 'Özet yüklenemedi.');
      }

      const rmResult = settled[1];
      if (rmResult.status === 'fulfilled') {
        setRoadmap(rmResult.value.data ?? null);
      } else {
        setRoadmap(null);
        setRoadmapError(formatRoadmapLoadError(rmResult.reason));
      }

      const txResult = settled[2];
      if (txResult.status === 'fulfilled') {
        setMonthTransactions(txResult.value.data ?? []);
      } else {
        setMonthTransactions([]);
      }

      try {
        const onboardRes = await api.get<OnboardingStateDto>('/Onboarding/state');
        const prof = onboardRes.data?.profile;
        const g = prof?.mainGoal?.trim();
        setOnboardingProfile(g && g.length > 0 ? prof! : null);
      } catch {
        setOnboardingProfile(null);
      }
    } catch (err: unknown) {
      let msg = 'Veri yüklenemedi.';
      if (axios.isAxiosError(err)) {
        // axios type guard — err is AxiosError in this branch
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axErr = err as any;
        const apiMsg: unknown = axErr?.response?.data?.message;
        msg = typeof apiMsg === 'string' && apiMsg ? apiMsg : (String(axErr?.message || '') || msg);
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
      setRoadmap(null);
      setOnboardingProfile(null);
      setMonthTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // İşlem sekmesinde gelir/gider eklenince analizi yenile (sekme arka planda kalsa bile)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('ruswallet-transactions-changed', () => {
      void load();
    });
    return () => sub.remove();
  }, [load]);

  // Analiz sekmesine her odaklanıldığında taze veri yükle
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const surplusMonthlyFromOnboarding = useMemo(() => {
    if (!onboardingProfile) return 0;
    const inc =
      onboardingProfile.monthlyIncomeNet != null && onboardingProfile.monthlyIncomeNet > 0
        ? Number(onboardingProfile.monthlyIncomeNet)
        : null;
    const fix =
      onboardingProfile.monthlyFixedCostsApprox != null && onboardingProfile.monthlyFixedCostsApprox > 0
        ? Number(onboardingProfile.monthlyFixedCostsApprox)
        : null;
    if (inc == null || fix == null) return 0;
    return Math.max(0, inc - fix);
  }, [onboardingProfile]);

  const { monthlyDisposableCap, disposableSource } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const t of monthTransactions) {
      const a = Number(t.amount);
      if (t.isIncome) inc += a;
      else exp += a;
    }
    const net = Math.max(0, inc - exp);
    if (monthTransactions.length > 0) {
      return { monthlyDisposableCap: net, disposableSource: 'records' as const };
    }
    return {
      monthlyDisposableCap: surplusMonthlyFromOnboarding,
      disposableSource: 'onboarding' as const,
    };
  }, [monthTransactions, surplusMonthlyFromOnboarding]);

  const defaultAllocation = useMemo(() => {
    const base = monthlyDisposableCap;
    if (monthTransactions.length > 0 && base <= 0) return 0;
    if (base <= 0) return 5_000;
    if (monthTransactions.length > 0) {
      const maxS = Math.max(1, Math.floor(base));
      const raw = Math.min(30_000, Math.max(1, Math.round(base / 2)));
      return Math.min(raw, maxS);
    }
    const cap = Math.max(250, Math.ceil(base / 250) * 250);
    const raw = Math.min(30_000, Math.max(5_000, Math.round(base / 2 / 500) * 500));
    return Math.min(raw, cap);
  }, [monthlyDisposableCap, monthTransactions.length]);

  const performScrollToGoal = useCallback(() => {
    scrollRef.current?.scrollTo({ y: Math.max(0, goalSectionY.current - 12), animated: true });
    navigation.setParams({ scrollToGoal: false });
    pendingScrollToGoal.current = false;
  }, [navigation]);

  useEffect(() => {
    const want = route.params?.scrollToGoal === true;
    pendingScrollToGoal.current = want;
    if (!want || loading) return;
    if (!onboardingProfile?.mainGoal?.trim()) {
      navigation.setParams({ scrollToGoal: false });
      pendingScrollToGoal.current = false;
      return;
    }
    if (goalSectionY.current > 0) {
      const t = setTimeout(() => performScrollToGoal(), 120);
      return () => clearTimeout(t);
    }
  }, [route.params?.scrollToGoal, loading, onboardingProfile, navigation, performScrollToGoal]);

  function handleGoalSectionLayout(e: LayoutChangeEvent) {
    goalSectionY.current = e.nativeEvent.layout.y;
    if (!pendingScrollToGoal.current || goalSectionY.current <= 0) return;
    requestAnimationFrame(() => performScrollToGoal());
  }

  const cockpit = roadmap?.cockpit;
  const cardShadow = getCardShadow(theme.dark);
  const goOnboarding = useCallback(() => {
    const parent = navigation.getParent() as { navigate: (name: string, params?: unknown) => void } | undefined;
    if (!parent) return;
    parent.navigate('Onboarding', { mode: 'revisit' });
  }, [navigation]);

  return (
    <View style={[styles.screen, { backgroundColor: p.pageBg }]}>
      <ScrollView
        ref={scrollRef}
        style={[styles.scroll, { backgroundColor: p.pageBg }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <Text style={[styles.h1, { color: p.fg }]}>Analizlerim</Text>

        {error ? (
          <Text style={[styles.errorText, { color: theme.colors.error }]} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        {loading ? (
          <View
            style={[
              styles.loadingBox,
              cardShadow,
              { borderColor: p.border, backgroundColor: p.cardBg },
            ]}
          >
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[styles.loadingHint, { color: p.muted }]}>Yükleniyor…</Text>
          </View>
        ) : (
          <>
            {roadmapError ? (
              <View style={[styles.warnBox, cardShadow, { borderColor: theme.colors.error, backgroundColor: p.cardBg }]}>
                <Text style={[styles.warnText, { color: theme.colors.error }]}>{roadmapError}</Text>
              </View>
            ) : !roadmap?.cockpit ? (
              <View style={[styles.warnBox, cardShadow, { borderColor: p.border, backgroundColor: p.cardBg }]}>
                <Text style={[styles.mutedCenter, { color: p.muted }]}>Kokpit verisi şu an yüklenemiyor.</Text>
              </View>
            ) : (
              <>
                <MobileCockpitMonthEndCard cockpit={cockpit!} />
                <View onLayout={handleGoalSectionLayout}>
                  <MobileFinancialGoalSection
                    mainGoal={onboardingProfile?.mainGoal}
                    profile={onboardingProfile}
                    balance={Number(summary?.balance ?? 0)}
                    monthlyDisposableCap={monthlyDisposableCap}
                    disposableSource={disposableSource}
                    defaultAllocation={defaultAllocation}
                    forecastNextMonthSpending={roadmap?.cockpit?.monthEnd?.forecastNextMonthTotal ?? null}
                    onGoOnboarding={goOnboarding}
                  />
                </View>
                <MobileCockpitRadarCard cockpit={cockpit!} />
                {roadmap?.lifestyle ? <MobileYasamTarziCard lifestyle={roadmap.lifestyle} /> : null}
                <MobileCockpitFirsatCard cockpit={cockpit!} />
                <MobileMonthSpendSparklineCard sparkline={roadmap?.monthSpendSparkline} />
                {roadmap?.qaModule ? <MobileKisaSoruCard qa={roadmap.qaModule} /> : null}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16 + CARD_SHADOW_BLEED,
    paddingBottom: 100,
  },
  h1: { fontSize: 22, fontWeight: '700', marginBottom: 16, letterSpacing: -0.3 },
  errorText: { fontSize: 13, marginBottom: 12 },
  loadingBox: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  loadingHint: { fontSize: 14 },
  warnBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  warnText: { fontSize: 13, lineHeight: 18 },
  mutedCenter: { textAlign: 'center', fontSize: 12 },
});
