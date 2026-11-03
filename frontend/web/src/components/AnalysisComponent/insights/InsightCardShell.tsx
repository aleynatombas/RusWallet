import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Database, Info, Lightbulb, ListChecks, Maximize2, Plus, RefreshCw, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ANALYSIS_CARD_TITLE_CLASS, formatPageTitleDisplay } from '@/lib/pageTitle';
import { cn } from '@/lib/utils';
import type { DataSufficiencyDto } from '@/types/smartInsights';

export const insightCardClass =
  'flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elevation transition-shadow dark:bg-zinc-900/50 dark:shadow-md dark:shadow-black/30';

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
  /** Odak (detay) ekranı: detay butonu gizlenir, içerik kesilmez. */
  expanded?: boolean;
  className?: string;
  children: ReactNode;
}

/** Üç modül kartının ortak iskeleti: ikon, başlık, ML/AI etiketi ve detay butonu. */
export function InsightCardShell({ title, icon, badge, onOpenDetail, expanded = false, className, children }: ShellProps) {
  return (
    <Card className={cn(insightCardClass, className)}>
      <CardHeader className={cn("flex shrink-0 flex-row items-center gap-2.5 space-y-0", expanded ? "border-b border-border/60 px-4 py-3 sm:px-5" : "px-3 pb-0 pt-2 sm:px-3.5 sm:pt-2.5")}>
        <span className={cn("flex shrink-0 items-center justify-center bg-primary/10 text-primary", expanded ? "h-9 w-9 rounded-xl" : "h-7 w-7 rounded-md")}>
          {icon}
        </span>
        <CardTitle className={cn(ANALYSIS_CARD_TITLE_CLASS, 'min-w-0 flex-1 truncate')}>
          {formatPageTitleDisplay(title)}
        </CardTitle>
        {badge ? <AiBadge label={badge} /> : null}
        {onOpenDetail && !expanded ? (
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
      <CardContent
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-2 px-3 pb-3 pt-2 sm:px-3.5',
          expanded ? 'gap-3 px-4 pb-4 pt-3 sm:px-5 lg:overflow-y-auto' : 'overflow-hidden'
        )}
      >
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
export function AiNote({ text, source, clamp = true }: { text: string; source?: 'openai' | 'rule_based'; clamp?: boolean }) {
  return (
    <div className="rounded-md border-l-2 border-primary/60 bg-primary/5 px-2 py-1.5 dark:bg-primary/10">
      <p className={cn('text-[11px] leading-snug text-foreground/90', clamp && 'line-clamp-2')}>{text}</p>
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

export interface DataRequirement {
  label: string;
  current: number;
  required: number;
  /** "gün", "kayıt", "ay" */
  unit: string;
}

interface DataCollectionProps {
  /** Analizin kullanıcıya ne kazandırdığı (tek cümle, teknik terim yok). */
  purpose: string;
  requirements: DataRequirement[];
  /** Eksik verinin neden gerekli olduğu. */
  why: string;
  /** Kullanıcının şimdi yapabileceği somut adım. */
  tip: string;
}

/**
 * Veri toplama durumu: sahte sonuç göstermez. Analizin amacını, mevcut/gereken veriyi,
 * neden gerektiğini ve kullanıcının şimdi ne yapabileceğini gösterir; işlem sayfasına yönlendirir.
 */
export function DataCollectionState({ purpose, requirements, why, tip }: DataCollectionProps) {
  const open = requirements.filter((r) => r.required > 0);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
      <p className="text-[11px] leading-snug text-foreground/85">{purpose}</p>

      <div className="space-y-1.5 rounded-md border border-dashed border-border bg-background/40 p-2 dark:bg-background/20">
        <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Database className="h-3 w-3" aria-hidden /> Veri durumu
        </p>
        {open.map((r) => (
          <RequirementRow key={r.label} r={r} />
        ))}
        <p className="flex gap-1 pt-0.5 text-[10px] leading-snug text-muted-foreground">
          <Info className="mt-px h-3 w-3 shrink-0" aria-hidden />
          <span>{why}</span>
        </p>
      </div>

      <p className="flex gap-1.5 text-[11px] leading-snug text-foreground/90">
        <Lightbulb className="mt-px h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        <span>{tip}</span>
      </p>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-0.5">
        <Button asChild size="sm" className="h-7 gap-1 px-2.5 text-[11px]">
          <Link to="/transactions#yeni-islem">
            <Plus className="h-3 w-3" aria-hidden /> İşlem ekle
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-[11px]">
          <Link to="/transactions">
            <ListChecks className="h-3 w-3" aria-hidden /> İşlemlerime git
          </Link>
        </Button>
      </div>
    </div>
  );
}

function RequirementRow({ r }: { r: DataRequirement }) {
  const pct = Math.min(100, Math.max(0, (r.current / r.required) * 100));
  const done = r.current >= r.required;
  const missing = Math.max(0, r.required - r.current);
  return (
    <div>
      <div className="mb-0.5 flex items-baseline justify-between gap-2 text-[10px]">
        <span className="text-muted-foreground">{r.label}</span>
        <span className="tabular-nums text-foreground">
          {Math.min(r.current, r.required)}/{r.required} {r.unit}
          <span className={cn('ml-1', done ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
            {done ? '· tamam' : `· ${missing} ${r.unit} daha`}
          </span>
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={r.label}
        aria-valuemin={0}
        aria-valuemax={r.required}
        aria-valuenow={Math.min(r.current, r.required)}
      >
        <div
          className={cn('h-full rounded-full transition-all', done ? 'bg-emerald-500/80' : 'bg-primary/75')}
          style={{ width: `${pct}%` }}
        />
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
