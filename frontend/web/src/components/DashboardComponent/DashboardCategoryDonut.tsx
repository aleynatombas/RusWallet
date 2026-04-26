import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategorySlice } from '@/lib/groupExpenseByCategory';
import { categoryColorSemanticOrHash } from '@/lib/categoryColor';
import { formatExpenseCategoryLabel } from '@/lib/formatExpenseCategoryLabel';
import { dashboardPanelClass } from '@/lib/dashboardStyles';
import { cn } from '@/lib/utils';

const SELECT_RING = 'hsl(var(--primary))';

function formatTl(n: number): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface DashboardCategoryDonutProps {
  slices: CategorySlice[];
  monthlyExpenseTotal: number;
  title: string;
  centerHint: string;
  emptyCompact: string;
  emptyFull: string;
  className?: string;
  compact?: boolean;
}

export function DashboardCategoryDonut({
  slices,
  monthlyExpenseTotal,
  title,
  centerHint,
  emptyCompact,
  emptyFull,
  className,
  compact,
}: DashboardCategoryDonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = useMemo(
    () =>
      slices.map((s) => ({
        name: s.name,
        value: s.value,
        fill: categoryColorSemanticOrHash(s.name),
      })),
    [slices]
  );

  const total = monthlyExpenseTotal > 0 ? monthlyExpenseTotal : slices.reduce((a, s) => a + s.value, 0);
  const selected = activeIndex !== null && slices[activeIndex] ? slices[activeIndex] : null;
  const pct = selected && total > 0 ? Math.round((selected.value / total) * 100) : null;
  const label = selected ? formatExpenseCategoryLabel(selected.name) : null;

  const sliceStroke = 'hsl(var(--card))';

  if (total <= 0 || data.length === 0) {
    return (
      <section
        className={cn(
          dashboardPanelClass,
          'box-border flex w-full min-w-0 max-w-full flex-col justify-center overflow-x-hidden backdrop-blur-sm max-lg:flex-none',
          'lg:flex-1 lg:min-h-0',
          compact ? 'p-4' : 'min-h-[280px] p-6',
          className
        )}
      >
        <h2 className={cn('font-semibold text-foreground', compact ? 'text-base' : 'text-lg')}>{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{compact ? emptyCompact : emptyFull}</p>
        {!compact ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/transactions" className="font-medium text-primary underline-offset-4 hover:underline">
              İşlemler
            </Link>{' '}
            sayfasından gider ekleyebilirsin.
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section
      className={cn(
        dashboardPanelClass,
        'box-border flex w-full min-w-0 max-w-full flex-col overflow-hidden backdrop-blur-sm max-lg:flex-none',
        'lg:min-h-0 lg:flex-1',
        compact ? 'p-3 sm:p-4' : 'min-h-[280px] p-6',
        className
      )}
    >
      <div className={cn('shrink-0', compact ? 'mb-2' : 'mb-3')}>
        <div className="min-w-0">
          <h2 className={cn('font-semibold text-foreground', compact ? 'text-base' : 'text-lg')}>{title}</h2>
          {!compact ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Dilime tıklayın; merkezde kategori veya toplam görünür.
            </p>
          ) : null}
        </div>
      </div>

      {/* Geniş iç boşluk (innerRadius↑) + yeterli kutu yüksekliği → metin halkanın içinde kalır */}
      <div
            className={cn(
              'relative mx-auto aspect-square w-full shrink-0',
              compact ? 'max-w-[260px] sm:max-w-[280px]' : 'max-w-[300px] sm:max-w-[340px]'
            )}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="70%"
                  outerRadius="90%"
                  paddingAngle={2}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={entry.fill}
                      stroke={activeIndex === index ? SELECT_RING : sliceStroke}
                      strokeWidth={activeIndex === index ? 2 : 1}
                      className="cursor-pointer outline-none transition-opacity hover:opacity-90"
                      onClick={() => setActiveIndex((i) => (i === index ? null : index))}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, item) => {
                    const v = Number(value ?? 0);
                    const raw = String((item as { payload?: { name?: string } })?.payload?.name ?? '');
                    const l = formatExpenseCategoryLabel(raw);
                    return [`${formatTl(v)} TL (${total > 0 ? ((v / total) * 100).toFixed(0) : 0}%)`, l];
                  }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-[18%] py-[22%]">
              <div className="w-full text-center">
                {selected && pct !== null && label ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <p className="line-clamp-2 max-w-full text-[10px] font-medium uppercase leading-tight tracking-wide text-muted-foreground sm:text-[11px]">
                      {label}
                    </p>
                    <p className="text-sm font-semibold tabular-nums leading-tight text-foreground sm:text-base">
                      ₺{formatTl(selected.value)}{' '}
                      <span className="text-primary">%{pct}</span>
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-0.5">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                      Toplam harcama
                    </p>
                    <p className="text-base font-bold tabular-nums leading-none text-foreground sm:text-lg sm:leading-tight">
                      ₺{formatTl(total)}
                    </p>
                    <p className="text-[9px] text-muted-foreground sm:text-[10px]">{centerHint}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <ul
            className={cn(
              'flex flex-wrap justify-center gap-1.5',
              compact ? 'mt-2.5' : 'mt-4',
              'gap-1.5'
            )}
          >
            {data.map((d, index) => (
              <li key={d.name}>
                <button
                  type="button"
                  onClick={() => setActiveIndex((i) => (i === index ? null : index))}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-left text-[10px] font-medium transition-colors sm:text-xs',
                    activeIndex === index
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-muted/40 hover:bg-muted'
                  )}
                >
                  <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: d.fill }} aria-hidden />
                  {formatExpenseCategoryLabel(d.name)}
                </button>
              </li>
            ))}
          </ul>

      {!compact ? (
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Hızlı işlem için{' '}
          <Link to="/transactions" className="font-medium text-primary underline-offset-4 hover:underline">
            İşlemler
          </Link>
          .
        </p>
      ) : null}
    </section>
  );
}
