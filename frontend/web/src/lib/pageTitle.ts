import { formatGoalTitleDisplay } from '@/lib/formatDisplayName';

/**
 * Anasayfa «Hoş Geldin, …» başlığı ile aynı tipografi (DashboardComponent h1).
 */
export const PAGE_TITLE_CLASS =
  'text-2xl font-semibold tracking-tight text-foreground sm:text-3xl';

/** Analiz kartları ana başlığı — sayfa h1’den bir kademe küçük */
export const ANALYSIS_CARD_TITLE_CLASS =
  'text-lg font-semibold tracking-tight text-foreground sm:text-xl';

/** Hedef adı vurgusu (kart içi ikinci seviye) */
export const ANALYSIS_GOAL_HEADLINE_CLASS =
  'text-base font-semibold leading-snug text-foreground sm:text-lg';

/**
 * Sayfa başlığı metni — kelimeler Türkçe baş harf büyük.
 * Tek kelimelik marka adı (ör. RusWallet) olduğu gibi bırakılır.
 */
export function formatPageTitleDisplay(text: string): string {
  const t = text.trim();
  if (!t) return '';
  if (t === 'RusWallet') return t;
  return formatGoalTitleDisplay(t);
}
