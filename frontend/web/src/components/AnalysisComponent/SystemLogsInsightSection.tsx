import type { SystemLogEntry, SystemLogLevel } from '@/lib/buildSystemLogInsights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SystemLogsInsightSectionProps {
  entries: SystemLogEntry[];
}

function levelStyle(level: SystemLogLevel): string {
  switch (level) {
    case 'ANOMALY':
      return 'border-amber-500/40 bg-amber-500/[0.07]';
    case 'PATTERN':
      return 'border-violet-500/35 bg-violet-500/[0.06]';
    case 'SUBSCRIPTION':
      return 'border-sky-500/35 bg-sky-500/[0.06]';
    case 'PRICING':
      return 'border-rose-500/30 bg-rose-500/[0.06]';
    default:
      return 'border-border/80 bg-muted/20';
  }
}

export function SystemLogsInsightSection({ entries }: SystemLogsInsightSectionProps) {
  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="font-mono text-lg tracking-tight">Sistem logları ve zeka çıktıları</CardTitle>
        <CardDescription className="font-mono text-xs">
          Anomali ve örüntü sinyalleri — konsol tarzı özet; sunucu + istemci istatistikleri.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-3" aria-label="Zeka log çıktıları">
          {entries.map((e) => (
            <li
              key={e.id}
              className={cn(
                'rounded-lg border px-4 py-3 font-mono text-xs leading-relaxed shadow-elevation dark:shadow-sm',
                levelStyle(e.level)
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{e.title}</p>
              <p className="mt-2 text-[13px] text-foreground">{e.body}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
