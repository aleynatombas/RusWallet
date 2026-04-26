import { ArrowDownRight, ArrowUpRight, Equal } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatTry(n: number): string {
  return n.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

interface DashboardStatusCardProps {
  /** Tüm zamanlar: API’deki toplam gelir − toplam gider */
  lifetimeBalance: number;
  lifetimeTotalIncome: number;
  lifetimeTotalExpense: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

/** Üst kart: toplam bakiye (tüm zamanlar) + bu ay gelir/gider + bu ay net (tutarlı matematik). */
export function DashboardStatusCard({
  lifetimeBalance,
  lifetimeTotalIncome,
  lifetimeTotalExpense,
  monthlyIncome,
  monthlyExpense,
}: DashboardStatusCardProps) {
  const monthNet = monthlyIncome - monthlyExpense;

  return (
    <section
      className={cn(
        'rounded-3xl border border-white/15 bg-white/50 p-6 shadow-lg backdrop-blur-xl',
        'dark:border-white/10 dark:bg-slate-900/50'
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Toplam bakiye</p>
      <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-foreground sm:text-5xl">
        ₺{formatTry(lifetimeBalance)}
      </p>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Bu rakam <strong className="font-medium text-foreground">tüm zamanların</strong> netidir (kayıtlı tüm gelirler − tüm giderler). Alttaki iki kutu ise{' '}
        <strong className="font-medium text-foreground">yalnızca bu ay</strong> içindir; birbirinden farklı dilimler olduğu için doğrudan çıkarma yapmayın.
      </p>
      <p className="mt-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs tabular-nums text-muted-foreground">
        <span className="text-foreground">Tüm zamanlar:</span> ₺{formatTry(lifetimeTotalIncome)}{' '}
        <span className="text-muted-foreground">−</span> ₺{formatTry(lifetimeTotalExpense)}{' '}
        <span className="text-muted-foreground">=</span>{' '}
        <span className="font-medium text-foreground">₺{formatTry(lifetimeBalance)}</span>
      </p>

      <p className="mb-2 mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Bu ay özeti</p>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div
          className={cn(
            'flex flex-col gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3',
            'dark:bg-primary/15'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary">
              <ArrowUpRight className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-primary">
              Gelir
            </span>
          </div>
          <p className="text-xl font-semibold tabular-nums text-primary">₺{formatTry(monthlyIncome)}</p>
          <p className="text-[11px] text-muted-foreground">Bu ay</p>
        </div>

        <div
          className={cn(
            'flex flex-col gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3',
            'dark:bg-muted/25'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ArrowDownRight className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Gider
            </span>
          </div>
          <p className="text-xl font-semibold tabular-nums text-foreground">₺{formatTry(monthlyExpense)}</p>
          <p className="text-[11px] text-muted-foreground">Bu ay</p>
        </div>
      </div>

      <div
        className={cn(
          'mt-3 flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3',
          monthNet >= 0
            ? 'border-primary/30 bg-primary/[0.08] dark:bg-primary/12'
            : 'border-border bg-muted/50 dark:bg-muted/25'
        )}
      >
        <Equal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Bu ay net</p>
          <p
            className={cn(
              'text-lg font-semibold tabular-nums',
              monthNet >= 0 ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            ₺{formatTry(monthNet)}
          </p>
          <p className="text-[11px] text-muted-foreground">Bu ay gelir − bu ay gider</p>
        </div>
      </div>
    </section>
  );
}
