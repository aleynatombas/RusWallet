import type { BudgetSuggestionsResponseDto } from '@/types/budget';
import { formatExpenseCategoryLabel } from '@/lib/formatExpenseCategoryLabel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryBudgetTracksProps {
  budget: BudgetSuggestionsResponseDto | null;
  spentByCategory: Map<string, number>;
}

export function CategoryBudgetTracks({ budget, spentByCategory }: CategoryBudgetTracksProps) {
  const rows = (budget?.suggestions ?? []).slice(0, 8);

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kategori bütçe dolulukları</CardTitle>
          <CardDescription>Öneri için yeterli geçmiş harcama verisi yok.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kategori bütçe dolulukları</CardTitle>
        <CardDescription>
          Bu ay gerçekleşen harcama, modelin önerdiği aylık hedefe göre (öneri son {budget?.monthsAnalyzed ?? '—'} aya
          dayanır).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {rows.map((s) => {
          const spent = spentByCategory.get(s.categoryName) ?? spentByCategory.get(s.categoryName.trim()) ?? 0;
          const target = Math.max(s.suggestedAmount, 1);
          const pct = Math.min(150, (spent / target) * 100);
          const barColor =
            pct >= 100
              ? 'bg-primary/80'
              : pct >= 80
                ? 'bg-primary'
                : pct >= 55
                  ? 'bg-primary/65'
                  : 'bg-primary/35';

          return (
            <div key={`${s.categoryId}-${s.categoryName}`}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate font-medium text-foreground">
                  {formatExpenseCategoryLabel(s.categoryName)}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {spent.toFixed(0)} / {target.toFixed(0)} TL
                  <span className="ml-1 text-xs">({pct.toFixed(0)}%)</span>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              {pct >= 100 ? (
                <p className="mt-1 text-xs text-muted-foreground">Önerilen bütçeyi aştınız.</p>
              ) : pct >= 80 ? (
                <p className="mt-1 text-xs text-muted-foreground">Limite yaklaşıyorsunuz.</p>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
