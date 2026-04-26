import type { TransactionRow } from '@/types/dashboard';

export interface CashFlowChartPoint {
  /** kısa etiket (gün/ay) */
  label: string;
  /** ISO gün (sıralama) */
  dayKey: string;
  /** Geçmiş günlük harcama (sadece son 30 gün) */
  history: number | null;
  /** Tahmin orta değer (gelecek 30 gün) */
  forecast: number | null;
  /** Recharts ErrorBar: [alt_mesafe, üst_mesafe] tahmin ekseninde */
  forecastCi: [number, number] | null;
}

function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Son 30 gün günlük harcama + gelecek 30 gün tahmini (günlük TL).
 * spendLessPct: kullanıcı "bu kadar % daha az harcarsam" (0–50 tipik).
 */
export function buildCashFlowProjection(
  transactions: TransactionRow[],
  spendLessPct: number
): CashFlowChartPoint[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const histStart = addDays(today, -30);

  const dayTotals = new Map<string, number>();
  for (const t of transactions) {
    if (t.isIncome) continue;
    const day = (t.transactionDate ?? '').slice(0, 10);
    if (!day) continue;
    const dt = new Date(day + 'T12:00:00');
    if (dt < histStart || dt > today) continue;
    dayTotals.set(day, (dayTotals.get(day) ?? 0) + Number(t.amount));
  }

  const historyDays: { key: string; amount: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = addDays(histStart, i);
    if (d > today) break;
    const key = ymd(d);
    historyDays.push({ key, amount: dayTotals.get(key) ?? 0 });
  }

  const recent = historyDays.slice(-14).map((x) => x.amount);
  const baseDaily = recent.length > 0 ? mean(recent) : mean(historyDays.map((x) => x.amount));
  const volatility = Math.max(
    baseDaily * 0.12,
    recent.length > 1
      ? Math.sqrt(
          recent.reduce((s, v) => s + (v - mean(recent)) ** 2, 0) / Math.max(recent.length - 1, 1)
        )
      : baseDaily * 0.15
  );

  const factor = Math.max(0.5, 1 - Math.min(50, Math.max(0, spendLessPct)) / 100);

  const out: CashFlowChartPoint[] = [];

  for (const { key, amount } of historyDays) {
    const short = new Date(key + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    out.push({
      label: short,
      dayKey: key,
      history: amount,
      forecast: null,
      forecastCi: null,
    });
  }

  const lastKey = historyDays.length ? historyDays[historyDays.length - 1].key : ymd(today);

  for (let k = 1; k <= 30; k++) {
    const d = addDays(new Date(lastKey + 'T12:00:00'), k);
    const key = ymd(d);
    const drift = 1 + (k / 30) * 0.04;
    const f = baseDaily * factor * drift;
    const low = Math.max(0, f - volatility * 1.15);
    const high = f + volatility * 1.25;
    const short = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    out.push({
      label: short,
      dayKey: key,
      history: null,
      forecast: f,
      forecastCi: [f - low, high - f],
    });
  }

  return out;
}

export function estimateDaysUntilBalanceCritical(
  balance: number,
  transactions: TransactionRow[],
  criticalThreshold = 0
): { days: number | null; avgDailyExpense: number } {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const byDay = new Map<string, number>();
  for (const t of transactions) {
    if (t.isIncome) continue;
    const day = (t.transactionDate ?? '').slice(0, 10);
    if (!day) continue;
    const dt = new Date(day + 'T12:00:00');
    if (dt < addDays(today, -30) || dt > today) continue;
    byDay.set(day, (byDay.get(day) ?? 0) + Number(t.amount));
  }
  let sum14 = 0;
  for (let i = 0; i < 14; i++) {
    const d = addDays(today, -(13 - i));
    sum14 += byDay.get(ymd(d)) ?? 0;
  }
  const avgDailyExpense = sum14 / 14;

  if (balance <= criticalThreshold || avgDailyExpense <= 0) return { days: null, avgDailyExpense };
  const days = (balance - criticalThreshold) / avgDailyExpense;
  return { days, avgDailyExpense };
}
