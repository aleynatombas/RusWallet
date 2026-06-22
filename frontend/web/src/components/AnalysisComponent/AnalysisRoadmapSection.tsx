import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { AnalysisQaModuleDto, LifestyleProfileDto } from '@/types/financialRoadmap';
import { ANALYSIS_CARD_TITLE_CLASS, formatPageTitleDisplay } from '@/lib/pageTitle';
import { cn } from '@/lib/utils';

const lifestyleChartConfig = {
  zorunlu: {
    label: 'Zorunlu',
    theme: {
      light: 'hsl(var(--primary))',
      dark: 'hsl(var(--primary))',
    },
  },
  esnek: {
    label: 'Esnek',
    theme: {
      light: 'hsl(var(--primary) / 0.35)',
      dark: 'hsl(var(--primary) / 0.5)',
    },
  },
} satisfies ChartConfig;

/** Zorunlu / esnek payı — yatay iki çubuk */
function LifestyleShareChart({ lifestyle }: { lifestyle: LifestyleProfileDto }) {
  const m = Math.min(100, Math.max(0, lifestyle.mandatorySharePercent));
  const d = Math.min(100, Math.max(0, lifestyle.discretionarySharePercent));

  const chartData = [
    { type: formatPageTitleDisplay('Zorunlu'), value: m, fill: 'var(--color-zorunlu)' },
    { type: formatPageTitleDisplay('Esnek'), value: d, fill: 'var(--color-esnek)' },
  ];

  const ariaLabel = `${formatPageTitleDisplay('Zorunlu')} ${m.toFixed(0)} yüzde, ${formatPageTitleDisplay('Esnek')} ${d.toFixed(0)} yüzde`;

  return (
    <div className="min-w-0 overflow-hidden" role="img" aria-label={ariaLabel}>
      <div className="mb-1.5 flex flex-wrap items-end justify-end gap-x-2 gap-y-1">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] tabular-nums text-muted-foreground sm:text-[10px]">
          <span className="inline-flex items-center gap-1">
            <span
              className="h-2 w-2 shrink-0 rounded-sm bg-primary"
              aria-hidden
            />
            {formatPageTitleDisplay('Zorunlu')} {m.toFixed(0)}%
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="h-2 w-2 shrink-0 rounded-sm bg-primary/35 dark:bg-primary/50"
              aria-hidden
            />
            {formatPageTitleDisplay('Esnek')} {d.toFixed(0)}%
          </span>
        </div>
      </div>
      <ChartContainer config={lifestyleChartConfig} className="aspect-auto h-[7.25rem] w-full min-w-0 max-w-full">
        <BarChart
          layout="vertical"
          accessibilityLayer
          data={chartData}
          barGap={10}
          margin={{ left: 2, right: 2, top: 2, bottom: 2 }}
        >
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis
            type="category"
            dataKey="type"
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value) => [`${Number(value).toFixed(0)}%`, undefined]}
              />
            }
          />
          <Bar dataKey="value" radius={4} maxBarSize={18} isAnimationActive={false}>
            {chartData.map((entry) => (
              <Cell key={entry.type} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function openChat(message: string) {
  window.dispatchEvent(
    new CustomEvent('ruswallet-chat-open', { detail: { message, autoSubmit: false } })
  );
}

const panelCardClass =
  'flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/20 shadow-elevation dark:bg-zinc-900/40 dark:shadow-md dark:shadow-black/30';

/** 3. kutu: Yaşam tarzı profili */
export function YasamTarziCard({
  lifestyle,
  className,
}: {
  lifestyle: LifestyleProfileDto | null | undefined;
  className?: string;
}) {
  return (
    <Card className={cn(panelCardClass, className)}>
      <CardHeader className="shrink-0 px-2.5 pb-0 pt-1.5 sm:px-3 sm:pt-2">
        <CardTitle className="text-base font-semibold leading-tight tracking-tight text-foreground sm:text-[1.05rem]">
          {formatPageTitleDisplay('Yaşam tarzı profili')}
        </CardTitle>
        <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
          {formatPageTitleDisplay('Bu ay zorunlu / esnek dağılımı')}
        </p>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-2.5 pb-2 pt-2 sm:px-3">
        {lifestyle ? (
          <>
            <div className="w-full min-w-0">
              <LifestyleShareChart lifestyle={lifestyle} />
            </div>
            <p className="min-w-0 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
              {lifestyle.summary}
            </p>
          </>
        ) : (
          <p className="flex flex-1 items-center justify-center text-center text-[11px] text-muted-foreground">
            {formatPageTitleDisplay('Bu ay için yeterli harcama verisi yok.')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** Tam genişlik: Kısa soru (4 kutunun altı) */
export function KisaSoruCard({ qa, className }: { qa: AnalysisQaModuleDto; className?: string }) {
  return (
    <Card className={cn(panelCardClass, 'shrink-0', className)}>
      <CardHeader className="px-3 pb-0 pt-2.5 sm:px-3.5">
        <div className="min-w-0">
          <CardTitle className={ANALYSIS_CARD_TITLE_CLASS}>{formatPageTitleDisplay('Kısa soru')}</CardTitle>
          <p className="mt-2 text-[11px] leading-relaxed text-foreground sm:text-xs">{qa.question}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-3 pb-3 pt-2 sm:flex-row sm:px-3.5">
        <Button
          type="button"
          variant="default"
          className="h-auto min-h-9 flex-1 whitespace-normal py-2 text-left text-[11px] leading-snug sm:text-xs"
          onClick={() => openChat(qa.chatMessageA)}
        >
          {qa.optionA}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-9 flex-1 whitespace-normal py-2 text-left text-[11px] leading-snug sm:text-xs"
          onClick={() => openChat(qa.chatMessageB)}
        >
          {qa.optionB}
        </Button>
      </CardContent>
    </Card>
  );
}
