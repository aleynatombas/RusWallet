import { Line, LineChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { ANALYSIS_CARD_TITLE_CLASS, formatPageTitleDisplay } from '@/lib/pageTitle';
import { cn } from '@/lib/utils';
import type { MonthSpendSparklineDto } from '@/types/financialRoadmap';
import { analysisSectionSubtitleClass } from './analysisSectionTitle';
import { MonthOverMonthDeltaBadge } from './MonthOverMonthSparkline';

const chartConfig = {
  expense: {
    label: 'Gider',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

interface MonthSpendSparklineCardProps {
  sparkline: MonthSpendSparklineDto | null | undefined;
  className?: string;
}

export function MonthSpendSparklineCard({ sparkline, className }: MonthSpendSparklineCardProps) {
  const points = sparkline?.points ?? [];
  const data = points.map((p) => ({
    name: p.shortLabel,
    expense: Number(p.totalExpense),
  }));

  const hasData = data.length > 0;

  let lo = 0;
  let hi = 1;
  if (hasData) {
    const maxV = Math.max(...data.map((d) => d.expense), 1);
    const minV = Math.min(...data.map((d) => d.expense));
    const span = Math.max(maxV - minV, maxV * 0.06, 80);
    lo = minV - span * 0.12;
    hi = maxV + span * 0.12;
  }

  return (
    <Card
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/20 shadow-elevation dark:bg-zinc-900/40 dark:shadow-md dark:shadow-black/30',
        className
      )}
    >
      <CardHeader className="shrink-0 space-y-1 px-3 pb-0 pt-2 sm:px-3.5 sm:pt-2.5">
        <CardTitle className={ANALYSIS_CARD_TITLE_CLASS}>
          {formatPageTitleDisplay('Son 6 ay — gider eğrisi')}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className={analysisSectionSubtitleClass}>
            {formatPageTitleDisplay('Aynı güne kadar toplam')}
          </p>
          {sparkline ? (
            <MonthOverMonthDeltaBadge
              percentChangeVsPreviousMonth={sparkline.percentChangeVsPreviousMonth}
              hasComparableData={sparkline.hasComparableData}
            />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-3 sm:px-3.5">
        {!hasData ? (
          <p className="flex min-h-0 flex-1 items-center justify-center text-center text-[11px] text-muted-foreground">
            {formatPageTitleDisplay('Bu grafik için yeterli işlem yok.')}
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-full min-h-[100px] w-full min-w-0 flex-1"
          >
            <LineChart
              data={data}
              margin={{ left: 0, right: 4, top: 6, bottom: 0 }}
              accessibilityLayer
            >
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={[lo, hi]} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="var(--color-expense)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
