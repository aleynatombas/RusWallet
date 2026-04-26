import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardPanelClass } from '@/lib/dashboardStyles';
import { cn } from '@/lib/utils';

function formatTry(n: number): string {
  return n.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

interface DashboardMetricCardsProps {
  monthlyIncome: number;
  monthlyExpense: number;
  lifetimeBalance: number;
  incomeTitle: string;
  incomeSubtitle: string;
  expenseTitle: string;
  expenseSubtitle: string;
}

export function DashboardMetricCards({
  monthlyIncome,
  monthlyExpense,
  lifetimeBalance,
  incomeTitle,
  incomeSubtitle,
  expenseTitle,
  expenseSubtitle,
}: DashboardMetricCardsProps) {
  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card className={cn(dashboardPanelClass)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{incomeTitle}</CardTitle>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">₺{formatTry(monthlyIncome)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{incomeSubtitle}</p>
        </CardContent>
      </Card>

      <Card className={cn(dashboardPanelClass)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{expenseTitle}</CardTitle>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary/80 dark:text-primary/85">
            <ArrowDownRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">₺{formatTry(monthlyExpense)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{expenseSubtitle}</p>
        </CardContent>
      </Card>

      <Card className={cn(dashboardPanelClass)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Toplam bakiye</CardTitle>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Wallet className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">₺{formatTry(lifetimeBalance)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Tüm zamanlar (gelir − gider)</p>
        </CardContent>
      </Card>
    </div>
  );
}
