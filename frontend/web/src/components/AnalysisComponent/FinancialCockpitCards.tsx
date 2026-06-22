import { AlertTriangle, Radar } from 'lucide-react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { FinancialCockpitDto } from '@/types/financialRoadmap';
import { ANALYSIS_CARD_TITLE_CLASS, formatPageTitleDisplay } from '@/lib/pageTitle';

function fmtTry(n: number): string {
  return `${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`;
}

function CockpitSkeletonLines() {
  return (
    <div className="space-y-2" aria-hidden>
      <div className="h-3 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-3 w-[88%] animate-pulse rounded-md bg-muted" />
      <div className="h-3 w-[72%] animate-pulse rounded-md bg-muted" />
    </div>
  );
}

const cockpitSliceCardClass =
  'flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/20 shadow-elevation dark:bg-zinc-900/40 dark:shadow-md dark:shadow-black/30';

interface SliceProps {
  cockpit: FinancialCockpitDto;
  className?: string;
}

/** Sol sütun satır 1 — Gelecek ay tahmini */
export function CockpitAySonuCard({ cockpit, className }: SliceProps) {
  const m = cockpit.monthEnd;
  const forecast =
    m.forecastNextMonthTotal != null && m.forecastNextMonthTotal > 0
      ? m.forecastNextMonthTotal
      : null;
  const prevMonthTotal = m.previousMonthTotal ?? null;
  const last3AvgTotal = m.last3MonthsAverageTotal ?? null;
  const daily = m.dailyAverageSpend ?? 0;
  const changeVsPrev = percentChange(forecast, prevMonthTotal);
  const changeVsLast3 = percentChange(forecast, last3AvgTotal);
  const hasAnalytics = forecast != null;

  return (
    <Card className={cn(cockpitSliceCardClass, className)}>
      <CardHeader className="shrink-0 px-3 pb-0 pt-2 sm:px-3.5 sm:pt-2.5">
        <CardTitle className={ANALYSIS_CARD_TITLE_CLASS}>
          {formatPageTitleDisplay('Gelecek ay tahmini')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden px-3 pb-3 pt-2 sm:px-3.5">
        {hasAnalytics ? (
          <div className="space-y-1.5">
            <p className="text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-[1.45rem]">
              {fmtTry(forecast!)}
            </p>

            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <MetricBadgeRow
                label="Geçen Aya Göre"
                value={changeVsPrev}
                showPlus
              />
              <MetricBadgeRow
                label="Son 3 Ay Ortalamasına Göre"
                value={changeVsLast3}
                showPlus
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border/50 bg-background/60 px-2 py-1 dark:bg-zinc-900/50">
              <span className="text-[10px] text-muted-foreground">Günlük Ortalama</span>
              <span className="text-xs font-semibold tabular-nums text-foreground">{fmtTry(daily)}</span>
            </div>

          </div>
        ) : (
          <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
            {formatPageTitleDisplay('Henüz yeterli veri yok')}
          </p>
        )}

        {m.shortMessage ? (
          <p className="line-clamp-2 text-[9px] leading-snug text-muted-foreground sm:text-[10px]">{m.shortMessage}</p>
        ) : null}

        {m.forecastDisclaimer ? (
          <p className="line-clamp-1 text-[8px] leading-snug text-muted-foreground/80 sm:text-[9px]">{m.forecastDisclaimer}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function percentChange(current: number | null, baseline: number | null): number | null {
  if (current == null || baseline == null || baseline <= 0) return null;
  return ((current - baseline) / baseline) * 100;
}

function MetricBadgeRow({
  label,
  value,
  showPlus = false,
}: {
  label: string;
  value: number | null;
  showPlus?: boolean;
}) {
  const tone = value == null ? 'neutral' : value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
  const badgeClass =
    tone === 'up'
      ? 'bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-300'
      : tone === 'down'
        ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300'
        : 'bg-muted text-muted-foreground border-border';
  const iconClass = tone === 'up' ? 'bi-arrow-up-right' : tone === 'down' ? 'bi-arrow-down-right' : 'bi-dash';

  return (
    <div className="flex items-center justify-between gap-1 rounded-md border border-border/40 bg-background/60 px-2 py-1 dark:bg-zinc-900/50">
      <span className="truncate text-[9px] text-muted-foreground" title={label}>{label}</span>
      <span className={cn('badge inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold tabular-nums', badgeClass)}>
        <i className={cn('bi', iconClass)} aria-hidden />
        {value == null ? '--' : `${showPlus && value > 0 ? '+' : ''}%${Math.round(value)}`}
      </span>
    </div>
  );
}

/** Sol sütun satır 2 — Radar */
export function CockpitRadarCard({ cockpit, className }: SliceProps) {
  const r = cockpit.radar;

  return (
    <Card className={cn(cockpitSliceCardClass, className)}>
      <CardHeader className="shrink-0 px-3 pb-0 pt-2 sm:px-3.5 sm:pt-2.5">
        <CardTitle className={ANALYSIS_CARD_TITLE_CLASS}>Anomali Tespiti</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-2 pt-2 sm:px-3.5 sm:pt-2.5">
        <div className={cn('flex min-h-0 flex-1 flex-col gap-2 overflow-hidden', r.isLowData && 'opacity-[0.55]')}>
          {r.hasUnusualSpending ? (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {formatPageTitleDisplay('Sinyal var')}
            </span>
          ) : null}

          {r.isLowData ? (
            <>
              <CockpitSkeletonLines />
              <p className="text-[11px] leading-snug text-muted-foreground">{r.shortMessage}</p>
            </>
          ) : r.hits.length > 0 ? (
            <ul className="min-h-0 divide-y divide-border/50">
              {r.hits.map((h, i) => (
                <li key={`${h.categoryLabel}-${i}`} className="flex items-center justify-between gap-2 py-2.5 first:pt-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground">
                      <AlertTriangle className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="truncate text-xs font-semibold">{h.categoryLabel}</span>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">{fmtTry(h.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-4">
              <Radar className="h-8 w-8 text-muted-foreground/70" aria-hidden />
              {r.topMonthCategoryLabel && r.topMonthCategoryAmount != null ? (
                <div className="text-center">
                  <p className="text-[10px] font-medium text-muted-foreground">
                    {formatPageTitleDisplay('Bu ay öne çıkan')}
                  </p>
                  <p className="text-base font-bold text-foreground">{r.topMonthCategoryLabel}</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-muted-foreground">
                    {fmtTry(r.topMonthCategoryAmount)}
                  </p>
                </div>
              ) : (
                <p className="max-w-[14rem] text-center text-[11px] text-muted-foreground">{r.shortMessage}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Sol sütun satır 3 — Fırsat */
export function CockpitFirsatCard({ cockpit, className }: SliceProps) {
  const o = cockpit.opportunities;
  const totalMonthlyPotential = o.tiles.reduce((sum, t) => sum + (t.estimatedSaving ?? 0), 0);
  const totalYearlyPotential = totalMonthlyPotential > 0 ? totalMonthlyPotential * 12 : 0;

  return (
    <Card className={cn(cockpitSliceCardClass, className)}>
      <CardHeader className="shrink-0 px-3 pb-0 pt-2 sm:px-3.5 sm:pt-2.5">
        <CardTitle className={ANALYSIS_CARD_TITLE_CLASS}>Tasarruf Fırsatları</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-2 pt-2 sm:px-3.5 sm:pt-2.5">
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          {o.isLearning ? (
            <>
              <CockpitSkeletonLines />
              <div className="rounded-md border border-border/50 bg-muted/20 px-2.5 py-1.5 dark:bg-muted/10">
                <p className="text-[11px] leading-snug text-muted-foreground">{o.shortMessage}</p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                {o.tiles.map((t, i) => (
                  <div
                    key={`${t.label}-${i}`}
                    className="min-w-0 border-b border-border/50 pb-2.5 last:border-0 last:pb-0"
                  >
                    {(() => {
                      const detail = [
                        t.subtitle?.trim(),
                      ]
                        .filter(Boolean)
                        .join('. ');

                      return (
                        <>
                          {detail ? (
                            <p className="text-[12px] leading-relaxed text-foreground/90 sm:text-[13px]">{detail}</p>
                          ) : (
                            <p className="text-[12px] leading-relaxed text-foreground/90 sm:text-[13px]">{t.label}</p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>
              <div className="rounded-md border border-border/60 bg-muted/35 px-2.5 py-1.5 dark:bg-muted/20">
                <p className="text-[12px] leading-relaxed text-foreground sm:text-[13px]">{o.shortMessage}</p>
                <div className="mt-1.5 grid grid-cols-1 gap-1 text-[11px] sm:text-[12px]">
                  <span className="text-muted-foreground">Aylık potansiyel: <span className="font-semibold text-foreground">{totalMonthlyPotential > 0 ? fmtTry(totalMonthlyPotential) : '-'}</span></span>
                  <span className="text-muted-foreground">Yıllık potansiyel: <span className="font-semibold text-foreground">{totalYearlyPotential > 0 ? fmtTry(totalYearlyPotential) : '-'}</span></span>
                </div>
              </div>
            </>
          )}

        </div>
      </CardContent>
    </Card>
  );
}
