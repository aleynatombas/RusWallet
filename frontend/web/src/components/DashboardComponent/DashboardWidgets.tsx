import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardWidgetsProps {
  totalAssets: number;
  monthlyIncome: number;
  monthlyExpense: number;
  expenseNearBudgetLimit: boolean;
}

export function DashboardWidgets({
  totalAssets,
  monthlyIncome,
  monthlyExpense,
  expenseNearBudgetLimit,
}: DashboardWidgetsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs uppercase">Toplam varlık</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{totalAssets.toFixed(2)} TL</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-xs uppercase">Aylık gelir</CardDescription>
          <CardTitle className="text-2xl tabular-nums text-green-600 dark:text-green-500">
            {monthlyIncome.toFixed(2)} TL
          </CardTitle>
        </CardHeader>
      </Card>
      <Card
        className={cn(
          expenseNearBudgetLimit &&
            'border-destructive/40 bg-destructive/5 shadow-elevation dark:bg-destructive/10 dark:shadow-sm'
        )}
      >
        <CardHeader className="pb-2">
          <CardDescription className="text-xs uppercase">Aylık gider</CardDescription>
          <CardTitle
            className={cn(
              'text-2xl tabular-nums',
              expenseNearBudgetLimit
                ? 'text-destructive'
                : 'text-destructive/90 dark:text-red-400'
            )}
          >
            {monthlyExpense.toFixed(2)} TL
          </CardTitle>
          {expenseNearBudgetLimit ? (
            <p className="text-xs text-destructive/90">Bütçe sınırına yaklaşılıyor</p>
          ) : null}
        </CardHeader>
      </Card>
    </div>
  );
}
