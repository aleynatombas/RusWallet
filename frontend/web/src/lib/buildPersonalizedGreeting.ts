import { formatPersonNameSegment } from '@/lib/formatDisplayName';

/** Analiz sayfası hero için kısa kişiselleştirilmiş selamlama. */
export function buildPersonalizedGreeting(
  firstName: string | null | undefined,
  thisMonthTotal: number,
  lastMonthTotal: number
): string {
  const name = formatPersonNameSegment(firstName) || 'Merhaba';
  if (lastMonthTotal > 50) {
    const pct = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    if (pct <= -5) {
      return `${name}, bu ay toplam harcaman geçen aya göre yaklaşık %${Math.abs(Math.round(pct))} daha düşük — hedefine yaklaştın.`;
    }
    if (pct >= 10) {
      return `${name}, bu ay toplam harcaman geçen aya göre yaklaşık %${Math.round(pct)} arttı; aşağıdaki uyarı ve grafiklere göz at.`;
    }
  }
  return `${name}, bu ayki finansal özetin ve tahminlerin hazır.`;
}
