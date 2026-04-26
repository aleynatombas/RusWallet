import { AlertTriangle, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface HeroAlert {
  id: string;
  title: string;
  body: string;
  variant: 'warning' | 'info';
}

interface AnalysisHeroSectionProps {
  alerts: HeroAlert[];
}

export function AnalysisHeroSection({ alerts }: AnalysisHeroSectionProps) {
  if (alerts.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.12] via-background to-muted/40 p-6 shadow-elevation dark:shadow-sm sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-primary/10 blur-3xl" aria-hidden />

      <div className="relative grid gap-3 sm:grid-cols-2">
        {alerts.map((a) => (
          <Card
            key={a.id}
            className={
              a.variant === 'warning'
                ? 'border-primary/35 bg-primary/[0.08]'
                : 'border-border bg-card/80 backdrop-blur-sm'
            }
          >
            <div className="flex gap-3 p-4">
              {a.variant === 'warning' ? (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              ) : (
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{a.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{a.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
