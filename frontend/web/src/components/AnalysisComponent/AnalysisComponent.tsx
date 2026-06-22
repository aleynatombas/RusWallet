/**
 * Analizlerim — lg: 3 satır × 2 sütun: sol kokpit üçlüsü | sağ hedef üçlüsü (eşit fr).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '@/services/api';
import type { FinanceSummary, TransactionRow } from '@/types/dashboard';
import type { FinancialRoadmapResponseDto } from '@/types/financialRoadmap';
import type { OnboardingStateDto, UserFinancialProfilePayload } from '@/types/onboarding';
import { KisaSoruCard, YasamTarziCard } from './AnalysisRoadmapSection';
import { CockpitAySonuCard, CockpitFirsatCard, CockpitRadarCard } from './FinancialCockpitCards';
import { MonthSpendSparklineCard } from './MonthSpendSparklineCard';
import { formatGoalTitleDisplay } from '@/lib/formatDisplayName';
import { parseSavingsTargetFromGoalText } from '@/lib/parseSavingsTargetFromGoalText';
import { GoalHourglassSimulator } from './GoalHourglassSimulator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatRoadmapLoadError } from '@/lib/formatRoadmapLoadError';
import { ANALYSIS_CARD_TITLE_CLASS, formatPageTitleDisplay } from '@/lib/pageTitle';
import { getCurrentMonthRangeStrings } from '@/lib/monthRange';

const goalPanelClass =
  'flex h-full min-h-[11rem] flex-col overflow-hidden rounded-lg border border-border bg-muted/20 shadow-elevation-lg dark:bg-zinc-900/35 dark:shadow-lg dark:shadow-black/40 lg:min-h-0';

const gridCellClass = 'min-h-0 min-w-0 flex flex-col lg:h-full lg:min-h-0';

export function AnalysisComponent() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [roadmap, setRoadmap] = useState<FinancialRoadmapResponseDto | null>(null);
  const [roadmapError, setRoadmapError] = useState('');
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
        setError(
          sumResult.reason instanceof Error ? sumResult.reason.message : 'Özet yüklenemedi.'
        );
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Veri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onTx = () => void load();
    window.addEventListener('ruswallet-transactions-changed', onTx);
    return () => window.removeEventListener('ruswallet-transactions-changed', onTx);
  }, [load]);

  useEffect(() => {
    if (loading || location.hash !== '#finans-hedef') return;
    const t = window.setTimeout(() => {
      document.getElementById('finans-hedef')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(t);
  }, [loading, location.hash]);

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

  const hasGoalSimulator =
    Boolean(onboardingProfile?.mainGoal?.trim()) && effectiveTarget != null && effectiveTarget > 0;

  const hasGoalSection = Boolean(onboardingProfile?.mainGoal?.trim());

  return (
    <div
      className={cn(
        'flex w-full min-h-0 flex-1 flex-col items-stretch gap-3 pb-2 lg:h-full lg:min-h-0 lg:items-stretch lg:gap-4 lg:pb-0'
      )}
    >
      {error ? (
        <p className="shrink-0 text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex min-h-[10rem] flex-1 items-center justify-center text-sm text-muted-foreground">
          Yükleniyor…
        </div>
      ) : (
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-3 lg:min-h-0 lg:gap-4">
          <div
            className={cn(
              'grid min-h-0 w-full min-w-0 flex-1 grid-cols-1 gap-3',
              'lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-4',
              'lg:h-full lg:min-h-0 lg:overflow-hidden'
            )}
          >
            {roadmapError ? (
              <div className={cn(gridCellClass, 'lg:col-span-2 lg:row-span-3')}>
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="px-3 py-6 sm:px-3.5">
                    <p className="text-center text-sm text-muted-foreground" role="alert">
                      {roadmapError}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : !roadmap ? (
              <div className={cn(gridCellClass, 'lg:col-span-2 lg:row-span-3')}>
                <Card>
                  <CardContent className="flex min-h-[10rem] items-center justify-center px-3 py-6">
                    <p className="text-center text-xs text-muted-foreground">{formatPageTitleDisplay('Veri yok')}</p>
                  </CardContent>
                </Card>
              </div>
            ) : !roadmap.cockpit ? (
              <div className={cn(gridCellClass, 'lg:col-span-2 lg:row-span-3')}>
                <Card>
                  <CardContent className="flex min-h-[10rem] items-center justify-center px-3 py-6">
                    <p className="text-center text-xs text-muted-foreground">
                      {formatPageTitleDisplay('Kokpit verisi şu an yüklenemiyor.')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <CockpitAySonuCard
                  cockpit={roadmap.cockpit}
                  className="min-h-[10rem] w-full min-w-0 lg:col-start-1 lg:row-start-1 lg:min-h-0 lg:h-full"
                />
                <Card
                  className={cn(
                    goalPanelClass,
                    'flex min-h-[10rem] w-full min-w-0 flex-col lg:col-start-2 lg:row-start-1 lg:min-h-0 lg:h-full'
                  )}
                >
                  <CardHeader className="shrink-0 bg-transparent px-3 pb-0 pt-2 sm:px-3.5 sm:pt-2.5">
                    <CardTitle className={cn('min-w-0', ANALYSIS_CARD_TITLE_CLASS)}>
                      {formatPageTitleDisplay('Hedef ve yol haritası')}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
                    {hasGoalSimulator && onboardingProfile?.mainGoal ? (
                      <div className="px-3 pb-2 pt-2 sm:px-3.5 sm:pb-3 sm:pt-2.5">
                        <GoalHourglassSimulator
                          className="min-h-0 shrink-0"
                          mainGoalShort={formatGoalTitleDisplay(onboardingProfile.mainGoal.trim().slice(0, 120))}
                          targetAmount={effectiveTarget!}
                          currentBalance={Number(summary?.balance ?? 0)}
                          monthlyDisposableCap={monthlyDisposableCap}
                          disposableSource={disposableSource}
                          defaultAllocation={defaultAllocation}
                          forecastNextMonthSpending={roadmap?.cockpit?.monthEnd?.forecastNextMonthTotal ?? null}
                        />
                      </div>
                    ) : (
                      <div
                        id={hasGoalSection ? undefined : 'finans-hedef'}
                        className="scroll-mt-16 flex min-h-0 flex-col justify-center px-3 pb-4 pt-2 text-center sm:px-3.5 sm:text-left"
                      >
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          Tanıtımda hedef ve tutar eklediğinde simülasyon burada görünür.
                        </p>
                        <div className="mt-4 flex justify-center sm:justify-start">
                          <Button asChild variant="outline" size="sm">
                            <Link to="/onboarding" state={{ background: location }}>
                              Tanıtıma git
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <CockpitRadarCard
                  cockpit={roadmap.cockpit}
                  className="min-h-[10rem] w-full min-w-0 lg:col-start-1 lg:row-start-2 lg:min-h-0 lg:h-full"
                />
                <YasamTarziCard
                  lifestyle={roadmap?.lifestyle}
                  className="min-h-0 w-full min-w-0 lg:col-start-2 lg:row-start-2 lg:h-full"
                />
                <CockpitFirsatCard
                  cockpit={roadmap.cockpit}
                  className="min-h-[10rem] w-full min-w-0 lg:col-start-1 lg:row-start-3 lg:min-h-0 lg:h-full"
                />
                <MonthSpendSparklineCard
                  sparkline={roadmap?.monthSpendSparkline}
                  className="min-h-[10rem] w-full min-w-0 lg:col-start-2 lg:row-start-3 lg:min-h-0 lg:h-full"
                />
              </>
            )}
          </div>

          {roadmap?.qaModule ? <KisaSoruCard qa={roadmap.qaModule} /> : null}
        </div>
      )}
    </div>
  );
}
