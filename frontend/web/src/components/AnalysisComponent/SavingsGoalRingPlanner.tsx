import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

function fmtTry(n: number): string {
  return `${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`;
}

export interface SavingsGoalRingPlannerProps {
  targetAmount: number;
  currentBalance: number;
  monthlyIncomeNet: number | null;
  monthlyFixedCosts: number | null;
  defaultMonthlySaving?: number;
}

export function SavingsGoalRingPlanner({
  targetAmount,
  currentBalance,
  monthlyIncomeNet,
  monthlyFixedCosts,
  defaultMonthlySaving = 5_000,
}: SavingsGoalRingPlannerProps) {
  const [monthly, setMonthly] = useState(defaultMonthlySaving);

  const surplus =
    monthlyIncomeNet != null && monthlyFixedCosts != null
      ? Math.max(0, monthlyIncomeNet - monthlyFixedCosts)
      : null;

  const remaining = Math.max(0, targetAmount - currentBalance);

  const monthsNeeded = useMemo(() => {
    if (remaining <= 0 || monthly <= 0) return null;
    return Math.ceil(remaining / monthly);
  }, [remaining, monthly]);

  const sliderMax = useMemo(() => {
    return Math.max(
      5_000,
      Math.ceil(monthly),
      Math.ceil(targetAmount / 12),
      surplus != null && surplus > 0 ? Math.ceil(surplus * 2.5) : 200_000
    );
  }, [monthly, targetAmount, surplus]);

  const sliderClamped = Math.min(monthly, sliderMax);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/60 ',
        'p-5 shadow-elevation-lg dark:shadow-md'
      )}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full  blur-2xl " />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />

      <div className="relative">
        <h3 className="text-sm font-semibold text-foreground">Hedef planı</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Dış: bakiye / hedef
          </span>
          {' · '}
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-violet-500 opacity-90" /> İç: aylık plan / (net gelir − sabit
            gider)
          </span>
        </p>

        <div className="mt-6 flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
    

          <div className="w-full min-w-0 flex-1 space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-border/50 bg-background/80 px-3 py-2.5 shadow-elevation dark:shadow-sm">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Hedef</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{fmtTry(targetAmount)}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/80 px-3 py-2.5 shadow-elevation dark:shadow-sm">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Bakiye</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{fmtTry(currentBalance)}</p>
                <p className="mt-1 text-[10px] leading-tight text-muted-foreground">
                  Kayıtlı gelirler − giderler (tanıtımdaki sabit gider dahil).
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/80 px-3 py-2.5 shadow-elevation dark:shadow-sm sm:col-span-1">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Kalan</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                  {remaining > 0 ? fmtTry(remaining) : '—'}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-border/60  px-4 py-3 ">
              <label htmlFor="goal-monthly-slider" className="text-xs font-medium text-foreground">
                Aylık biriktirme senaryosu:{' '}
                <span className="tabular-nums text-amber-800 dark:text-amber-200">{fmtTry(sliderClamped)}</span>
              </label>
              <input
                id="goal-monthly-slider"
                type="range"
                min={0}
                max={Math.max(sliderMax, 1)}
                step={500}
                value={sliderClamped}
                onChange={(e) => setMonthly(Number(e.target.value))}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-amber-600 dark:accent-amber-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-md"
              />
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {monthsNeeded != null ? (
                  <>
                    Bu tempoda kalan tutar için yaklaşık <strong className="text-foreground">{monthsNeeded}</strong>{' '}
                    ay.
                  </>
                ) : remaining <= 0 ? (
                  <>Hedefe ulaşıldıysa bu senaryoyu sadece alışkanlık için kullanabilirsin.</>
                ) : (
                  <>Aylık tutarı artır; süre hesabı pozitif birikimle görünür.</>
                )}
              </p>
              {monthlyIncomeNet != null && monthlyFixedCosts != null ? (
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  Tanıtımdaki tahminler: net gelir{' '}
                  <strong className="tabular-nums text-foreground">{fmtTry(monthlyIncomeNet)}</strong>, sabit gider{' '}
                  <strong className="tabular-nums text-foreground">{fmtTry(monthlyFixedCosts)}</strong>
                  {surplus != null ? (
                    <>
                      {' '}
                      → aylık <strong className="text-foreground">serbest</strong> pay ≈{' '}
                      <strong className="tabular-nums text-foreground">{fmtTry(surplus)}</strong>
                    </>
                  ) : null}
                  . Bu işlemler ayda bir kez listene işlenir; gelir/gider ekranında{' '}
                  <strong className="font-normal text-foreground">Maaş</strong> ve{' '}
                  <strong className="font-normal text-foreground">Faturalar</strong> satırlarına bak.
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Net gelir ve sabit gider tanıtımdan gelmediyse iç halka devreye girmez; tanıtımı tamamladığından emin ol.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
