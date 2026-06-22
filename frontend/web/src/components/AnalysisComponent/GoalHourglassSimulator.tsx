import { useEffect, useMemo, useState } from 'react';
import { Flag, Sparkles } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { formatPageTitleDisplay } from '@/lib/pageTitle';

export function formatGoalAmountTry(n: number): string {
  return `${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`;
}

/** Dashboard ile uyumlu: kuruşlu gösterim (kayıtlı gelir/gider toplamları için). */
export function formatGoalMoneyTry(n: number, maximumFractionDigits: 0 | 2 = 2): string {
  return `${n.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  })} ₺`;
}

function addMonthsLabel(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

interface GoalHourglassSimulatorProps {
  /** Tanıyalım’da yazılan hedef kısa metni */
  mainGoalShort: string;
  /** Tanıyalım’da kayıtlı hedef tutar (TL) */
  targetAmount: number;
  /** Genel bakiye (özet); kalan tahmini için */
  currentBalance: number;
  /**
   * Sürgü üst sınırı: tercihen bu ay kayıtlı gelir − gider; yoksa Tanıyalım gelir − zorunlu gider.
   */
  monthlyDisposableCap: number;
  /** Üst sınırın veri kaynağı (sürgü adımı için). */
  disposableSource: 'records' | 'onboarding';
  defaultAllocation: number; forecastNextMonthSpending?: number | null; className?: string;
}

/** Dış kart tek çerçeve; içerik düz blok — ek kutu yok */
const goalSummaryBlockClass = 'flex min-h-[3.25rem] flex-col justify-center gap-1';

/**
 * Üstte hedef + tahmini varış yan yana; altta aylık tutar ve sürgü (kaydırılabilir).
 */
export function GoalHourglassSimulator({
  mainGoalShort,
  targetAmount,
  currentBalance,
  monthlyDisposableCap,
  disposableSource,
  defaultAllocation,
  forecastNextMonthSpending,
  className,
}: GoalHourglassSimulatorProps) {
  const [allocation, setAllocation] = useState(defaultAllocation);

  const remaining = Math.max(0, targetAmount - currentBalance);

  const disposableMonthly = Math.max(0, monthlyDisposableCap);

  const maxSlider = useMemo(() => {
    if (disposableMonthly > 0) {
      if (disposableSource === 'records') {
        return Math.max(1, Math.floor(disposableMonthly));
      }
      return Math.max(250, Math.ceil(disposableMonthly / 250) * 250);
    }
    if (disposableSource === 'records') {
      return 0;
    }
    return Math.max(500, Math.ceil(remaining / 12) || 1, 5_000);
  }, [disposableMonthly, remaining, disposableSource]);

  const sliderStep = disposableSource === 'records' && disposableMonthly > 0 ? 1 : 250;

  const allocationClamped = Math.min(allocation, maxSlider);

  useEffect(() => {
    setAllocation((a) => Math.min(a, maxSlider));
  }, [maxSlider]);

  const monthsNeeded = useMemo(() => {
    if (remaining <= 0 || allocationClamped <= 0) return null;
    return Math.ceil(remaining / allocationClamped);
  }, [remaining, allocationClamped]);

  const etaLabel = monthsNeeded != null ? addMonthsLabel(monthsNeeded) : null;

  const varışPanel = (
    <>
      {remaining <= 0 ? (
        <div className={goalSummaryBlockClass}>
          <p className="text-center text-sm font-medium text-sky-800 dark:text-sky-200 sm:text-left">
            Hedefe ulaştın.
          </p>
        </div>
      ) : allocationClamped <= 0 ? (
        <div className={goalSummaryBlockClass}>
          <p className="text-center text-sm text-muted-foreground sm:text-left">Aylık tutarı artırınca güncellenir.</p>
        </div>
      ) : monthsNeeded != null && etaLabel ? (
        <div
          className={goalSummaryBlockClass}
          role="status"
          aria-label={`${formatPageTitleDisplay('Hedefe varış tarihin')}: ${etaLabel}`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10',
                'bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary'
              )}
              aria-hidden
            >
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium leading-tight text-sky-800/95 dark:text-sky-200/95 sm:text-xs">Tahmini varış</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums leading-tight text-sky-950 dark:text-sky-50 sm:text-base">{etaLabel}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  return (
    <section className={cn('flex min-h-0 flex-col gap-2', className)}>
      <div className="shrink-0">
        <div className="grid grid-cols-1 gap-4 border-b border-border/50 pb-4 sm:grid-cols-2 sm:items-stretch sm:gap-6">
          <div className={cn(goalSummaryBlockClass, 'min-w-0')}>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10',
                  'bg-neutral-500/12 text-neutral-600 dark:bg-white/10 dark:text-neutral-200'
                )}
                aria-hidden
              >
                <Flag className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-3 text-[11px] font-medium leading-tight text-muted-foreground sm:text-xs">
                  {mainGoalShort}
                </p>
                <p className="mt-0.5 text-sm font-bold tabular-nums leading-tight text-foreground sm:text-base">
                  {formatGoalAmountTry(targetAmount)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex min-h-0 min-w-0 flex-col justify-center sm:h-full">{varışPanel}</div>
        </div>
      </div>

      <div className="shrink-0 overflow-x-hidden">
        <div className="max-h-44 sm:max-h-52 overflow-y-auto">
          <div className="flex flex-col gap-2 pb-0.5 pr-0.5">
            <div className="px-0.5 pt-1 sm:px-0">
              <p className="text-xs font-medium leading-snug text-muted-foreground">
                {formatPageTitleDisplay('Her ay hedefe ayıracağın tutar')}
              </p>

              <div className="mt-1 flex items-start justify-between gap-3">
                <p className="text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
                  {disposableSource === 'records'
                    ? formatGoalMoneyTry(allocationClamped, 2)
                    : formatGoalAmountTry(allocationClamped)}
                </p>

                <div className="min-w-0 flex-1 space-y-1 pt-1 text-right">
                  {remaining > 0 && allocationClamped > 0 && monthsNeeded != null ? (
                    <p className="text-xs leading-snug text-muted-foreground">
                      {formatPageTitleDisplay('Bu tempoda yaklaşık')}{' '}
                      <span className="font-semibold tabular-nums text-foreground">{monthsNeeded} ay</span>{' '}
                      {formatPageTitleDisplay('sürebilir')}.
                    </p>
                  ) : null}


                </div>
              </div>
            </div>

            <div className="w-full space-y-1 px-0.5 pb-0.5">
              <Slider
                id="goal-alloc-slider"
                aria-label="Aylık hedef birikim tutarı"
                value={[allocationClamped]}
                onValueChange={(v) => setAllocation(v[0] ?? 0)}
                min={0}
                max={maxSlider}
                step={sliderStep}
                className="w-full py-0.5"
                trackClassName="h-1 bg-neutral-200 dark:bg-zinc-800"
                rangeClassName="bg-neutral-900 dark:bg-white"
                thumbClassName="h-3.5 w-3.5 border-0 bg-neutral-900 shadow-sm dark:bg-white dark:shadow-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1 focus-visible:ring-offset-background dark:focus-visible:ring-white/50"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
