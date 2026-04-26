import { Sparkles, AlertTriangle, Leaf } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalysisInsight } from '@/lib/buildAnalysisInsights';

interface AiInsightCardsProps {
  insights: AnalysisInsight[];
}

function IconFor({ tone }: { tone: AnalysisInsight['tone'] }) {
  if (tone === 'warning') return <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />;
  if (tone === 'positive') return <Leaf className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />;
  return <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />;
}

export function AiInsightCards({ insights }: AiInsightCardsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" aria-hidden />
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Yapay zekâ önerileri</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Harcama geçmişiniz, bütçe modeli ve anomali tespitine göre otomatik üretilmiş özetler (sunucu tarafı ML /
        istatistik).
      </p>
      <ul className="space-y-3">
        {insights.map((ins) => (
          <li key={ins.id}>
            <Card
              className={
                ins.tone === 'warning'
                  ? 'border-amber-500/35 bg-amber-500/5'
                  : ins.tone === 'positive'
                    ? 'border-primary/35 bg-primary/5'
                    : 'border-border'
              }
            >
              <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2 pt-4">
                <IconFor tone={ins.tone} />
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base font-semibold leading-snug">{ins.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pb-4 pt-0 text-sm leading-relaxed text-muted-foreground">{ins.body}</CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
