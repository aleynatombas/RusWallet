import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, LineChart as LineChartIcon, Minus, Repeat } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ForecastInsightDto } from '@/types/smartInsights';
import { ForecastChart, ForecastLegend } from './ForecastChart';
import {
  AiNote,
  DataQualityChip,
  fmtPct,
  fmtTry,
  InsightCardShell,
  InsightError,
  InsightSkeleton,
  InsufficientData,
} from './InsightCardShell';

interface Props {
  data: ForecastInsightDto | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  className?: string;
}

export function ForecastInsightCard({ data, loading, error, onRetry, className }: Props) {
  const [open, setOpen] = useState(false);
  const ready = data?.status === 'ready' && data.predictedTotal != null;

  return (
    <>
      <InsightCardShell
        title="Gelecek ay tahmini"
        icon={<LineChartIcon className="h-4 w-4" aria-hidden />}
        badge={ready ? 'ML' : undefined}
        onOpenDetail={ready ? () => setOpen(true) : undefined}
        className={className}
      >
        {loading ? (
          <InsightSkeleton />
        ) : error ? (
          <InsightError message={error} onRetry={onRetry} />
        ) : !data || data.status === 'error' ? (
          <InsightError message={data?.message || 'Tahmin hesaplanamadı.'} onRetry={onRetry} />
        ) : !ready ? (
          <InsufficientData dq={data.dataQuality} hint="Tahmin için daha fazla işlem verisi gerekiyor." />
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
              <div className="min-w-0">
                <p className="text-[10px] font-medium capitalize text-muted-foreground">{data.targetMonthLabel}</p>
                <p className="text-2xl font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-[1.65rem]">
                  {fmtTry(data.predictedTotal)}
                </p>
                <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
                  %90 aralık: {fmtTry(data.lowerBound)} – {fmtTry(data.upperBound)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <ChangeBadge value={data.changeVsLastMonthPercent} />
                <DataQualityChip dq={data.dataQuality} />
              </div>
            </div>

            <div className="min-h-[56px] flex-1">
              <ForecastChart series={data.series} compact />
            </div>

            {data.aiCommentary ? <AiNote text={data.aiCommentary} source={data.aiCommentarySource} /> : null}
          </>
        )}
      </InsightCardShell>

      {ready && data ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gelecek ay tahmini · <span className="capitalize">{data.targetMonthLabel}</span></DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">{data.modelName}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 px-4 py-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric label="Tahmin" value={fmtTry(data.predictedTotal)} strong />
                <Metric label="Geçen ay" value={fmtTry(data.lastMonthTotal)} />
                <Metric label="Değişim" value={fmtPct(data.changeVsLastMonthPercent)} />
                <Metric label="Bu ay sonu (tahmini)" value={fmtTry(data.currentMonthProjectedTotal)} />
              </div>

              <div className="h-56 w-full">
                <ForecastChart series={data.series} />
              </div>
              <ForecastLegend />

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-border p-2.5">
                  <p className="text-[11px] font-semibold text-foreground">Tahmin bileşenleri</p>
                  <Row label="Değişken harcamalar (zaman serisi)" value={fmtTry(data.variableComponent)} />
                  <Row label="Düzenli ödemeler" value={fmtTry(data.recurringComponent)} />
                  <Row label="%90 tahmin aralığı" value={`${fmtTry(data.lowerBound)} – ${fmtTry(data.upperBound)}`} />
                </div>
                <div className="rounded-md border border-border p-2.5">
                  <p className="text-[11px] font-semibold text-foreground">Model doğrulama</p>
                  {data.backtest ? (
                    <>
                      <p className="mb-1 text-[10px] text-muted-foreground">
                        Son {data.backtest.holdoutDays} gün saklanıp tahmin edildi (gerçek: {fmtTry(data.backtest.actualTotal)}).
                      </p>
                      <Row
                        label="ML.NET SSA hatası"
                        value={data.backtest.ssaErrorPercent != null ? `%${data.backtest.ssaErrorPercent}` : '—'}
                        highlight={data.backtest.selectedModel === 'ssa'}
                      />
                      <Row
                        label="Temel model hatası"
                        value={`%${data.backtest.baselineErrorPercent}`}
                        highlight={data.backtest.selectedModel === 'seasonal_baseline'}
                      />
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Hatası düşük olan model seçildi: <b>{data.method === 'ssa' ? 'ML.NET SSA' : 'Haftanın günü ortalaması'}</b>.
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">Geriye dönük test için en az 56 günlük veri gerekiyor.</p>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground">{data.dataQuality.message}</p>
                </div>
              </div>

              {data.categoryDrivers.length > 0 ? (
                <div>
                  <p className="mb-1 text-[11px] font-semibold text-foreground">Kategori eğilimleri (son 3 ay)</p>
                  <ul className="divide-y divide-border/60 rounded-md border border-border">
                    {data.categoryDrivers.map((c) => (
                      <li key={c.categoryName} className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-[11px]">
                        <span className="min-w-0 truncate">{c.categoryName}</span>
                        <span className="flex shrink-0 items-center gap-2 tabular-nums">
                          <span className="text-muted-foreground">%{Math.round(c.sharePercent)} pay</span>
                          <span className="font-semibold">{fmtTry(c.last3MonthAverage)}/ay</span>
                          <ChangeBadge value={c.trendPercent} small />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {data.recurringPayments.length > 0 ? (
                <div>
                  <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-foreground">
                    <Repeat className="h-3 w-3" aria-hidden /> Tespit edilen düzenli ödemeler
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {data.recurringPayments.map((r) => (
                      <li key={`${r.name}-${r.categoryName}`} className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px]">
                        {r.name} · {fmtTry(r.expectedAmount)} · ayın {r.typicalDayOfMonth}. günü
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {data.aiCommentary ? <AiNote text={data.aiCommentary} source={data.aiCommentarySource} /> : null}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

export function ChangeBadge({ value, small = false }: { value: number | null | undefined; small?: boolean }) {
  const tone = value == null || Math.abs(value) < 1 ? 'neutral' : value > 0 ? 'up' : 'down';
  const Icon = tone === 'up' ? ArrowUpRight : tone === 'down' ? ArrowDownRight : Minus;
  return (
    <span
      title="Geçen aya göre"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border font-semibold tabular-nums',
        small ? 'px-1 py-0 text-[9px]' : 'px-1.5 py-0.5 text-[10px]',
        tone === 'up' && 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300',
        tone === 'down' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        tone === 'neutral' && 'border-border bg-muted text-muted-foreground'
      )}
    >
      <Icon className={small ? 'h-2.5 w-2.5' : 'h-3 w-3'} aria-hidden />
      {fmtPct(value)}
    </span>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-2.5 py-1.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn('tabular-nums text-foreground', strong ? 'text-base font-bold' : 'text-sm font-semibold')}>{value}</p>
    </div>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('tabular-nums', highlight ? 'font-bold text-primary' : 'font-semibold text-foreground')}>{value}</span>
    </div>
  );
}
