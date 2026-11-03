import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { CategoryShareDto, SpendingHabitsInsightDto } from '@/types/smartInsights';
import {
  AiNote,
  DataCollectionState,
  fmtTry,
  InsightCardShell,
  InsightError,
  InsightSkeleton,
} from '../insights/InsightCardShell';
import { ChangeBadge } from '../insights/ForecastInsightCard';

/** RusWallet turkuaz paleti (index.css --chart-*); "Diğer" nötr. */
const SLICE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-4))',
];
const OTHER_COLOR = 'hsl(var(--muted-foreground) / 0.35)';

function sliceColor(c: CategoryShareDto, i: number) {
  return c.isOther ? OTHER_COLOR : SLICE_COLORS[i % SLICE_COLORS.length];
}

interface Props {
  data: SpendingHabitsInsightDto | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  /** Odak ekranı: büyük grafik ve tüm kategoriler sayfada gösterilir. */
  expanded?: boolean;
  title?: string;
  className?: string;
}

/** Bu ayın kategori dağılımı ("Harcama dağılımım"). */
export function SpendingHabitsCard({ data, loading, error, onRetry, expanded = false, title = 'Harcama dağılımım', className }: Props) {
  const [open, setOpen] = useState(false);
  const ready = data?.status === 'ready' && data.categories.length > 0;

  return (
    <>
      <InsightCardShell
        title={title}
        icon={<PieIcon className="h-4 w-4" aria-hidden />}
        onOpenDetail={ready ? () => setOpen(true) : undefined}
        expanded={expanded}
        className={className}
      >
        {loading ? (
          <InsightSkeleton />
        ) : error ? (
          <InsightError message={error} onRetry={onRetry} />
        ) : !data || data.status === 'error' ? (
          <InsightError message={data?.message || 'Harcama dağılımı hesaplanamadı.'} onRetry={onRetry} />
        ) : !ready ? (
          <DataCollectionState
            purpose="Bu ay paranın hangi kategorilere gittiğini ve geçen aya göre neyin değiştiğini gösterir."
            requirements={[
              {
                label: `${data.monthLabel || 'Bu ay'} gider kaydı`,
                current: data.dataQuality.expenseTransactionCount,
                required: data.dataQuality.requiredTransactions,
                unit: 'kayıt',
              },
            ]}
            why="Birkaç kayıtla yüzdeler yanıltıcı olur; tek bir harcama bütün dağılımı kaplayabilir."
            tip="Bu ayki giderlerini kategorileriyle birlikte ekle; dağılım üçüncü kayıttan sonra görünür."
          />
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground">{data.monthLabel} · bugüne kadar toplam gider</p>
                <p className="text-xl font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-2xl">
                  {fmtTry(data.totalExpense)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                {data.changeVsPreviousPercent != null ? (
                  <ChangeBadge value={data.changeVsPreviousPercent} />
                ) : null}
                <p className="text-[9px] text-muted-foreground">
                  {data.previousPeriodTotal != null
                    ? `${data.previousPeriodLabel}: ${fmtTry(data.previousPeriodTotal)}`
                    : 'Geçen ay kaydı yok'}
                </p>
              </div>
            </div>

            {expanded ? (
              <>
                <div className="grid gap-4 md:grid-cols-[13rem_minmax(0,1fr)] md:items-center">
                  <div className="relative mx-auto h-48 w-48 md:h-52 md:w-52">
                    <Donut categories={data.categories} large />
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-muted-foreground">Zorunlu gider</span>
                      <span className="text-lg font-semibold tabular-nums text-foreground">%{Math.round(data.fixedSharePercent)}</span>
                    </div>
                  </div>
                  <CategoryTable categories={data.categories} />
                </div>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  Değişim, geçen ayın aynı dönemine ({data.previousPeriodLabel}) göre hesaplanır; böylece ayın başında yarım ay tam ayla
                  karşılaştırılmaz. Kira, fatura ve abonelikler zorunlu gider sayılır. {data.transactionCount} gider kaydı kullanıldı.
                </p>
                {data.commentary ? <AiNote text={data.commentary} source={data.commentarySource} clamp={false} /> : null}
              </>
            ) : (
              <>
            <div className="flex min-h-0 flex-1 items-center gap-3">
              <div className="relative h-[92px] w-[92px] shrink-0 sm:h-[104px] sm:w-[104px]">
                <Donut categories={data.categories} />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[9px] text-muted-foreground">Zorunlu</span>
                  <span className="text-xs font-semibold tabular-nums text-foreground">%{Math.round(data.fixedSharePercent)}</span>
                </div>
              </div>
              <ul className="min-w-0 flex-1 space-y-0.5" aria-label="Kategori dağılımı">
                {data.categories.slice(0, 4).map((c, i) => (
                  <CategoryRow key={c.categoryName} c={c} color={sliceColor(c, i)} />
                ))}
                {data.categories.length > 4 ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => setOpen(true)}
                      className="text-[10px] font-medium text-primary hover:underline"
                    >
                      Tüm kategoriler ({data.categories.length})
                    </button>
                  </li>
                ) : null}
              </ul>
            </div>

            {data.commentary ? <AiNote text={data.commentary} source={data.commentarySource} /> : null}
              </>
            )}
          </>
        )}
      </InsightCardShell>

      {ready && data && !expanded ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Harcama alışkanlıklarım · {data.monthLabel}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {data.transactionCount} gider kaydı · kıyas: {data.previousPeriodLabel} (aynı gün sayısı)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 px-4 py-4">
              <div className="mx-auto h-44 w-44">
                <Donut categories={data.categories} large />
              </div>
              <CategoryTable categories={data.categories} />
              <p className="text-[10px] leading-snug text-muted-foreground">
                Değişim, geçen ayın aynı dönemine ({data.previousPeriodLabel}) göre hesaplanır; böylece ayın başında yarım ay tam ayla
                karşılaştırılmaz. Kira, fatura ve abonelikler zorunlu gider sayılır.
              </p>
              {data.commentary ? <AiNote text={data.commentary} source={data.commentarySource} /> : null}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

function CategoryTable({ categories }: { categories: CategoryShareDto[] }) {
  return (
    <ul className="divide-y divide-border/60 rounded-md border border-border" aria-label="Kategori tutarları">
      {categories.map((c, i) => (
        <li key={c.categoryName} className="flex items-center gap-2 px-2.5 py-1.5 text-[11px]">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: sliceColor(c, i) }} aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            {c.categoryName}
            {c.isFixed ? <span className="ml-1 text-[9px] text-muted-foreground">(zorunlu)</span> : null}
          </span>
          <span className="tabular-nums text-muted-foreground">%{Math.round(c.sharePercent)}</span>
          <span className="w-20 text-right font-semibold tabular-nums">{fmtTry(c.amount)}</span>
          <span className="w-14 text-right">
            {c.changePercent != null ? (
              <ChangeBadge value={c.changePercent} small />
            ) : (
              <span className="text-[9px] text-muted-foreground">{c.previousAmount === 0 ? 'yeni' : '—'}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CategoryRow({ c, color }: { c: CategoryShareDto; color: string }) {
  return (
    <li className="flex items-center gap-1.5 text-[11px]" title={`${c.categoryName}: ${fmtTry(c.amount)}`}>
      <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: color }} aria-hidden />
      <span className="min-w-0 flex-1 truncate text-foreground/90">{c.categoryName}</span>
      <span className="shrink-0 tabular-nums text-muted-foreground">%{Math.round(c.sharePercent)}</span>
      <span className="hidden w-[4.5rem] shrink-0 text-right font-semibold tabular-nums sm:inline">{fmtTry(c.amount)}</span>
      <span className={cn('w-11 shrink-0 text-right')}>
        {c.changePercent != null ? <ChangeBadge value={c.changePercent} small /> : null}
      </span>
    </li>
  );
}

function Donut({ categories, large = false }: { categories: CategoryShareDto[]; large?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={categories}
          dataKey="amount"
          nameKey="categoryName"
          innerRadius={large ? '62%' : '64%'}
          outerRadius="100%"
          paddingAngle={categories.length > 1 ? 1.5 : 0}
          stroke="none"
          isAnimationActive={false}
        >
          {categories.map((c, i) => (
            <Cell key={c.categoryName} fill={sliceColor(c, i)} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const c = payload[0].payload as CategoryShareDto;
            return (
              <div className="rounded-md border border-border bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow-elevation-lg">
                <p className="font-semibold">{c.categoryName}</p>
                <p className="tabular-nums">
                  {fmtTry(c.amount)} · %{Math.round(c.sharePercent)}
                </p>
              </div>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
