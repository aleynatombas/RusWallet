import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarDays, Info, Radar, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { FinancialCockpitDto } from '@/types/financialRoadmap';
import { cockpitInsightLine } from '@/lib/cockpitInsightStack';
import { formatPageTitleDisplay } from '@/lib/pageTitle';

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

function EsnekRing({ percent }: { percent: number }) {
  const p = Math.min(100, Math.max(0, percent));
  const r = 20;
  const stroke = 3.5;
  const c = 2 * Math.PI * r;
  const offset = c - (p / 100) * c;
  const color = 'stroke-primary';

  return (
    <div className="relative h-[3.75rem] w-[3.75rem] shrink-0" aria-hidden>
      <svg className="-rotate-90 transform" width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="none" className="stroke-muted/50" strokeWidth={stroke} />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          className={cn('transition-[stroke-dashoffset] duration-500', color)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold tabular-nums text-foreground">{Math.round(p)}%</span>
      </div>
    </div>
  );
}

const cockpitSliceCardClass =
  'flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/20 shadow-elevation dark:bg-zinc-900/40 dark:shadow-md dark:shadow-black/30';

const projectedClass =
  'text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-[1.75rem]';

interface SliceProps {
  cockpit: FinancialCockpitDto;
  className?: string;
}

/** Sol sütun satır 1 — Ay sonu */
export function CockpitAySonuCard({ cockpit, className }: SliceProps) {
  const m = cockpit.monthEnd;
  const hasDisp = m.hasDisposableReference ?? false;
  const monthDetailTitle = m.projectedUsesFixedPlusFlexibleSplit
    ? 'Tanıyalım sabit gider toplamı + kira/fatura/abonelik dışı esnek harcamaların temposunun ay sonuna yayılması. Anasayfadaki bu ay gider: bugüne kadar gerçek toplam.'
    : 'Tüm giderlerin bugüne kadar ortalamasının ay sonuna doğrusal yayılması. Anasayfadaki bu ay gider: bugüne kadar gerçek toplam.';

  return (
    <Card className={cn(cockpitSliceCardClass, className)}>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-2 pt-3 sm:px-3.5 sm:pt-3.5">
        <p className="mb-2 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
          {cockpitInsightLine(m.insightStack, 'predictive_analysis')}
        </p>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <div className="flex min-h-0 items-start gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className={projectedClass}>{fmtTry(m.projectedMonthTotal)}</p>
              {m.forecastNextMonthTotal != null && m.forecastNextMonthTotal > 0 ? (
                <p className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">
                  Gelecek ay öngörüsü: {fmtTry(m.forecastNextMonthTotal)}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {hasDisp ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                    <Zap className="h-3 w-3" aria-hidden />
                    {m.isOverPaceVersusDisposable
                      ? formatPageTitleDisplay('Yüksek tempo')
                      : formatPageTitleDisplay('Uyumlu tempo')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {formatPageTitleDisplay('Referans yok')}
                  </span>
                )}
                {m.projectedUsesFixedPlusFlexibleSplit ? (
                  <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                    {formatPageTitleDisplay('Sabit + esnek model')}
                  </span>
                ) : (
                  <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                    {formatPageTitleDisplay('Doğrusal ölçek')}
                  </span>
                )}
                <button
                  type="button"
                  className="inline-flex rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                  title={monthDetailTitle}
                  aria-label="Hesaplama detayı"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <EsnekRing percent={m.budgetFillPercent} />
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2">
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {m.daysRemainingInMonth} {formatPageTitleDisplay('gün')}
            </span>
            <span className="text-[9px] text-muted-foreground">{formatPageTitleDisplay('ay sonuna')}</span>
          </div>

          <div className="space-y-1">
            <Progress
              value={Math.min(100, Math.max(0, m.budgetFillPercent))}
              className="h-2 bg-muted/80"
              indicatorClassName="bg-primary"
            />
            <p className="text-[9px] text-muted-foreground">{formatPageTitleDisplay('Esnek pay doluluğu')}</p>
          </div>

          <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">{m.shortMessage}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Sol sütun satır 2 — Radar */
export function CockpitRadarCard({ cockpit, className }: SliceProps) {
  const r = cockpit.radar;

  return (
    <Card className={cn(cockpitSliceCardClass, className)}>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-2 pt-3 sm:px-3.5 sm:pt-3.5">
        <p className="mb-2 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
          {cockpitInsightLine(r.insightStack, 'ml_anomaly')}
        </p>
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

  return (
    <Card className={cn(cockpitSliceCardClass, className)}>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-2 pt-3 sm:px-3.5 sm:pt-3.5">
        <p className="mb-2 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
          {cockpitInsightLine(o.insightStack, 'ml_opportunity')}
        </p>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          {o.isLearning ? (
            <>
              <CockpitSkeletonLines />
              <p className="text-[11px] leading-snug text-muted-foreground">{o.shortMessage}</p>
            </>
          ) : (
            <>
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                {o.tiles.map((t, i) => (
                  <div
                    key={`${t.label}-${i}`}
                    className="min-w-0 border-b border-border/50 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-xs font-semibold leading-tight text-foreground">
                      <span className="mr-1" aria-hidden>
                        {t.iconEmoji}
                      </span>
                      {t.label}
                    </span>
                    {t.subtitle ? (
                      <span className="mt-1 block text-[10px] text-muted-foreground">{t.subtitle}</span>
                    ) : null}
                    {t.estimatedSaving != null ? (
                      <span className="mt-1.5 block text-xs font-bold tabular-nums text-foreground">
                        ≈ {fmtTry(t.estimatedSaving)}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
              <p className="line-clamp-2 text-[10px] leading-snug text-foreground/85 sm:line-clamp-3 sm:text-[11px]">{o.shortMessage}</p>
            </>
          )}

          <div className="pt-1">
            <Button type="button" variant="default" size="sm" className="h-8 w-full text-[11px]" asChild>
              <Link to="/transactions">{formatPageTitleDisplay('Harcama ekle')}</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
