/**
 * API `insightStack` (yoksa `fallback`) ile kart başına tek satır bilgi.
 * Ay sonu: predictive; radar: anomali ML; fırsat: tasarruf/kazanç ML.
 */
export type CockpitInsightStackKey = 'predictive_analysis' | 'ml_anomaly' | 'ml_opportunity';

const LINES: Record<CockpitInsightStackKey, string> = {
  predictive_analysis: 'AI + predictive — bu ay sonu ve gelecek ay gider öngörüsü.',
  ml_anomaly: 'ML — anomali: sıradışı harcama tespiti.',
  ml_opportunity: 'ML — tasarruf ve kazanç (fırsat) sinyalleri.',
};

export function cockpitInsightLine(
  insightStack: string | undefined | null,
  fallback: CockpitInsightStackKey
): string {
  const key = (insightStack as CockpitInsightStackKey) || fallback;
  return LINES[key] ?? LINES[fallback];
}
