import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalysisQaModuleDto, LifestyleProfileDto } from '@/types/financialRoadmap';
import { ANALYSIS_CARD_TITLE_CLASS, formatPageTitleDisplay } from '@/lib/pageTitle';
import { cn } from '@/lib/utils';

/** Yuvarlak grafik yerine yatay bölümlü çubuk + esneklik skoru — analiz grid’inde yer kaplamasın diye sıkı */
function LifestyleShareBar({ lifestyle }: { lifestyle: LifestyleProfileDto }) {
  const m = Math.min(100, Math.max(0, lifestyle.mandatorySharePercent));
  const d = Math.min(100, Math.max(0, lifestyle.discretionarySharePercent));
  const score = Math.round(lifestyle.flexibilityScore);
  const sum = m + d;
  const mBar = sum > 0 ? (m / sum) * 100 : 50;
  const dBar = sum > 0 ? (d / sum) * 100 : 50;

  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-0.5">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
            {formatPageTitleDisplay('Esneklik')}
          </p>
          <p className="text-lg font-bold tabular-nums leading-none text-foreground sm:text-xl">
            {score}
            <span className="ml-0.5 text-xs font-medium tabular-nums text-muted-foreground">/100</span>
          </p>
        </div>
        <div className="flex gap-2 text-[9px] tabular-nums text-muted-foreground sm:text-[10px]">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 shrink-0 rounded-sm bg-foreground/80" aria-hidden />
            {formatPageTitleDisplay('Zorunlu')} {m.toFixed(0)}%
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 shrink-0 rounded-sm bg-muted-foreground/45" aria-hidden />
            {formatPageTitleDisplay('Esnek')} {d.toFixed(0)}%
          </span>
        </div>
      </div>
      <div
        className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${formatPageTitleDisplay('Zorunlu')} ${m.toFixed(0)} yüzde, ${formatPageTitleDisplay('Esnek')} ${d.toFixed(0)} yüzde`}
      >
        <div className="h-full min-w-0 bg-foreground/85 transition-[width] dark:bg-foreground/80" style={{ width: `${mBar}%` }} />
        <div className="h-full min-w-0 bg-muted-foreground/35" style={{ width: `${dBar}%` }} />
      </div>
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
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 px-2.5 pb-2 pt-2 sm:px-3 lg:flex-row lg:items-start lg:overflow-hidden">
        {lifestyle ? (
          <>
            <div className="w-full min-w-0 shrink-0 lg:max-w-[52%]">
              <LifestyleShareBar lifestyle={lifestyle} />
            </div>
            <p className="line-clamp-2 min-w-0 flex-1 text-[10px] leading-snug text-muted-foreground sm:line-clamp-3 sm:text-[11px]">
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
