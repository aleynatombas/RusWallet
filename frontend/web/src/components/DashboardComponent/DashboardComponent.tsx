/**
 * Anasayfa: lg+ tek ekran (içerik viewport’a sığar); dar ekranda MainLayout `main` ile dikey kaydırma.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatFullName } from '@/lib/formatDisplayName';
import { PAGE_TITLE_CLASS, formatPageTitleDisplay } from '@/lib/pageTitle';
import type { FinanceSummary, TransactionRow } from '../../types/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { groupExpenseByCategory } from '@/lib/groupExpenseByCategory';
import {
  DASHBOARD_PERIOD_OPTIONS,
  getDashboardPeriodLabels,
  getDashboardTransactionsUrl,
  type DashboardPeriod,
} from '@/lib/dashboardPeriod';
import { AiShortcutOrbs } from './AiShortcutOrbs';
import { DashboardCategoryDonut } from './DashboardCategoryDonut';
import { DashboardMetricCards } from './DashboardMetricCards';
import { DashboardPeriodSelect } from './DashboardPeriodSelect';
import { cn } from '@/lib/utils';

const PERIOD_STORAGE_KEY = 'ruswallet-dashboard-period';

function readStoredPeriod(): DashboardPeriod {
  try {
    const s = localStorage.getItem(PERIOD_STORAGE_KEY);
    if (s && DASHBOARD_PERIOD_OPTIONS.some((o) => o.value === s)) return s as DashboardPeriod;
  } catch {
    /* ignore */
  }
  return 'thisMonth';
}

export function DashboardComponent() {
  const { user } = useAuth();
  const welcomeName = formatFullName(user?.firstName, user?.lastName);
  const [period, setPeriod] = useState<DashboardPeriod>(readStoredPeriod);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [monthTransactions, setMonthTransactions] = useState<TransactionRow[]>([]);
  const [lastTransaction, setLastTransaction] = useState<TransactionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const periodLabels = useMemo(() => getDashboardPeriodLabels(period), [period]);

  useEffect(() => {
    try {
      localStorage.setItem(PERIOD_STORAGE_KEY, period);
    } catch {
      /* ignore */
    }
  }, [period]);

  const loadDashboard = useCallback(async (options?: { silent?: boolean }) => {
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
      const month = monthRes.data ?? [];
      setMonthTransactions(month);
      setLastTransaction(lastRes.data?.[0] ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Veri yüklenemedi.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const onTx = () => void loadDashboard({ silent: true });
    window.addEventListener('ruswallet-transactions-changed', onTx);
    return () => window.removeEventListener('ruswallet-transactions-changed', onTx);
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

  return (
    <div className="relative flex w-full min-w-0 max-w-full flex-col overflow-x-hidden lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-90 dark:opacity-70"
        style={{
          background: `
          radial-gradient(ellipse 100% 60% at 50% -15%, hsl(197 55% 44% / 0.15), transparent 55%),
          radial-gradient(ellipse 70% 50% at 100% 30%, hsl(204 48% 42% / 0.08), transparent 50%),
          radial-gradient(ellipse 60% 45% at 0% 70%, hsl(190 45% 40% / 0.07), transparent 45%)
          `,
        }}
      />

      <header className="mb-3 shrink-0 sm:mb-4">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h1 className={cn(PAGE_TITLE_CLASS, 'w-full min-w-0 text-center sm:flex-1 sm:text-left')}>
            {formatPageTitleDisplay(welcomeName ? `Hoş geldin, ${welcomeName}` : 'Hoş geldin')}
          </h1>
          <DashboardPeriodSelect value={period} onChange={setPeriod} />
        </div>
      </header>

      {error ? (
        <p className="mb-2 shrink-0 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <Card className="flex flex-col justify-center border-white/10 bg-white/30 backdrop-blur-md dark:bg-slate-900/40 lg:min-h-0 lg:flex-1">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Özet yükleniyor…</CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
          <div className="shrink-0">
            <DashboardMetricCards
              monthlyIncome={monthlyIncome}
              monthlyExpense={monthlyExpense}
              lifetimeBalance={totalAssets}
              incomeTitle={periodLabels.incomeTitle}
              incomeSubtitle={periodLabels.incomeSubtitle}
              expenseTitle={periodLabels.expenseTitle}
              expenseSubtitle={periodLabels.expenseSubtitle}
            />
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:gap-4 lg:overflow-hidden">
            <div className="flex min-w-0 lg:min-h-0 lg:col-span-2">
              <AiShortcutOrbs
                compact
                topCategories={donutSlices}
                monthTransactionCount={monthTransactions.length}
                periodTransactionLabel={periodLabels.shortcutStatsLabel}
                lastTransaction={lastTransaction}
              />
            </div>
            <div className="flex min-w-0 lg:min-h-0 lg:col-span-1">
              <DashboardCategoryDonut
                compact
                slices={donutSlices}
                monthlyExpenseTotal={monthlyExpense}
                title={periodLabels.donutTitle}
                centerHint={periodLabels.donutCenterHint}
                emptyCompact={periodLabels.donutEmptyCompact}
                emptyFull={periodLabels.donutEmptyFull}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
