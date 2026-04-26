/**
 * Web `DashboardComponent` ile aynı veri ve düzen: «Hoş Geldin, Ad Soyad» + dönem seçici + üç metrik + AI kısayolları + kategori donut.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  DeviceEventEmitter,
  Platform,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Card, useTheme } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatFullName, formatGoalTitleDisplay } from '../lib/formatDisplayName';
import type { FinanceSummary, TransactionRow } from '../types/dashboard';
import {
  DASHBOARD_PERIOD_OPTIONS,
  getDashboardPeriodLabels,
  getDashboardTransactionsUrl,
  type DashboardPeriod,
} from '../lib/dashboardPeriod';
import { groupExpenseByCategory } from '../lib/groupExpenseByCategory';
import { MobileDashboardMetricCards } from './MobileDashboardMetricCards';
import { MobileAiShortcutOrbs } from './MobileAiShortcutOrbs';
import { MobileDashboardCategoryDonut } from './MobileDashboardCategoryDonut';
import { MobileDashboardPeriodSelect } from './MobileDashboardPeriodSelect';
import { CARD_SHADOW_BLEED, getCardShadow } from '../theme/cardShadow';

const PERIOD_STORAGE_KEY = 'ruswallet-dashboard-period';

export function MobileHomeComponent() {
  const theme = useTheme();
  const isDark = theme.dark;
  const insets = useSafeAreaInsets();
  const tabBarH = useBottomTabBarHeight();
  const { user } = useAuth();
  const welcomeName = formatFullName(user?.firstName, user?.lastName);
  const [period, setPeriod] = useState<DashboardPeriod>('thisMonth');
  const [periodHydrated, setPeriodHydrated] = useState(false);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [monthTransactions, setMonthTransactions] = useState<TransactionRow[]>([]);
  const [lastTransaction, setLastTransaction] = useState<TransactionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await AsyncStorage.getItem(PERIOD_STORAGE_KEY);
        if (cancelled) return;
        if (s && DASHBOARD_PERIOD_OPTIONS.some((o) => o.value === s)) {
          setPeriod(s as DashboardPeriod);
        }
      } finally {
        if (!cancelled) setPeriodHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!periodHydrated) return;
    void AsyncStorage.setItem(PERIOD_STORAGE_KEY, period);
  }, [period, periodHydrated]);

  const periodLabels = useMemo(() => getDashboardPeriodLabels(period), [period]);

  const loadDashboard = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) {
        setError('');
        setLoading(true);
      }
      try {
        const txUrl = getDashboardTransactionsUrl(period);
        const [sumRes, monthRes, lastRes] = await Promise.all([
          api.get<FinanceSummary>('/Analysis/summary'),
          api.get<TransactionRow[]>(txUrl),
          api.get<TransactionRow[]>(`/Transaction?period=all&take=1`),
        ]);
        setSummary(sumRes.data);
        setMonthTransactions(monthRes.data ?? []);
        setLastTransaction(lastRes.data?.[0] ?? null);
      } catch (err) {
        const msg = axios.isAxiosError(err)
          ? String(err.response?.data?.message ?? err.message)
          : 'Veri yüklenemedi.';
        setError(msg);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [period]
  );

  useEffect(() => {
    if (!periodHydrated) return;
    void loadDashboard();
  }, [loadDashboard, periodHydrated, period]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('ruswallet-transactions-changed', () => {
      void loadDashboard({ silent: true });
    });
    return () => sub.remove();
  }, [loadDashboard]);

  const { monthlyIncome, monthlyExpense, donutSlices } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const t of monthTransactions) {
      if (t.isIncome) inc += Number(t.amount);
      else exp += Number(t.amount);
    }
    return {
      monthlyIncome: inc,
      monthlyExpense: exp,
      donutSlices: groupExpenseByCategory(monthTransactions),
    };
  }, [monthTransactions]);

  const totalAssets = summary ? Number(summary.balance) : 0;

  const bg = theme.colors.background;

  /** Tab bar + home indicator + yüzen sohbet FAB — alttaki bloklar kesilmesin, rahat kaydırılsın */
  const scrollBottomPad = tabBarH + Math.max(insets.bottom, 10) + 88;
  const loadingShadow = getCardShadow(isDark);

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: bg }]}
        contentContainerStyle={[
          styles.scroll,
          {
            backgroundColor: bg,
            paddingBottom: scrollBottomPad,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces
        overScrollMode="auto"
      >
        <View style={styles.headerBlock}>
          <View style={styles.headerTitleCol}>
            <Text
              style={[
                styles.h1,
                { color: theme.colors.onSurface },
                Platform.OS === 'android' && { includeFontPadding: false },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {formatGoalTitleDisplay(welcomeName ? `Hoş geldin, ${welcomeName}` : 'Hoş geldin')}
            </Text>
          </View>
          <MobileDashboardPeriodSelect value={period} onChange={setPeriod} />
        </View>

        {error ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text> : null}

        {loading ? (
          <Card
            style={[
              styles.loadingCard,
              loadingShadow,
              {
                backgroundColor: isDark ? theme.colors.surface : 'rgba(255,255,255,0.3)',
                borderColor: isDark ? 'rgba(141,155,176,0.14)' : theme.colors.outline,
              },
            ]}
            mode="outlined"
          >
            <Card.Content style={styles.loadingInner}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={[styles.loadingHint, { color: theme.colors.onSurfaceVariant }]}>
                Özet yükleniyor…
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.stack}>
            <MobileDashboardMetricCards
              monthlyIncome={monthlyIncome}
              monthlyExpense={monthlyExpense}
              lifetimeBalance={totalAssets}
              incomeTitle={periodLabels.incomeTitle}
              incomeSubtitle={periodLabels.incomeSubtitle}
              expenseTitle={periodLabels.expenseTitle}
              expenseSubtitle={periodLabels.expenseSubtitle}
            />

            <MobileAiShortcutOrbs
              compact
              topCategories={donutSlices}
              monthTransactionCount={monthTransactions.length}
              lastTransaction={lastTransaction}
              isDark={isDark}
              periodTransactionLabel={periodLabels.shortcutStatsLabel}
            />

            <MobileDashboardCategoryDonut
              slices={donutSlices}
              monthlyExpenseTotal={monthlyExpense}
              isDark={isDark}
              compact
              donutTitle={periodLabels.donutTitle}
              donutCenterHint={periodLabels.donutCenterHint}
              donutEmptyCompact={periodLabels.donutEmptyCompact}
              donutEmptyFull={periodLabels.donutEmptyFull}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: 16 + CARD_SHADOW_BLEED, paddingTop: 12 },
  /** Sol metin / sağ dönem: alt kenarlar aynı çizgide; yatayda space-between */
  headerBlock: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    gap: 10,
    width: '100%',
  },
  headerTitleCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  h1: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'left',
    lineHeight: 24,
  },
  errorText: { fontSize: 13, marginBottom: 12 },
  loadingCard: {
    borderRadius: 16,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  loadingInner: { paddingVertical: 48, alignItems: 'center', gap: 12 },
  loadingHint: { fontSize: 14 },
  stack: { gap: 12 },
});
