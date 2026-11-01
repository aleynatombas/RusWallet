import { useState } from 'react';
import { Activity, CheckCircle2, Hash, ScanSearch, ShieldCheck, TrendingUp, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { AnomalyInsightDto, AnomalyItemDto } from '@/types/smartInsights';
import {
  DataQualityChip,
  fmtTry,
  InsightCardShell,
  InsightError,
  InsightSkeleton,
  InsufficientData,
} from './InsightCardShell';

interface Props {
  data: AnomalyInsightDto | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onMarkNormal: (key: string) => Promise<void>;
  onUndo: (key: string) => Promise<void>;
  className?: string;
}

export function AnomalyInsightCard({ data, loading, error, onRetry, onMarkNormal, onUndo, className }: Props) {
  const [open, setOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [lastDismissed, setLastDismissed] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const items = data?.items ?? [];
  const top = items[0];

  const mark = async (key: string) => {
    setBusyKey(key);
    setActionError('');
    try {
      await onMarkNormal(key);
      setLastDismissed(key);
    } catch {
      setActionError('İşaretlenemedi, tekrar dene.');
    } finally {
      setBusyKey(null);
    }
  };

  const undo = async () => {
    if (!lastDismissed) return;
    const key = lastDismissed;
    setBusyKey(key);
    try {
      await onUndo(key);
      setLastDismissed(null);
    } catch {
      setActionError('Geri alınamadı.');
    } finally {
      setBusyKey(null);
    }
  };

  const undoBar = lastDismissed ? (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground">
      <span>Normal olarak işaretlendi.</span>
      <button
        type="button"
        onClick={undo}
        disabled={busyKey === lastDismissed}
        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline disabled:opacity-60"
      >
        <Undo2 className="h-3 w-3" aria-hidden /> Geri al
      </button>
    </div>
  ) : null;

  return (
    <>
      <InsightCardShell
        title="Anomali tespiti"
        icon={<ScanSearch className="h-4 w-4" aria-hidden />}
        badge={data?.status === 'ready' ? 'ML' : undefined}
        onOpenDetail={data?.status === 'ready' && items.length > 0 ? () => setOpen(true) : undefined}
        className={className}
      >
        {loading ? (
          <InsightSkeleton />
        ) : error ? (
          <InsightError message={error} onRetry={onRetry} />
        ) : !data || data.status === 'error' ? (
          <InsightError message={data?.message || 'Anomali analizi yapılamadı.'} onRetry={onRetry} />
        ) : data.status === 'insufficient_data' ? (
          <InsufficientData dq={data.dataQuality} hint="Normal davranışı öğrenmek için daha fazla işlem gerekiyor." />
        ) : items.length === 0 ? (
          <>
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-foreground">Her şey yolunda</p>
              <p className="max-w-[17rem] text-[11px] leading-snug text-muted-foreground">
                {data.message} {data.evaluatedTransactionCount} işlem incelendi
                {data.excludedRecurringCount > 0 ? `, ${data.excludedRecurringCount} düzenli ödeme hariç tutuldu` : ''}.
              </p>
            </div>
            {undoBar}
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              <Stat label="Tespit" value={String(data.totalCount)} tone="warn" />
              <Stat label="Öne çıkan" value={data.topCategoryName ?? '—'} />
              <Stat label="Sapma" value={`+%${Math.round(top.deviationPercent)}`} tone="warn" />
            </div>
            <AnomalyRow item={top} busy={busyKey === top.key} onMark={() => mark(top.key)} compact />
            {undoBar}
            {actionError ? <p className="text-[10px] text-destructive">{actionError}</p> : null}
          </>
        )}
      </InsightCardShell>

      {data?.status === 'ready' ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Anomali tespiti</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Son {data.evaluatedWindowDays} gün · {data.evaluatedTransactionCount} işlem · {data.modelName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 px-4 py-4">
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                <DataQualityChip dq={data.dataQuality} />
                {data.excludedRecurringCount > 0 ? <span>{data.excludedRecurringCount} düzenli ödeme hariç</span> : null}
                {data.dismissedCount > 0 ? <span>{data.dismissedCount} kayıt normal olarak işaretli</span> : null}
              </div>
              {undoBar}
              {items.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">Gösterilecek anomali kalmadı.</p>
              ) : (
                items.map((it) => (
                  <AnomalyRow key={it.key} item={it} busy={busyKey === it.key} onMark={() => mark(it.key)} />
                ))
              )}
              {actionError ? <p className="text-[10px] text-destructive">{actionError}</p> : null}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
  return (
    <div className="min-w-0 rounded-md border border-border/60 bg-background/60 px-1.5 py-1 dark:bg-zinc-900/50">
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          'truncate text-xs font-bold tabular-nums',
          tone === 'warn' ? 'text-amber-600 dark:text-amber-300' : 'text-foreground'
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

const typeIcon = { unusual_transaction: TrendingUp, category_spike: Activity, frequency_spike: Hash } as const;

function AnomalyRow({
  item,
  busy,
  onMark,
  compact = false,
}: {
  item: AnomalyItemDto;
  busy: boolean;
  onMark: () => void;
  compact?: boolean;
}) {
  const Icon = typeIcon[item.type] ?? Activity;
  const date = item.date ? new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : null;
  return (
    <div
      className={cn(
        'rounded-md border px-2 py-1.5',
        item.severity === 'high'
          ? 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10'
          : 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10'
      )}
    >
      <div className="flex items-start gap-2">
        <Icon
          className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', item.severity === 'high' ? 'text-rose-500' : 'text-amber-500')}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-foreground">
            {item.reason} · {item.categoryName}
            {date ? <span className="font-normal text-muted-foreground"> · {date}</span> : null}
          </p>
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-[10px] tabular-nums text-muted-foreground">
            <span>
              Normal: <b className="text-foreground">{item.type === 'frequency_spike' ? `${item.normalCount} işlem` : fmtTry(item.normalAmount)}</b>
            </span>
            <span>
              Mevcut: <b className="text-foreground">{item.type === 'frequency_spike' ? `${item.currentCount} işlem` : fmtTry(item.currentAmount)}</b>
            </span>
          </div>
          <p className={cn('mt-0.5 text-[10px] leading-snug text-muted-foreground', compact && 'line-clamp-2')}>
            {item.explanation}
          </p>
          {!compact ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {item.detectionMethods.map((m) => (
                <span key={m} className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  {m}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={onMark}
          className="h-6 shrink-0 gap-1 border-transparent bg-transparent px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          title="Bu durumu normal olarak işaretle; tekrar gösterilmez"
        >
          <CheckCircle2 className="h-3 w-3" aria-hidden />
          Normal
        </Button>
      </div>
    </div>
  );
}
