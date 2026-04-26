import { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategorySlice } from '@/lib/groupExpenseByCategory';
import { categoryColorForName } from '@/lib/categoryColor';
import { formatExpenseCategoryLabel } from '@/lib/formatExpenseCategoryLabel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TransactionRow } from '@/types/dashboard';

const SELECT_RING = 'hsl(var(--primary))';

interface AnalysisDonutSectionProps {
  slices: CategorySlice[];
  currentMonthTransactions: TransactionRow[];
}

function matchCategory(tx: TransactionRow, categoryName: string): boolean {
  const a = (tx.categoryName ?? '').trim().toLowerCase();
  const b = categoryName.trim().toLowerCase();
  return !tx.isIncome && a === b;
}

export function AnalysisDonutSection({ slices, currentMonthTransactions }: AnalysisDonutSectionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = useMemo(
    () =>
      slices.map((s) => ({
        name: s.name,
        value: s.value,
        fill: categoryColorForName(s.name),
      })),
    [slices]
  );

  const total = slices.reduce((acc, s) => acc + s.value, 0);
  const selectedName = activeIndex !== null && slices[activeIndex] ? slices[activeIndex].name : null;

  const recentForSelected = useMemo(() => {
    if (!selectedName) return [];
    return currentMonthTransactions
      .filter((t) => matchCategory(t, selectedName))
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 3);
  }, [currentMonthTransactions, selectedName]);

  if (total <= 0 || data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Harcama dağılımı</CardTitle>
          <CardDescription>Bu ay henüz kategorilenebilir gider yok.</CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          Gider ekledikçe pasta grafiği dolar.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Harcama dağılımı</CardTitle>
        <CardDescription>
          Bu ayki giderlerin kategori payları. Dilime veya listedeki isme tıklayın; altta son 3 hareket listelenir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative mx-auto h-[min(320px,70vw)] max-w-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="58%" outerRadius="88%" paddingAngle={2}>
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={entry.fill}
                    stroke={activeIndex === index ? SELECT_RING : 'hsl(var(--background))'}
                    strokeWidth={activeIndex === index ? 3 : 1}
                    className="cursor-pointer outline-none transition-opacity hover:opacity-90"
                    onClick={() => setActiveIndex((i) => (i === index ? null : index))}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, item) => {
                  const v = Number(value ?? 0);
                  const label = formatExpenseCategoryLabel(String((item as { payload?: { name?: string } })?.payload?.name ?? ''));
                  return [`${v.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL (${total > 0 ? ((v / total) * 100).toFixed(0) : 0}%)`, label];
                }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                {total.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] font-medium text-muted-foreground">TL · bu ay</p>
            </div>
          </div>
        </div>

        <ul className="flex flex-wrap gap-2">
          {data.map((d, index) => (
            <li key={d.name}>
              <button
                type="button"
                onClick={() => setActiveIndex((i) => (i === index ? null : index))}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                  activeIndex === index
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-muted/40 hover:bg-muted'
                }`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.fill }} aria-hidden />
                <span>{formatExpenseCategoryLabel(d.name)}</span>
              </button>
            </li>
          ))}
        </ul>

        {selectedName ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {formatExpenseCategoryLabel(selectedName)} — son hareketler
            </p>
            {recentForSelected.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Bu ay bu kategoride kayıt yok.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {recentForSelected.map((t) => (
                  <li
                    key={t.transactionId}
                    className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 text-sm last:border-0 last:pb-0"
                  >
                    <span className="min-w-0 flex-1 text-foreground">{t.description}</span>
                    <span className="shrink-0 tabular-nums text-destructive">-{Number(t.amount).toFixed(2)} TL</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">Kategori seçmek için dilime veya etikete tıklayın.</p>
        )}
      </CardContent>
    </Card>
  );
}
