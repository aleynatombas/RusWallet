import { useMemo, useState } from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CategorySlice } from '@/lib/groupExpenseByCategory';
import {
  buildExpenseCategoryMonthMatrix,
  explainCategoryCorrelation,
  type CategoryCorrelationNote,
} from '@/lib/buildCategoryCorrelation';
import type { TransactionRow } from '@/types/dashboard';
import { buildSankeyBudgetData } from '@/lib/buildSankeyBudgetData';

interface CategoryFlowSankeyProps {
  incomeSlices: CategorySlice[];
  expenseSlices: CategorySlice[];
  multiMonthTransactions: TransactionRow[];
}

export function CategoryFlowSankey({
  incomeSlices,
  expenseSlices,
  multiMonthTransactions,
}: CategoryFlowSankeyProps) {
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null);

  const sankeyPayload = useMemo(
    () => buildSankeyBudgetData(incomeSlices, expenseSlices),
    [incomeSlices, expenseSlices]
  );

  const matrix = useMemo(
    () => buildExpenseCategoryMonthMatrix(multiMonthTransactions, 6).byCategory,
    [multiMonthTransactions]
  );

  const note: CategoryCorrelationNote | null = useMemo(() => {
    if (!selectedExpense) return null;
    return explainCategoryCorrelation(selectedExpense, matrix);
  }, [selectedExpense, matrix]);

  const totalEx = expenseSlices.reduce((s, x) => s + x.value, 0);
  const weightPct = selectedExpense && totalEx > 0 ? (expenseSlices.find((s) => s.name === selectedExpense)?.value ?? 0) / totalEx : null;

  if (!sankeyPayload) {
    return (
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-xl">Kategori korelasyonu & etki analizi</CardTitle>
          <CardDescription>Bu ay gelir veya gider dağılımı henüz Sankey akışı için yeterli değil.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { nodes, links } = sankeyPayload;

  const handleClick = (item: unknown, type: string) => {
    if (type !== 'node') return;
    const node = item as { name?: string; payload?: { name?: string } };
    const name = node.payload?.name ?? node.name;
    if (!name) return;
    if (sankeyPayload.expenseNames.has(name)) setSelectedExpense(name);
    else setSelectedExpense(null);
  };

  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="text-xl">Kategori korelasyonu ve etki analizi</CardTitle>
        <CardDescription>
          Sankey akışı: solda gelir kaynakları, ortada ana bütçe, sağda gider kategorileri — akış kalınlığı tutarla
          orantılı. Sağdaki bir kategoriye tıklayınca bütçe ağırlığı ve diğer kategorilerle korelasyon için teknik
          not üretilir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[400px] w-full min-w-0 sm:h-[440px]">
          <ResponsiveContainer width="100%" height="100%">
            <Sankey
              data={{ nodes, links }}
              nodePadding={18}
              nodeWidth={14}
              link={{ stroke: 'hsl(var(--muted-foreground))', strokeOpacity: 0.35 }}
              margin={{ left: 20, right: 20, top: 16, bottom: 16 }}
              onClick={handleClick}
            >
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.15 }}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                  fontSize: 12,
                }}
              />
            </Sankey>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/15 px-4 py-3 text-sm">
          {selectedExpense ? (
            <div className="space-y-2">
              <p className="font-medium text-foreground">{selectedExpense}</p>
              {weightPct != null ? (
                <p className="text-muted-foreground">
                  Bu ay toplam gider içinde yaklaşık pay:{' '}
                  <span className="font-semibold tabular-nums text-foreground">{(weightPct * 100).toFixed(1)}%</span>
                </p>
              ) : null}
              {note ? (
                <p className="border-l-2 border-primary/60 pl-3 font-mono text-xs leading-relaxed text-muted-foreground">
                  Teknik not: {note.technicalLine}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Korelasyon notu için en az birkaç ay ve iki farklı kategori serisi gerekir; veri arttıkça ilişki
                  katsayısı burada belirecek.
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Bir gider kategorisine (sağ sütun) tıklayarak ağırlık ve korelasyon özetini açın.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
