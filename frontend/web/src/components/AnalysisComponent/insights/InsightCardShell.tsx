import type { ReactNode } from 'react';
import { AlertCircle, Database, Maximize2, RefreshCw, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ANALYSIS_CARD_TITLE_CLASS, formatPageTitleDisplay } from '@/lib/pageTitle';
import { cn } from '@/lib/utils';
import type { DataSufficiencyDto } from '@/types/smartInsights';

export const insightCardClass =
  'flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/20 shadow-elevation dark:bg-zinc-900/40 dark:shadow-md dark:shadow-black/30';

export function fmtTry(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${Math.round(n).toLocaleString('tr-TR')} ₺`;
}

export function fmtPct(n: number | null | undefined, withPlus = true): string {
  if (n == null || Number.isNaN(n)) return '—';
  const r = Math.round(n);
  const sign = r < 0 ? '-' : withPlus && r > 0 ? '+' : '';
  return `${sign}%${Math.abs(r)}`;
}

interface ShellProps {
  title: string;
  icon: ReactNode;
  /** Kartın ML/AI ile üretildiğini gösteren küçük etiket. */
  badge?: string;
  onOpenDetail?: () => void;
  className?: string;
  children: ReactNode;
}

/** Üç modül kartının ortak iskeleti: ikon, başlık, ML/AI etiketi ve detay butonu. */
export function InsightCardShell({ title, icon, badge, onOpenDetail, className, children }: ShellProps) {
  return (
    <Card className={cn(insightCardClass, className)}>
      <CardHeader className="flex shrink-0 flex-row items-center gap-2 space-y-0 px-3 pb-0 pt-2 sm:px-3.5 sm:pt-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        <CardTitle className={cn(ANALYSIS_CARD_TITLE_CLASS, 'min-w-0 flex-1 truncate')}>
          {formatPageTitleDisplay(title)}
        </CardTitle>
        {badge ? <AiBadge label={badge} /> : null}
        {onOpenDetail ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7 shrink-0 border-transparent bg-transparent text-muted-foreground hover:text-foreground"
            onClick={onOpenDetail}
            aria-label={`${title} detayını aç`}
          >
            <Maximize2 className="h-3.5 w-3.5" aria-hidden />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-3 pb-3 pt-2 sm:px-3.5">
        {children}
      </CardContent>
    </Card>
  );
}

export function AiBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
      <Sparkles className="h-2.5 w-2.5" aria-hidden />
      {label}
    </span>
  );
}

/** AI tarafından yazılan açıklama: sol kenar çizgisiyle görsel olarak ayrışır. */
export function AiNote({ text, source }: { text: string; source?: 'openai' | 'rule_based' }) {
  return (
    <div className="rounded-md border-l-2 border-primary/60 bg-primary/5 px-2 py-1.5 dark:bg-primary/10">
      <p className="line-clamp-2 text-[11px] leading-snug text-foreground/90">{text}</p>
      {source ? (
        <p className="mt-0.5 text-[9px] text-muted-foreground">
          {source === 'openai' ? 'AI yorumu · OpenAI' : 'Otomatik yorum'}
        </p>
      ) : null}
    </div>
  );
}

export function InsightSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-2" aria-busy="true" aria-label="Yükleniyor">
      <div className="h-6 w-2/5 animate-pulse rounded-md bg-muted" />
      <div className="h-3 w-3/5 animate-pulse rounded-md bg-muted" />
      <div className="min-h-[40px] flex-1 animate-pulse rounded-md bg-muted/70" />
      <div className="h-3 w-4/5 animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export function InsightError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center" role="alert">
      <AlertCircle className="h-6 w-6 text-destructive/80" aria-hidden />
      <p className="max-w-[16rem] text-[11px] leading-snug text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={onRetry}>
          <RefreshCw className="h-3 w-3" aria-hidden />
          Tekrar dene
        </Button>
      ) : null}
    </div>
  );
}

/** Yetersiz veri: tahmin varmış gibi davranmaz, eksik miktarı ilerleme çubuğuyla gösterir. */
export function InsufficientData({ dq, hint }: { dq: DataSufficiencyDto; hint: string }) {
  const dayPct = dq.requiredHistoryDays > 0 ? Math.min(100, (dq.historyDays / dq.requiredHistoryDays) * 100) : 0;
  const txPct = dq.requiredTransactions > 0 ? Math.min(100, (dq.expenseTransactionCount / dq.requiredTransactions) * 100) : 0;
  return (
    <div className="flex flex-1 flex-col justify-center gap-2">
      <div className="flex items-start gap-2">
        <Database className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">Daha fazla veri gerekiyor</p>
          <p className="text-[11px] leading-snug text-muted-foreground">{dq.message || hint}</p>
        </div>
      </div>
      <ProgressRow label="Geçmiş" value={`${dq.historyDays}/${dq.requiredHistoryDays} gün`} pct={dayPct} />
      <ProgressRow label="Gider kaydı" value={`${dq.expenseTransactionCount}/${dq.requiredTransactions}`} pct={txPct} />
    </div>
  );
}

function ProgressRow({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DataQualityChip({ dq }: { dq: DataSufficiencyDto }) {
  const label = dq.level === 'good' ? 'Veri yeterli' : dq.level === 'limited' ? 'Sınırlı veri' : 'Veri yetersiz';
  const tone =
    dq.level === 'good'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';
  return (
    <span
      title={dq.message}
      className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold', tone)}
    >
      {label}
    </span>
  );
}
