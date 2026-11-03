import { useState } from 'react';
import { ChevronRight, PiggyBank, Repeat, Target, ThumbsUp } from 'lucide-react';
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { SavingsInsightDto, SavingsOpportunityDto } from '@/types/smartInsights';
import {
  AiNote,
  fmtTry,
  InsightCardShell,
  InsightError,
  InsightSkeleton,
  DataCollectionState,
} from './InsightCardShell';

interface Props {
  data: SavingsInsightDto | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  /** Odak ekranı: bütün fırsatlar listelenir, seçilen fırsatın detayı sayfada gösterilir. */
  expanded?: boolean;
  className?: string;
}

const confidenceLabel = { high: 'Yüksek güven', medium: 'Orta güven', low: 'Düşük güven' } as const;

export function SavingsInsightCard({ data, loading, error, onRetry, expanded = false, className }: Props) {
  const [selected, setSelected] = useState<SavingsOpportunityDto | null>(null);
  const opps = data?.opportunities ?? [];
  const top3 = expanded ? opps : opps.slice(0, 3);
  const maxSaving = Math.max(1, ...top3.map((o) => o.monthlySaving));
  /** Odak ekranında her zaman bir fırsat seçili olur (varsayılan: en yüksek etkili). */
  const current = expanded ? (opps.find((o) => o.id === selected?.id) ?? opps[0] ?? null) : selected;

  return (
    <>
      <InsightCardShell
        title="Tasarruf fırsatları"
        icon={<PiggyBank className="h-4 w-4" aria-hidden />}
        badge={data?.status === 'ready' && opps.length > 0 ? 'AI' : undefined}
        onOpenDetail={opps.length > 0 ? () => setSelected(opps[0]) : undefined}
        expanded={expanded}
        className={className}
      >
        {loading ? (
          <InsightSkeleton />
        ) : error ? (
          <InsightError message={error} onRetry={onRetry} />
        ) : !data || data.status === 'error' ? (
          <InsightError message={data?.message || 'Tasarruf analizi yapılamadı.'} onRetry={onRetry} />
        ) : data.status === 'insufficient_data' ? (
          <DataCollectionState
            purpose="Harcamalarını kendi en iyi aylarınla karşılaştırıp aylık ne kadar tasarruf edebileceğini hesaplar."
            requirements={[
              { label: "Tamamlanmış ay", current: data.dataQuality.completeMonths, required: 3, unit: "ay" },
              { label: "Gider kaydı", current: data.dataQuality.expenseTransactionCount, required: data.dataQuality.requiredTransactions, unit: "kayıt" },
            ]}
            why="Gerçekçi bir hedef için en az üç ayını karşılaştırıp daha az harcadığın ayları bulmamız gerekiyor."
            tip="Her ay giderlerini doğru kategorilerle kaydetmeye devam et; abonelik ve faturaları da eklemeyi unutma."
          />
        ) : opps.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <ThumbsUp className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm font-semibold text-foreground">Harcamaların dengede</p>
            <p className="max-w-[17rem] text-[11px] leading-snug text-muted-foreground">{data.message}</p>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Tahmini aylık potansiyel</p>
                <p className="text-2xl font-bold tabular-nums leading-none tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-[1.65rem]">
                  {fmtTry(data.totalMonthlyPotential)}
                </p>
              </div>
              <p className="text-right text-[10px] tabular-nums text-muted-foreground">
                Yıllık
                <br />
                <b className="text-foreground">{fmtTry(data.totalYearlyPotential)}</b>
              </p>
            </div>

            <ul className={cn('flex min-h-0 flex-col gap-1', expanded ? '' : 'flex-1 overflow-hidden')}>
              {top3.map((o, i) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(o)}
                    aria-pressed={expanded ? current?.id === o.id : undefined}
                    className={cn(
                      'group flex w-full items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 dark:bg-zinc-900/50',
                      expanded && 'py-1.5',
                      expanded && current?.id === o.id && 'border-primary/60 bg-primary/5 ring-1 ring-primary/30'
                    )}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold text-foreground">{o.title || o.categoryName}</span>
                      <span className="mt-0.5 block h-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-emerald-500/70"
                          style={{ width: `${(o.monthlySaving / maxSaving) * 100}%` }}
                        />
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {fmtTry(o.monthlySaving)}
                    </span>
                    <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            {expanded && current ? (
              <section className="rounded-lg border border-border bg-background/50 p-3 dark:bg-background/20" aria-label="Seçilen fırsatın detayı">
                <OpportunityDetail selected={current} opps={opps} onSelect={setSelected} inline />
              </section>
            ) : null}
          </>
        )}
      </InsightCardShell>

      {!expanded ? (
        <Dialog open={selected != null} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
            {selected ? (
              <>
                <DialogHeader>
                  <DialogTitle>{selected.title || selected.categoryName}</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {selected.categoryName} · {confidenceLabel[selected.confidence]}
                    {selected.usedMlForecast ? ' · harcama eğilimin de hesaba katıldı' : ''}
                  </DialogDescription>
                </DialogHeader>
                <div className="px-4 py-4">
                  <OpportunityDetail selected={selected} opps={opps} onSelect={setSelected} />
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

function OpportunityDetail({
  selected,
  opps,
  onSelect,
  inline = false,
}: {
  selected: SavingsOpportunityDto;
  opps: SavingsOpportunityDto[];
  onSelect: (o: SavingsOpportunityDto) => void;
  inline?: boolean;
}) {
  return (
              <div className="space-y-3">
                {inline ? (
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selected.title || selected.categoryName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {selected.categoryName} · {confidenceLabel[selected.confidence]}
                      {selected.usedMlForecast ? ' · harcama eğilimin de hesaba katıldı' : ''}
                    </p>
                  </div>
                ) : null}
                <div className="grid grid-cols-3 gap-2">
                  <Metric label="Aylık tasarruf" value={fmtTry(selected.monthlySaving)} accent />
                  <Metric label="Yıllık" value={fmtTry(selected.yearlySaving)} />
                  <Metric label="Beklenen → hedef" value={`${fmtTry(selected.currentLevel)} → ${fmtTry(selected.targetLevel)}`} />
                </div>

                {selected.explanation ? (
                  <AiNote text={`${selected.explanation} ${selected.action}`.trim()} source={selected.narrativeSource} clamp={false} />
                ) : null}

                {selected.monthlyHistory.length > 0 ? (
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-foreground">
                      <Target className="h-3 w-3" aria-hidden /> Aylık harcama ve hedef seviye
                    </p>
                    <div className="h-36 w-full">
                      <HistoryBars history={selected.monthlyHistory} target={selected.targetLevel} />
                    </div>
                  </div>
                ) : null}

                {selected.relatedSubscriptions.length > 0 ? (
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-foreground">
                      <Repeat className="h-3 w-3" aria-hidden /> İlgili abonelikler
                    </p>
                    <ul className="divide-y divide-border/60 rounded-md border border-border">
                      {selected.relatedSubscriptions.map((s) => (
                        <li key={s.name} className="flex justify-between px-2.5 py-1.5 text-[11px]">
                          <span>{s.name}</span>
                          <span className="font-semibold tabular-nums">{fmtTry(s.expectedAmount)}/ay</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div>
                  <p className="mb-1 text-[11px] font-semibold text-foreground">Neden bu öneri?</p>
                  <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-muted-foreground">
                    {selected.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>

                {opps.length > 1 && !inline ? (
                  <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
                    {opps.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => onSelect(o)}
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-[10px]',
                          o.id === selected.id
                            ? 'border-primary bg-primary/10 font-semibold text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {o.categoryName} · {fmtTry(o.monthlySaving)}
                      </button>
                    ))}
                  </div>
                ) : null}
                <p className="text-[9px] text-muted-foreground">
                  Tutarlar kendi geçmiş verinden hesaplandı; AI yalnızca açıklamayı yazar.
                </p>
              </div>
  );
}

function HistoryBars({ history, target }: { history: { label: string; amount: number }[]; target: number }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={history} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
          formatter={(v) => [fmtTry(Number(v)), "Harcama"]}
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 6,
            fontSize: 11,
            color: 'hsl(var(--popover-foreground))',
          }}
        />
        <ReferenceLine y={target} stroke="hsl(152 60% 40%)" strokeDasharray="4 3" />
        <Bar dataKey="amount" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {history.map((h) => (
            <Cell key={h.label} fill={h.amount > target ? 'hsl(var(--primary))' : 'hsl(var(--chart-2))'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-2.5 py-1.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-bold tabular-nums', accent ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground')}>
        {value}
      </p>
    </div>
  );
}
