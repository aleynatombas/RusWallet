import type { BudgetSuggestionsResponseDto } from '@/types/budget';
import type { AnomaliesResponse } from '@/types/prediction';

export type InsightTone = 'default' | 'warning' | 'positive';

export interface AnalysisInsight {
  id: string;
  title: string;
  body: string;
  tone: InsightTone;
}

/** Üst şeritte değil, kategori grafiği ile birlikte gösterilir. */
export const INSIGHT_ID_DISTRIBUTION_TOP_TWO = 'compare-top-two';

/** Kira, fatura, sigorta, kredi gibi zorunlu kategoriler anomali olarak işaretlenmez. */
function isMandatoryCategory(categoryName: string): boolean {
  return /kira|fatura|sigorta|kredi|vergi/i.test(categoryName);
}

/** Bütçe + anomali verisinden okunabilir öneri kartları üretir (sunucuda üretilmiş ML/istatistik + metin). */
export function buildAnalysisInsights(
  budget: BudgetSuggestionsResponseDto | null,
  anomalies: AnomaliesResponse | null
): AnalysisInsight[] {
  const list: AnalysisInsight[] = [];

  if (anomalies?.anomalies?.length) {
    for (let i = 0; i < anomalies.anomalies.length; i++) {
      const a = anomalies.anomalies[i];
      if (isMandatoryCategory(a.categoryName)) continue;
      list.push({
        id: `anomaly-${a.categoryName}-${i}`,
        title: `${a.categoryName}: olağandışı harcama`,
        body: a.message,
        tone: a.severity === 'Yüksek' ? 'warning' : 'default',
      });
    }
  }

  const suggestions = budget?.suggestions ?? [];
  const sorted = [...suggestions].sort((a, b) => b.percentageOfTotal - a.percentageOfTotal);

  if (sorted.length >= 2) {
    const [top, second] = sorted;
    const diff = top.averageSpent - second.averageSpent;
    if (diff > 0 && top.percentageOfTotal >= 15) {
      list.push({
        id: 'compare-top-two',
        title: 'Harcama dağılımı',
        body: `En yüksek pay ${top.categoryName} kategorisinde (%${top.percentageOfTotal.toFixed(0)}). İkinci sıra ${second.categoryName} (%${second.percentageOfTotal.toFixed(0)}). ${second.categoryName} ve benzeri kalemlere kaydırarak üst kategorideki baskıyı azaltabilirsiniz.`,
        tone: 'default',
      });
    }
  }

  let savingsCards = 0;
  for (const s of sorted.slice(0, 6)) {
    if (s.suggestedAmount <= 0) continue;
    const over = s.averageSpent - s.suggestedAmount;
    if (over > 50 && s.averageSpent > 0 && savingsCards < 3) {
      savingsCards += 1;
      const pct = Math.round((over / s.averageSpent) * 100);
      list.push({
        id: `save-${s.categoryId}-${s.categoryName}`,
        title: `${s.categoryName}: tasarruf alanı`,
        body: `Son dönem ortalamanız ${s.averageSpent.toFixed(0)} TL; model önerisi ${s.suggestedAmount.toFixed(0)} TL. Yaklaşık ${over.toFixed(0)} TL (${pct}%) tasarruf için bu kategoride harcamayı önerilen seviyeye çekmeyi deneyebilirsiniz.`,
        tone: 'positive',
      });
    }
  }

  if (list.length === 0 && budget?.message) {
    list.push({
      id: 'budget-msg',
      title: 'Bütçe önerileri',
      body: budget.message,
      tone: 'default',
    });
  }

  if (list.length === 0 && anomalies?.message) {
    list.push({
      id: 'anomaly-msg',
      title: 'Anomali analizi',
      body: anomalies.message,
      tone: 'default',
    });
  }

  if (list.length === 0) {
    list.push({
      id: 'placeholder',
      title: 'Veri toplandıkça öneriler',
      body:
        'Yeterli gider kaydı ve kategori çeşitliliği oluştuğunda; anomali uyarıları, kategori karşılaştırmaları ve tasarruf tahminleri burada listelenecek.',
      tone: 'default',
    });
  }

  return list.slice(0, 8);
}
