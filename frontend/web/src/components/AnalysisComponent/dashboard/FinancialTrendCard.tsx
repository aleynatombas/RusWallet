import { useState } from 'react';
import { ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { FinancialTrendInsightDto, ForecastInsightDto, TrendMonthDto } from '@/types/smartInsights';
import {
  AiNote,
  DataCollectionState,
  fmtTry,
  InsightCardShell,
  InsightError,
  InsightSkeleton,
} from '../insights/InsightCardShell';
import { ChangeBadge } from '../insights/ForecastInsightCard';

const EXPENSE = 'hsl(var(--primary))';
const INCOME = 'hsl(160 55% 40%)';

interface Row {
  key: string;
  label: string;
  kind: 'month' | 'partial' | 'forecast';
  hasData: boolean;
  /** Tamamlanmış aylar — düz çizgi. Kaydı olmayan ay null: çizgi orada kesilir, sıfıra düşmez. */
  expense: number | null;
  income: number | null;
  /** İçinde bulunulan ay (bugüne kadar) — çizgiye bağlanmaz, ayrı nokta. */
  mtdExpense: number | null;
  mtdIncome: number | null;
  /** Kesikli tahmin çizgisi: son tamamlanmış ay → bu ay sonu → gelecek ay. */
  forecast: number | null;
  month?: TrendMonthDto;
  range?: [number | null, number | null];
}

function buildRows(trend: FinancialTrendInsightDto, forecast: ForecastInsightDto | null): Row[] {
  const rows: Row[] = trend.months.map((m) => ({
    key: `${m.year}-${m.month}`,
    label: m.isPartial ? `${m.label}*` : m.label,
    kind: m.isPartial ? 'partial' : 'month',
    hasData: m.hasData,
    expense: !m.isPartial && m.hasData ? m.expense : null,
    income: !m.isPartial && m.hasData ? m.income : null,
    mtdExpense: m.isPartial && m.hasData ? m.expense : null,
    mtdIncome: m.isPartial && m.hasData && (m.income ?? 0) > 0 ? m.income : null,
    forecast: null,
    month: m,
  }));

  if (trend.forecast) {
    const lastComplete = [...rows].reverse().find((r) => r.kind === 'month' && r.expense != null);
    const partial = rows.find((r) => r.kind === 'partial');
    if (lastComplete) lastComplete.forecast = lastComplete.expense;
    if (partial && forecast?.currentMonthProjectedTotal != null) partial.forecast = forecast.currentMonthProjectedTotal;
    rows.push({
      key: 'forecast',
      label: trend.forecast.label,
      kind: 'forecast',
      hasData: false,
      expense: null,
      income: null,
      mtdExpense: null,
      mtdIncome: null,
      forecast: trend.forecast.expense,
      range: [trend.forecast.lower, trend.forecast.upper],
    });
  }
  return rows;
}

interface Props {
  data: FinancialTrendInsightDto | null;
  /** Sol sütundaki tahmin modülü — bu ay sonu projeksiyonu için (aynı yanıt, ayrı hesap yok). */
  forecast: ForecastInsightDto | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  /** Odak ekranı: büyük grafik ve aylık tablo sayfada gösterilir. */
  expanded?: boolean;
  title?: string;
  className?: string;
}

/** "Son 6 ay – finansal trend": gelir/gider çizgileri, kesikli tahmin, kaydı olmayan aylar boş. */
export function FinancialTrendCard({ data, forecast, loading, error, onRetry, expanded = false, title = 'Finansal trend', className }: Props) {
  const [open, setOpen] = useState(false);
  const ready = data?.status === 'ready';
  const rows = ready && data ? buildRows(data, forecast) : [];
  const hasIncome = ready && data ? data.months.some((m) => (m.income ?? 0) > 0) : false;
  const partial = data?.months.find((m) => m.isPartial);

  return (
    <>
      <InsightCardShell
        title={title}
        icon={<TrendingUp className="h-4 w-4" aria-hidden />}
        onOpenDetail={ready ? () => setOpen(true) : undefined}
        expanded={expanded}
        className={className}
      >
        {loading ? (
          <InsightSkeleton />
        ) : error ? (
          <InsightError message={error} onRetry={onRetry} />
        ) : !data || data.status === 'error' ? (
          <InsightError message={data?.message || 'Finansal trend hesaplanamadı.'} onRetry={onRetry} />
        ) : !ready ? (
          <DataCollectionState
            purpose="Aylık gelir ve giderini yan yana gösterir; hangi ayda fazla harcadığını ve gidişatın yönünü görürsün."
            requirements={[{ label: 'Kaydı olan tamamlanmış ay', current: data.dataQuality.completeMonths, required: 2, unit: 'ay' }]}
            why="Bir eğilimden söz edebilmek için en az iki tamamlanmış ayın kaydı gerekiyor; içinde bulunduğumuz ay henüz bitmediği için sayılmaz."
            tip="Gelirlerini de (maaş, ek gelir) kaydet; böylece gelir–gider dengeni birlikte görebilirsin."
          />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              <Stat label="Aylık ort. gider" value={fmtTry(data.averageMonthlyExpense)} />
              <Stat
                label="En yüksek ay"
                value={data.highestExpenseMonthLabel?.split(' ')[0] ?? '—'}
                sub={data.highestExpenseMonthAmount != null ? fmtTry(data.highestExpenseMonthAmount) : undefined}
              />
              <Stat
                label="Son ay değişim"
                value={<ChangeBadge value={data.lastCompleteMonthChangePercent} />}
                sub={data.lastCompleteMonthChangePercent == null ? 'kıyas yok' : undefined}
              />
            </div>

            {expanded ? (
              <TrendDetail data={data} rows={rows} hasIncome={hasIncome} partialLabel={partial?.label} expanded />
            ) : (
              <>
            <div className="min-h-[64px] flex-1">
              <TrendChart rows={rows} compact />
            </div>
            <TrendLegend hasIncome={hasIncome} hasForecast={data.forecast != null} partialLabel={partial?.label} hasGap={data.monthsWithoutData > 0} />

            {data.commentary ? <AiNote text={data.commentary} source={data.commentarySource} /> : null}
              </>
            )}
          </>
        )}
      </InsightCardShell>

      {ready && data && !expanded ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Son 6 ay – {title.toLocaleLowerCase('tr')}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">{data.dataQuality.message}</DialogDescription>
            </DialogHeader>
            <div className="px-4 py-4">
              <TrendDetail data={data} rows={rows} hasIncome={hasIncome} partialLabel={partial?.label} />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="min-w-0 rounded-md bg-muted/40 px-2 py-1" title={sub ? `${label}: ${sub}` : label}>
      <p className="truncate text-[9px] text-muted-foreground">{label}</p>
      <div className="flex min-w-0 items-baseline gap-1 text-xs font-semibold tabular-nums text-foreground">
        <span className="truncate">{value}</span>
        {sub ? <span className="hidden truncate text-[9px] font-normal text-muted-foreground xl:inline">{sub}</span> : null}
      </div>
    </div>
  );
}

function TrendChart({ rows, compact = false }: { rows: Row[]; compact?: boolean }) {
  const values = rows
    .flatMap((r) => [r.expense, r.income, r.mtdExpense, r.mtdIncome, r.forecast])
    .filter((v): v is number => v != null);
  const max = values.length ? Math.max(...values) : 1;
  const min = values.length ? Math.min(...values) : 0;
  const pad = Math.max((max - min) * 0.18, max * 0.04, 1);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={rows} margin={{ left: compact ? 12 : 6, right: compact ? 12 : 16, top: 6, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          interval={0}
          tick={(props: { x?: number | string; y?: number | string; payload?: { value?: unknown; index?: number } }) => {
            const r = rows[props.payload?.index ?? -1];
            const muted = r && r.kind !== 'forecast' && !r.hasData;
            return (
              <text
                x={Number(props.x)}
                y={Number(props.y) + 8}
                textAnchor="middle"
                fontSize={compact ? 9 : 11}
                fill={r?.kind === 'forecast' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                opacity={muted ? 0.5 : 1}
              >
                {String(props.payload?.value ?? '')}
                {muted ? ' ·' : ''}
              </text>
            );
          }}
        />
        <YAxis
          hide={compact}
          domain={[Math.max(0, min - pad), max + pad]}
          tickFormatter={(v: number) => `${Math.round(v / 1000)}B`}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'hsl(var(--border))' }} />
        <Line
          dataKey="income"
          stroke={INCOME}
          strokeWidth={2}
          dot={{ r: compact ? 2 : 3, fill: INCOME }}
          connectNulls={false}
          isAnimationActive={false}
        />
        <Line
          dataKey="expense"
          stroke={EXPENSE}
          strokeWidth={2.25}
          dot={{ r: compact ? 2 : 3, fill: EXPENSE }}
          connectNulls={false}
          isAnimationActive={false}
        />
        <Line
          dataKey="forecast"
          stroke={EXPENSE}
          strokeWidth={1.75}
          strokeDasharray="5 4"
          dot={{ r: compact ? 2 : 3, fill: 'hsl(var(--background))', stroke: EXPENSE, strokeWidth: 1.5 }}
          connectNulls
          isAnimationActive={false}
        />
        <Scatter dataKey="mtdExpense" fill="hsl(var(--background))" stroke={EXPENSE} strokeWidth={1.5} isAnimationActive={false} />
        <Scatter dataKey="mtdIncome" fill="hsl(var(--background))" stroke={INCOME} strokeWidth={1.5} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  const m = r.month;
  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-[11px] text-popover-foreground shadow-elevation-lg">
      <p className="mb-0.5 font-semibold">
        {r.kind === 'forecast' ? `${r.label} · tahmin` : `${m?.label} ${m?.year}`}
        {r.kind === 'partial' ? ' · bugüne kadar' : ''}
      </p>
      {r.kind === 'forecast' ? (
        <>
          <p className="text-primary">Tahmini gider: {fmtTry(r.forecast)}</p>
          {r.range ? (
            <p className="text-muted-foreground">
              Aralık: {fmtTry(r.range[0])} – {fmtTry(r.range[1])}
            </p>
          ) : null}
        </>
      ) : !r.hasData ? (
        <p className="text-muted-foreground">Bu ay için kayıt yok</p>
      ) : (
        <>
          <p>Gelir: {fmtTry(m?.income)}</p>
          <p>Gider: {fmtTry(m?.expense)}</p>
          {m?.expenseChangePercent != null ? (
            <p className="text-muted-foreground">
              Gider değişimi: {m.expenseChangePercent > 0 ? '+' : ''}
              {Math.round(m.expenseChangePercent)}%{r.kind === 'partial' ? ' (geçen ayın aynı dönemine göre)' : ''}
            </p>
          ) : null}
          {r.kind === 'partial' && r.forecast != null ? <p className="text-primary">Ay sonu tahmini: {fmtTry(r.forecast)}</p> : null}
        </>
      )}
    </div>
  );
}

function TrendLegend({
  hasIncome,
  hasForecast,
  partialLabel,
  hasGap,
}: {
  hasIncome: boolean;
  hasForecast: boolean;
  partialLabel?: string;
  hasGap: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[9px] text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <span className="h-0.5 w-3 rounded" style={{ background: EXPENSE }} /> Gider
      </span>
      {hasIncome ? (
        <span className="inline-flex items-center gap-1">
          <span className="h-0.5 w-3 rounded" style={{ background: INCOME }} /> Gelir
        </span>
      ) : (
        <span>Gelir kaydı yok</span>
      )}
      {hasForecast ? (
        <span className="inline-flex items-center gap-1">
          <span className="h-0 w-3 border-t-2 border-dashed border-primary" /> Tahmin
        </span>
      ) : null}
      {partialLabel ? <span>* {partialLabel}: bugüne kadar</span> : null}
      {hasGap ? <span>· Kayıt olmayan ay boş bırakıldı</span> : null}
    </div>
  );
}

function TrendDetail({
  data,
  rows,
  hasIncome,
  partialLabel,
  expanded = false,
}: {
  data: FinancialTrendInsightDto;
  rows: Row[];
  hasIncome: boolean;
  partialLabel?: string;
  expanded?: boolean;
}) {
  return (
    <div className="space-y-3">
              <div className={expanded ? "h-72 w-full" : "h-56 w-full"}>
                <TrendChart rows={rows} />
              </div>
              <TrendLegend hasIncome={hasIncome} hasForecast={data.forecast != null} partialLabel={partialLabel} hasGap={data.monthsWithoutData > 0} />
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[26rem] text-[11px]">
                  <thead className="bg-muted/40 text-[10px] text-muted-foreground">
                    <tr>
                      <th className="px-2.5 py-1.5 text-left font-medium">Ay</th>
                      <th className="px-2.5 py-1.5 text-right font-medium">Gelir</th>
                      <th className="px-2.5 py-1.5 text-right font-medium">Gider</th>
                      <th className="px-2.5 py-1.5 text-right font-medium">Net</th>
                      <th className="px-2.5 py-1.5 text-right font-medium">Gider değişimi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {data.months.map((m) => (
                      <tr key={`${m.year}-${m.month}`} className={cn(!m.hasData && 'text-muted-foreground')}>
                        <td className="px-2.5 py-1.5">
                          {m.label} {m.year}
                          {m.isPartial ? <span className="ml-1 text-[9px] text-muted-foreground">(bugüne kadar)</span> : null}
                        </td>
                        {m.hasData ? (
                          <>
                            <td className="px-2.5 py-1.5 text-right tabular-nums">{fmtTry(m.income)}</td>
                            <td className="px-2.5 py-1.5 text-right font-semibold tabular-nums">{fmtTry(m.expense)}</td>
                            <td
                              className={cn(
                                'px-2.5 py-1.5 text-right tabular-nums',
                                (m.net ?? 0) < 0 ? 'text-rose-600 dark:text-rose-300' : 'text-foreground'
                              )}
                            >
                              {fmtTry(m.net)}
                            </td>
                            <td className="px-2.5 py-1.5 text-right">
                              {m.expenseChangePercent != null ? <ChangeBadge value={m.expenseChangePercent} small /> : '—'}
                            </td>
                          </>
                        ) : (
                          <td colSpan={4} className="px-2.5 py-1.5 text-center text-[10px] italic">
                            Bu ay için kayıt yok
                          </td>
                        )}
                      </tr>
                    ))}
                    {data.forecast ? (
                      <tr className="bg-primary/5">
                        <td className="px-2.5 py-1.5 text-primary">{data.forecast.label} (tahmin)</td>
                        <td className="px-2.5 py-1.5 text-right text-muted-foreground">—</td>
                        <td className="px-2.5 py-1.5 text-right font-semibold tabular-nums text-primary">{fmtTry(data.forecast.expense)}</td>
                        <td colSpan={2} className="px-2.5 py-1.5 text-right text-[10px] text-muted-foreground">
                          {fmtTry(data.forecast.lower)} – {fmtTry(data.forecast.upper)}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] leading-snug text-muted-foreground">
                İçinde bulunduğumuz ay henüz bitmediği için çizgiye bağlanmaz; değişimi geçen ayın aynı dönemine göre hesaplanır.
                Gelecek ay tahmini, “Gelecek ay tahmini” kartındaki değerle aynıdır.
              </p>
              {data.commentary ? <AiNote text={data.commentary} source={data.commentarySource} clamp={!expanded} /> : null}
    </div>
  );
}
