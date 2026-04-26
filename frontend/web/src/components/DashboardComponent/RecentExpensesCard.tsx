import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TransactionRow } from '@/types/dashboard';
import { categoryColorForName } from '@/lib/categoryColor';
import { formatExpenseCategoryLabel } from '@/lib/formatExpenseCategoryLabel';

interface RecentExpensesCardProps {
  items: TransactionRow[];
}

export function RecentExpensesCard({ items }: RecentExpensesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Son harcamalar</CardTitle>
        <CardDescription>Bu ayki en son 5 gider işlemi ve kategori etiketleri (anasayfa verisi işlem eklenince güncellenir).</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            Bu ay için henüz gider kaydı yok. Gelir işlemleri (maaş vb.) burada gösterilmez; yalnızca giderler listelenir.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((t) => (
              <li
                key={t.transactionId}
                className="flex flex-wrap items-start justify-between gap-3 px-6 py-4 text-sm"
              >
                <div className="min-w-0 space-y-2">
                  <p className="font-medium leading-snug text-foreground">{t.description}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
                      <span className="shrink-0 font-medium text-foreground/85">Kategori</span>
                      <span
                        className="inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: categoryColorForName(t.categoryName || 'Diğer') }}
                        title={formatExpenseCategoryLabel(t.categoryName)}
                      >
                        {formatExpenseCategoryLabel(t.categoryName)}
                      </span>
                    </span>
                    <span className="text-border" aria-hidden>
                      ·
                    </span>
                    <time dateTime={t.transactionDate}>
                      {new Date(t.transactionDate).toLocaleString('tr-TR')}
                    </time>
                  </div>
                </div>
                <span className="shrink-0 font-semibold tabular-nums text-destructive">
                  -{t.amount.toFixed(2)} TL
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
