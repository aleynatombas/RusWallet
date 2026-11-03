/**
 * Analizlerim — analiz merkezi. Veriler burada bir kez yüklenir; alt ekranlar (iç içe route) aynı veriyi kullanır,
 * sekme değiştirince yeniden istek atılmaz.
 *   /analysis                                Genel Bakış
 *   /analysis/ai/{forecast,anomaly,savings}
 *   /analysis/finance/{goals,spending,trends}
 */
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import type { FinanceSummary, TransactionRow } from '@/types/dashboard';
import type { FinancialRoadmapResponseDto } from '@/types/financialRoadmap';
import type { OnboardingStateDto, UserFinancialProfilePayload } from '@/types/onboarding';
import { KisaSoruCard } from './AnalysisRoadmapSection';
import { GoalRoadmapCard } from './dashboard/GoalRoadmapCard';
import { SpendingHabitsCard } from './dashboard/SpendingHabitsCard';
import { FinancialTrendCard } from './dashboard/FinancialTrendCard';
import { ForecastInsightCard } from './insights/ForecastInsightCard';
import { AnomalyInsightCard } from './insights/AnomalyInsightCard';
import { SavingsInsightCard } from './insights/SavingsInsightCard';
import type { SmartInsightsResponseDto } from '@/types/smartInsights';
import { parseSavingsTargetFromGoalText } from '@/lib/parseSavingsTargetFromGoalText';
import { InsightSkeleton } from './insights/InsightCardShell';
import { AnalysisOverview, getTileStates, heroStatsFrom } from './navigation/AnalysisOverview';
import {
  AI_ITEMS,
  ANALYSIS_ROUTES,
  AnalysisHero,
  FINANCE_ITEMS,
  ModuleChips,
  type AnalysisNavItem,
} from './navigation/AnalysisNav';
import { getCurrentMonthRangeStrings } from '@/lib/monthRange';

export function AnalysisComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [roadmap, setRoadmap] = useState<FinancialRoadmapResponseDto | null>(null);
  const [onboardingProfile, setOnboardingProfile] = useState<UserFinancialProfilePayload | null>(null);
  const [monthTransactions, setMonthTransactions] = useState<TransactionRow[]>([]);
  const [insights, setInsights] = useState<SmartInsightsResponseDto | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState('');

  /** Sol sütun ML/AI modülleri — tek istek; backend veri değişmedikçe önbellekten döner. */
  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    setInsightsError('');
    try {
      const res = await api.get<SmartInsightsResponseDto>('/Analysis/insights');
      setInsights(res.data ?? null);
    } catch {
      setInsights(null);
      setInsightsError('Analizler şu an yüklenemedi.');
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const markAnomalyNormal = useCallback(async (key: string) => {
    await api.post('/Analysis/insights/anomalies/feedback', { key });
    setInsights((prev) =>
      prev
        ? {
            ...prev,
            anomalies: {
              ...prev.anomalies,
              items: prev.anomalies.items.filter((i) => i.key !== key),
              totalCount: Math.max(0, prev.anomalies.totalCount - 1),
              dismissedCount: prev.anomalies.dismissedCount + 1,
            },
          }
        : prev
    );
    void api
      .get<SmartInsightsResponseDto>('/Analysis/insights')
      .then((r) => setInsights(r.data ?? null))
      .catch(() => undefined);
  }, []);

  const undoAnomaly = useCallback(async (key: string) => {
    await api.delete('/Analysis/insights/anomalies/feedback', { params: { key } });
    const r = await api.get<SmartInsightsResponseDto>('/Analysis/insights');
    setInsights(r.data ?? null);
  }, []);

  const load = useCallback(async () => {
    void loadInsights();
    setError('');
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
        setError(
          sumResult.reason instanceof Error ? sumResult.reason.message : 'Özet yüklenemedi.'
        );
      }

      const rmResult = settled[1];
      if (rmResult.status === 'fulfilled') {
        setRoadmap(rmResult.value.data ?? null);
      } else {
        setRoadmap(null);
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
        setOnboardingProfile(prof ?? null);
      } catch {
        setOnboardingProfile(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Veri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [loadInsights]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onTx = () => void load();
    window.addEventListener('ruswallet-transactions-changed', onTx);
    window.addEventListener('ruswallet-onboarding-completed', onTx);
    return () => {
      window.removeEventListener('ruswallet-transactions-changed', onTx);
      window.removeEventListener('ruswallet-onboarding-completed', onTx);
    };
  }, [load]);

  /** Eski bağlantı (/analysis#finans-hedef) yeni Hedeflerim ekranına yönlenir. */
  useEffect(() => {
    if (location.hash === '#finans-hedef') navigate(ANALYSIS_ROUTES.goals, { replace: true });
  }, [location.hash, navigate]);

  const effectiveTarget = useMemo(() => {
    if (!onboardingProfile?.mainGoal?.trim()) return null;
    const trimmed = onboardingProfile.mainGoal.trim();
    const parsed = parseSavingsTargetFromGoalText(trimmed);
    const stored =
      onboardingProfile.savingsTargetAmount != null && onboardingProfile.savingsTargetAmount > 0
        ? Number(onboardingProfile.savingsTargetAmount)
        : null;
    return stored ?? parsed;
  }, [onboardingProfile]);

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

  /** Anasayfadaki “Bu ay gelir − Bu ay gider” ile aynı mantık; bu ay işlem yoksa Tanıyalım’daki net gelir − zorunlu gider. */
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

  const retry = () => void loadInsights();
  const insightsBusy = insightsLoading && !insights;
  const goalName = onboardingProfile?.mainGoal?.trim() || '';

  const goalScreen = loading ? (
    <InsightSkeletonCard />
  ) : (
    <GoalRoadmapCard
      profile={onboardingProfile}
      targetAmount={effectiveTarget}
      balance={Number(summary?.balance ?? 0)}
      monthlyDisposableCap={monthlyDisposableCap}
      disposableSource={disposableSource}
      defaultAllocation={defaultAllocation}
      onProfileUpdated={(p) => setOnboardingProfile(p)}
      expanded
    />
  );

  const tileStates = getTileStates(
    insights,
    insightsLoading,
    insightsError,
    goalName ? { name: goalName, target: effectiveTarget, saved: Number(summary?.balance ?? 0) } : null,
    loading
  );

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-4 pb-6 lg:h-full lg:min-h-0 lg:pb-0">
      <AnalysisHero stats={heroStatsFrom(tileStates)} />

      {error ? (
        <p className="text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex min-w-0 flex-col lg:min-h-0 lg:flex-1">
      <Routes>
        <Route
          index
          element={
            <AnalysisOverview states={tileStates} footer={roadmap?.qaModule ? <KisaSoruCard qa={roadmap.qaModule} /> : null} />
          }
        />

        <Route path="ai" element={<Navigate to={ANALYSIS_ROUTES.forecast} replace />} />
        <Route
          path="ai/forecast"
          element={
            <DetailScreen items={AI_ITEMS} label="AI analizleri">
              <ForecastInsightCard data={insights?.forecast ?? null} loading={insightsBusy} error={insightsError} onRetry={retry} expanded />
            </DetailScreen>
          }
        />
        <Route
          path="ai/anomaly"
          element={
            <DetailScreen items={AI_ITEMS} label="AI analizleri">
              <AnomalyInsightCard
                data={insights?.anomalies ?? null}
                loading={insightsBusy}
                error={insightsError}
                onRetry={retry}
                onMarkNormal={markAnomalyNormal}
                onUndo={undoAnomaly}
                expanded
              />
            </DetailScreen>
          }
        />
        <Route
          path="ai/savings"
          element={
            <DetailScreen items={AI_ITEMS} label="AI analizleri">
              <SavingsInsightCard data={insights?.savings ?? null} loading={insightsBusy} error={insightsError} onRetry={retry} expanded />
            </DetailScreen>
          }
        />

        <Route path="finance" element={<Navigate to={ANALYSIS_ROUTES.goals} replace />} />
        <Route
          path="finance/goals"
          element={
            <DetailScreen items={FINANCE_ITEMS} label="Finansal durum">
              {goalScreen}
            </DetailScreen>
          }
        />
        <Route
          path="finance/spending"
          element={
            <DetailScreen items={FINANCE_ITEMS} label="Finansal durum">
              <SpendingHabitsCard data={insights?.spendingHabits ?? null} loading={insightsBusy} error={insightsError} onRetry={retry} expanded />
            </DetailScreen>
          }
        />
        <Route
          path="finance/trends"
          element={
            <DetailScreen items={FINANCE_ITEMS} label="Finansal durum">
              <FinancialTrendCard
                data={insights?.trend ?? null}
                forecast={insights?.forecast ?? null}
                loading={insightsBusy}
                error={insightsError}
                onRetry={retry}
                expanded
              />
            </DetailScreen>
          }
        />

        <Route path="*" element={<Navigate to={ANALYSIS_ROUTES.overview} replace />} />
      </Routes>
      </div>
    </div>
  );
}

/** Odak ekranı: bölüm içi alt sekmeler + seçilen tek modül. */
function DetailScreen({ items, label, children }: { items: AnalysisNavItem[]; label: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-3 lg:min-h-0 lg:flex-1">
      <ModuleChips items={items} label={label} />
      {/* Masaüstünde sayfa kaymaz: kart kalan yüksekliği doldurur, uzun içerik kartın içinde kayar. */}
      <div className="flex min-w-0 flex-col lg:min-h-0 lg:flex-1">{children}</div>
    </div>
  );
}

function InsightSkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4 dark:bg-zinc-900/40">
      <InsightSkeleton />
    </div>
  );
}
