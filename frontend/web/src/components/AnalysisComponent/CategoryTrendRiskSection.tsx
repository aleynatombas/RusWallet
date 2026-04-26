import type { CategorySlice } from '@/lib/groupExpenseByCategory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function mergeCategoryRows(
  prevSlices: CategorySlice[],
  currSlices: CategorySlice[],
  dayOfMonth: number,
  daysInMonth: number
) {
  const names = new Set<string>();
  for (const s of prevSlices) names.add(s.name);
  for (const s of currSlices) names.add(s.name);
  const prevMap = new Map(prevSlices.map((s) => [s.name, s.value]));
  const currMap = new Map(currSlices.map((s) => [s.name, s.value]));
  const factor = dayOfMonth > 0 ? daysInMonth / dayOfMonth : 1;

  const rows = Array.from(names).map((name) => {
    const last = prevMap.get(name) ?? 0;
    const mtd = currMap.get(name) ?? 0;
    const projected = mtd * factor;
    return {
      name: name.length > 22 ? `${name.slice(0, 20)}…` : name,
      fullName: name,
      lastMonth: Math.round(last * 100) / 100,
      thisMonthMtd: Math.round(mtd * 100) / 100,
      projectedMonth: Math.round(projected * 100) / 100,
      risk: projected > last * 1.02 && last > 0,
    };
  });
  return rows
    .filter((r) => r.lastMonth > 0 || r.thisMonthMtd > 0)
    .sort((a, b) => Math.max(b.lastMonth, b.thisMonthMtd) - Math.max(a.lastMonth, a.thisMonthMtd))
    .slice(0, 10);
}

interface CategoryTrendRiskSectionProps {
  prevSlices: CategorySlice[];
  currSlices: CategorySlice[];
  className?: string;
}

function fmtTry(n: number): string {
  return `${n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₺`;
}

export function CategoryTrendRiskSection({ prevSlices, currSlices, className }: CategoryTrendRiskSectionProps) {
  const now = new Date();
  const day = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const data = mergeCategoryRows(prevSlices, currSlices, day, daysInMonth);

  const globalMax = Math.max(
    1,
    ...data.flatMap((r) => [r.lastMonth, r.thisMonthMtd, r.projectedMonth])
  );

  return (
    <Card className={cn('flex h-full min-h-0 flex-col overflow-hidden border-border/60', className)}>
      <CardHeader className="space-y-0.5 p-3 pb-2 sm:p-4">
        <CardTitle className="text-sm font-semibold">Kategori kıyaslama</CardTitle>
        <CardDescription className="text-[10px] leading-snug sm:text-[11px]">
          Geçen ay ile bu ay bugüne; tahmin geçen ayı aşıyorsa &quot;Bu ay&quot; çubuğu kırmızı.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto p-3 pt-0 sm:p-4 sm:pt-0">
        {data.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">Kategori verisi yetersiz.</p>
        ) : (
          <>
            <div className="mb-1.5 hidden sm:grid sm:grid-cols-[minmax(0,6.5rem)_1fr] sm:gap-x-2">
              <div aria-hidden />
              <div className="grid grid-cols-2 gap-2">
                <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                  Geçen ay
                </span>
                <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                  Bu ay (bugüne)
                </span>
              </div>
            </div>
            <ul className="space-y-2">
              {data.map((row) => {
                const wLast = (row.lastMonth / globalMax) * 100;
                const wThis = (row.thisMonthMtd / globalMax) * 100;
                return (
                  <li
                    key={row.fullName}
                    className="grid grid-cols-1 items-center gap-x-2 gap-y-1.5 sm:grid-cols-[minmax(0,6.5rem)_1fr]"
                  >
                    <p className="text-[11px] font-medium leading-tight text-foreground sm:pr-1" title={row.fullName}>
                      {row.name}
                    </p>
                    <div className="grid min-w-0 grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-slate-400/90 dark:bg-slate-500/90"
                            style={{ width: `${wLast}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-[9px] tabular-nums text-muted-foreground">{fmtTry(row.lastMonth)}</p>
                      </div>
                      <div className="min-w-0">
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full transition-colors',
                              row.risk
                                ? 'bg-red-500/90 dark:bg-red-500/85'
                                : 'bg-sky-500/85 dark:bg-sky-400/80'
                            )}
                            style={{ width: `${wThis}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-[9px] tabular-nums text-muted-foreground">
                          {fmtTry(row.thisMonthMtd)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
