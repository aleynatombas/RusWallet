import type { TransactionRow } from '@/types/dashboard';
import type { AnomaliesResponse } from '@/types/prediction';
import type { BudgetSuggestionsResponseDto } from '@/types/budget';

export type SystemLogLevel = 'PATTERN' | 'SUBSCRIPTION' | 'PRICING' | 'ANOMALY' | 'INFO';

export interface SystemLogEntry {
  id: string;
  level: SystemLogLevel;
  title: string;
  body: string;
}

function ymd(iso: string): string {
  return iso.slice(0, 10);
}

function dayOfMonth(iso: string): number {
  return Number(iso.slice(8, 10));
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function avgExpenseTicketByCategory(tx: TransactionRow[]): Map<string, number> {
  const m = new Map<string, { sum: number; n: number }>();
  for (const t of tx) {
    if (t.isIncome) continue;
    const c = (t.categoryName ?? '').trim() || 'Diğer';
    const x = m.get(c) ?? { sum: 0, n: 0 };
    x.sum += Number(t.amount);
    x.n += 1;
    m.set(c, x);
  }
  const out = new Map<string, number>();
  for (const [k, v] of m) {
    if (v.n >= 2) out.set(k, v.sum / v.n);
  }
  return out;
}

/** Anomali + istatistiksel örüntüler; “sistem logu” kartları için metin üretir. */
export function buildSystemLogInsights(
  transactions: TransactionRow[],
  currentMonthTx: TransactionRow[],
  previousMonthTx: TransactionRow[],
  anomalies: AnomaliesResponse | null,
  budget: BudgetSuggestionsResponseDto | null
): SystemLogEntry[] {
  const out: SystemLogEntry[] = [];
  const now = new Date();

  if (anomalies?.anomalies?.length) {
    for (let i = 0; i < Math.min(3, anomalies.anomalies.length); i++) {
      const a = anomalies.anomalies[i];
      out.push({
        id: `log-anom-${i}-${a.categoryName}`,
        level: 'ANOMALY',
        title: `[ANOMALY] ${a.categoryName}`,
        body: a.message,
      });
    }
  }

  const expenses = transactions.filter((t) => !t.isIncome);
  const monthSet = [...new Set(expenses.map((t) => monthKey(t.transactionDate)))].sort();
  const last4 = monthSet.slice(-4);
  if (last4.length >= 3) {
    const ratios: number[] = [];
    for (const m of last4) {
      let mid = 0;
      let total = 0;
      for (const t of expenses) {
        if (monthKey(t.transactionDate) !== m) continue;
        const amt = Number(t.amount);
        total += amt;
        const dom = dayOfMonth(t.transactionDate);
        if (dom >= 15 && dom <= 18) mid += amt;
      }
      if (total > 80) ratios.push(mid / total);
    }
    if (ratios.length >= 3) {
      const meanR = ratios.reduce((a, b) => a + b, 0) / ratios.length;
      const varR =
        ratios.reduce((s, v) => s + (v - meanR) ** 2, 0) / Math.max(ratios.length - 1, 1);
      const stdR = Math.sqrt(varR);
      if (meanR > 0.24 && stdR > 1e-6 && meanR > stdR * 1.8) {
        out.push({
          id: 'log-pattern-midmonth',
          level: 'PATTERN',
          title: '[PATTERN] Tekrarlayan örüntü',
          body: `Son ${ratios.length} ayda, ayın 15–18'i arası harcama yoğunluğu toplam gider içinde ortalama %${(meanR * 100).toFixed(0)} payına çıkıyor; seri oynaklığı görece düşük — aynı pencerede tekrar eden bir yoğunluk var.`,
        });
      }
    }
  }

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 90);
  const recent = expenses.filter((t) => new Date(ymd(t.transactionDate) + 'T12:00:00') >= cutoff);
  const micro = recent.filter((t) => Number(t.amount) > 0 && Number(t.amount) < 30);
  if (micro.length >= 2) {
    out.push({
      id: 'log-micro',
      level: 'SUBSCRIPTION',
      title: '[SUBSCRIPTION] Mikro-ödeme taraması',
      body: `Kullanılmayan veya unutulmuş olabilecek ${micro.length} adet mikro-ödeme (30₺ altı) saptandı; abonelik ve küçük çekimleri kontrol etmek faydalı olabilir.`,
    });
  }

  const curAvg = avgExpenseTicketByCategory(currentMonthTx);
  const prevAvg = avgExpenseTicketByCategory(previousMonthTx);
  let bestCat: string | null = null;
  let bestPct = 0;
  for (const [cat, cur] of curAvg) {
    const p = prevAvg.get(cat);
    if (p == null || p < 8) continue;
    const pct = ((cur - p) / p) * 100;
    if (pct > bestPct && pct >= 10) {
      bestPct = pct;
      bestCat = cat;
    }
  }
  if (bestCat != null) {
    out.push({
      id: 'log-pricing',
      level: 'PRICING',
      title: '[PRICING] Birim maliyet / ortalama tutar',
      body: `${bestCat} kategorisinde ortalama işlem tutarı geçen aya göre yaklaşık %${bestPct.toFixed(0)} yükselmiş görünüyor (fiyat, sıklık veya tek seferlik büyük alışveriş etkisi olabilir).`,
    });
  }

  const sugg = budget?.suggestions?.filter((s) => s.suggestedAmount > 0 && s.averageSpent > s.suggestedAmount);
  if (sugg?.length && out.length < 8) {
    const top = [...sugg].sort((a, b) => b.percentageOfTotal - a.percentageOfTotal)[0];
    if (top) {
      out.push({
        id: 'log-budget-cap',
        level: 'INFO',
        title: '[INFO] Bütçe modeli',
        body: `${top.categoryName} kalemi son dönemde toplam giderin ~%${top.percentageOfTotal.toFixed(0)}'ini oluşturuyor; model önerisi ${top.suggestedAmount.toFixed(0)} TL/ay hedefi.`,
      });
    }
  }

  if (out.length === 0) {
    out.push({
      id: 'log-idle',
      level: 'INFO',
      title: '[INFO] Zeka çıktıları',
      body:
        'İşlem sayısı ve ay çeşitliliği arttıkça tekrarlayan örüntüler, mikro-ödemeler ve kategori bazlı tutar uyarıları bu panelde görünecek.',
    });
  }

  return out.slice(0, 10);
}
