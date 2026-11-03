import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DataSufficiencyDto, SmartInsightsResponseDto } from '@/types/smartInsights';
import { fmtPct, fmtTry } from '../insights/InsightCardShell';
import { AI_ITEMS, ANALYSIS_ROUTES, FINANCE_ITEMS, type AnalysisNavItem, type HeroStat } from './AnalysisNav';

type Tone = 'ready' | 'attention' | 'collecting' | 'neutral';

interface TileSummary {
  metric: string;
  sub?: string;
  tone: Tone;
  /** Veri toplanıyorsa 0–100 ilerleme. */
  progress?: number;
}

export interface GoalInfo {
  name: string;
  target: number | null;
  /** Bakiye (gelir − gider); Hedeflerim ekranındaki "biriktirilen" ile aynı değer. */
  saved: number;
}

function progressOf(dq: DataSufficiencyDto, reqs?: [number, number][]): number {
  const pairs = reqs ?? [
    [dq.historyDays, dq.requiredHistoryDays],
    [dq.expenseTransactionCount, dq.requiredTransactions],
  ];
  const valid = pairs.filter(([, r]) => r > 0);
  if (valid.length === 0) return 0;
  return Math.round((valid.reduce((s, [c, r]) => s + Math.min(1, c / r), 0) / valid.length) * 100);
}

/** Veri toplama durumu: rozet "Veri toplanıyor" der; kartta ne kadarının hazır olduğu ilerleme çubuğuyla görünür. */
const collecting = (progress: number): TileSummary => ({
  metric: `%${progress} hazır`,
  sub: 'Daha fazla kayıt gerekiyor',
  tone: 'collecting',
  progress,
});

/** Hedef özeti analizlerden bağımsızdır; analizler yüklenemese de gösterilir. */
function summarizeGoal(goal: GoalInfo | null): TileSummary {
  if (!goal) return { metric: 'Hedef oluştur', sub: 'Henüz bir hedefin yok', tone: 'neutral' };
  if (!goal.target || goal.target <= 0) return { metric: goal.name, sub: 'Hedef tutarı ekle', tone: 'neutral' };
  const saved = Math.max(0, goal.saved);
  const pct = Math.floor(Math.min(100, (saved / goal.target) * 100));
  return {
    metric: `%${pct}`,
    sub: `${goal.name} · ${fmtTry(Math.max(0, goal.target - saved))} kaldı`,
    tone: 'ready',
    progress: pct,
  };
}

function summarize(insights: SmartInsightsResponseDto): Record<string, TileSummary> {
  const { forecast: f, anomalies: a, savings: s, spendingHabits: h, trend: t } = insights;
  const out: Record<string, TileSummary> = {};

  out[ANALYSIS_ROUTES.forecast] =
    f.status === 'ready' && f.predictedTotal != null
      ? {
          metric: fmtTry(f.predictedTotal),
          sub: `${f.targetMonthLabel.split(' ')[0]} tahmini${f.changeVsLastMonthPercent != null ? ` · ${fmtPct(f.changeVsLastMonthPercent)}` : ''}`,
          tone: 'ready',
        }
      : f.status === 'error'
        ? { metric: 'Hesaplanamadı', tone: 'neutral' }
        : collecting(progressOf(f.dataQuality));

  out[ANALYSIS_ROUTES.anomaly] =
    a.status === 'ready'
      ? a.totalCount > 0
        ? { metric: `${a.totalCount} olağan dışı harcama`, sub: a.topCategoryName ?? undefined, tone: 'attention' }
        : { metric: 'Her şey yolunda', sub: `Son ${a.evaluatedWindowDays} gün incelendi`, tone: 'ready' }
      : a.status === 'error'
        ? { metric: 'Hesaplanamadı', tone: 'neutral' }
        : collecting(progressOf(a.dataQuality));

  out[ANALYSIS_ROUTES.savings] =
    s.status === 'ready'
      ? s.opportunities.length > 0
        ? { metric: `${fmtTry(s.totalMonthlyPotential)}/ay`, sub: `${s.opportunities.length} fırsat bulundu`, tone: 'ready' }
        : { metric: 'Harcamaların dengede', tone: 'ready' }
      : s.status === 'error'
        ? { metric: 'Hesaplanamadı', tone: 'neutral' }
        : collecting(progressOf(s.dataQuality, [[s.dataQuality.completeMonths, 3], [s.dataQuality.expenseTransactionCount, s.dataQuality.requiredTransactions]]));

  const topCat = h.categories.find((c) => !c.isOther) ?? h.categories[0];
  out[ANALYSIS_ROUTES.spending] =
    h.status === 'ready' && topCat
      ? { metric: `${topCat.categoryName} %${Math.round(topCat.sharePercent)}`, sub: `Bu ay ${fmtTry(h.totalExpense)}`, tone: 'ready' }
      : h.status === 'error'
        ? { metric: 'Hesaplanamadı', tone: 'neutral' }
        : collecting(progressOf(h.dataQuality, [[h.dataQuality.expenseTransactionCount, h.dataQuality.requiredTransactions]]));

  out[ANALYSIS_ROUTES.trends] =
    t.status === 'ready'
      ? {
          metric: t.lastCompleteMonthChangePercent != null ? `Son ay ${fmtPct(t.lastCompleteMonthChangePercent)}` : fmtTry(t.averageMonthlyExpense),
          sub: `Aylık ort. gider ${fmtTry(t.averageMonthlyExpense)}`,
          tone: 'ready',
        }
      : t.status === 'error'
        ? { metric: 'Hesaplanamadı', tone: 'neutral' }
        : collecting(progressOf(t.dataQuality, [[t.dataQuality.completeMonths, 2]]));

  return out;
}

export type TileState = TileSummary | 'loading' | 'error';

/** Altı modülün kart durumları — hem Genel Bakış kartları hem hero özeti bunu kullanır (tek hesap). */
export function getTileStates(
  insights: SmartInsightsResponseDto | null,
  insightsLoading: boolean,
  insightsError: string,
  goal: GoalInfo | null,
  goalLoading: boolean
): Record<string, TileState> {
  const summaries = insights ? summarize(insights) : null;
  const out: Record<string, TileState> = {};
  for (const { to } of [...AI_ITEMS, ...FINANCE_ITEMS]) {
    if (to === ANALYSIS_ROUTES.goals) out[to] = goalLoading ? 'loading' : summarizeGoal(goal);
    else if (summaries) out[to] = summaries[to];
    else out[to] = !insightsLoading && insightsError ? 'error' : 'loading';
  }
  return out;
}

/** Hero'daki küçük durum rozetleri: "4 analiz hazır", "1 konu dikkat istiyor"… */
export function heroStatsFrom(states: Record<string, TileState>): HeroStat[] {
  const list = Object.values(states).filter((s): s is TileSummary => typeof s === 'object');
  if (list.length === 0) return [];
  const ready = list.filter((s) => s.tone === 'ready').length;
  const attention = list.filter((s) => s.tone === 'attention').length;
  const collecting = list.filter((s) => s.tone === 'collecting').length;
  const out: HeroStat[] = [];
  if (ready) out.push({ label: `${ready} analiz hazır`, tone: 'ready' });
  if (attention) out.push({ label: `${attention} konu dikkat istiyor`, tone: 'attention' });
  if (collecting) out.push({ label: `${collecting} analiz veri topluyor`, tone: 'collecting' });
  return out;
}

/** Genel Bakış: altı modüle giden tıklanabilir kartlar (tam genişlik ızgara). Grafik ya da detay göstermez. */
export function AnalysisOverview({ states, footer }: { states: Record<string, TileState>; footer?: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-5 lg:h-full lg:min-h-0 lg:gap-4">
      <Section title="AI Analizleri" icon={<Sparkles className="h-4 w-4" aria-hidden />} to={ANALYSIS_ROUTES.forecast} items={AI_ITEMS} states={states} />
      <Section title="Finansal Durum" icon={<Wallet className="h-4 w-4" aria-hidden />} to={ANALYSIS_ROUTES.goals} items={FINANCE_ITEMS} states={states} />
      {footer ? <div className="shrink-0">{footer}</div> : null}
    </div>
  );
}

function Section({
  title,
  icon,
  to,
  items,
  states,
}: {
  title: string;
  icon: ReactNode;
  to: string;
  items: AnalysisNavItem[];
  states: Record<string, TileState>;
}) {
  return (
    <section aria-label={title} className="flex flex-col lg:min-h-0 lg:flex-1">
      <div className="mb-2.5 flex shrink-0 items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
          {title}
        </h2>
        <Link
          to={to}
          className="inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          Bölüme git <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.to} className="min-w-0 lg:min-h-0">
            <Tile item={item} state={states[item.to]} />
          </li>
        ))}
      </ul>
    </section>
  );
}

const badge: Record<Tone, { label: string; cls: string; dot: string }> = {
  ready: { label: 'Hazır', cls: 'border-primary/25 bg-primary/10 text-primary', dot: 'bg-primary' },
  attention: {
    label: 'Dikkat',
    cls: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  collecting: {
    label: 'Veri toplanıyor',
    cls: 'border-border bg-muted/60 text-muted-foreground',
    dot: 'animate-pulse bg-muted-foreground/70',
  },
  neutral: { label: 'Başla', cls: 'border-border bg-muted/60 text-muted-foreground', dot: 'bg-muted-foreground/50' },
};

const barColor: Record<Tone, string> = {
  ready: 'bg-primary',
  attention: 'bg-amber-500',
  collecting: 'bg-primary/50',
  neutral: 'bg-muted-foreground/40',
};

function Tile({ item, state }: { item: AnalysisNavItem; state: TileState }) {
  const Icon = item.icon;
  const b = typeof state === 'object' ? badge[state.tone] : null;

  return (
    <Link
      to={item.to}
      className={cn(
        'group relative flex h-full min-h-[10.5rem] flex-col lg:min-h-0 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-elevation sm:p-5',
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevation-lg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-zinc-900/50'
      )}
    >
      {/* hover'da beliren ince vurgu çizgisi */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/70 to-primary/0 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />

      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </span>
        {state === 'loading' ? (
          <span className="h-5 w-16 animate-pulse rounded-full bg-muted" aria-hidden />
        ) : b ? (
          <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium', b.cls)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', b.dot)} aria-hidden />
            {b.label}
          </span>
        ) : null}
      </div>

      <div className="mt-3 min-w-0">
        <p className="truncate text-[15px] font-semibold text-foreground">{item.label}</p>
        <p className="truncate text-xs text-muted-foreground">{item.description}</p>
      </div>

      <div className="mt-auto pt-4">
        {state === 'loading' ? (
          <div className="space-y-2" aria-busy="true" aria-label="Yükleniyor">
            <div className="h-6 w-28 animate-pulse rounded-md bg-muted" />
            <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-36 animate-pulse rounded bg-muted" />
          </div>
        ) : state === 'error' ? (
          <p className="text-sm text-muted-foreground">Şu an yüklenemedi</p>
        ) : (
          <>
            <p
              className={cn(
                'truncate font-semibold tabular-nums tracking-tight',
                state.tone === 'collecting' || state.tone === 'neutral' ? 'text-base text-foreground/80' : 'text-2xl',
                state.tone === 'attention' && 'text-amber-600 dark:text-amber-300',
                state.tone === 'ready' && 'text-foreground'
              )}
            >
              {state.metric}
            </p>
            {state.progress != null ? (
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label={`${item.label} ilerlemesi`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={state.progress}
              >
                <div className={cn('h-full rounded-full transition-all', barColor[state.tone])} style={{ width: `${state.progress}%` }} />
              </div>
            ) : null}
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs text-muted-foreground">{state.sub ?? ' '}</p>
              <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary opacity-70 transition-opacity group-hover:opacity-100">
                Aç <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
