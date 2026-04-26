import type { TransactionRow } from '@/types/dashboard';

export interface MonthBucket {
  key: string;
  label: string;
  start: Date;
  end: Date;
  total: number;
}

/** Son `count` tam ay için takvim aralıkları (en eski → en yeni). */
export function getPastMonthWindows(count: number): { start: Date; end: Date; label: string; key: string }[] {
  const now = new Date();
  const out: { start: Date; end: Date; label: string; key: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const last = new Date(y, m + 1, 0);
    const end = i === 0 ? now : last;
    const pad = (n: number) => String(n).padStart(2, '0');
    const key = `${y}-${pad(m + 1)}`;
    const label = new Date(y, m, 15).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
    out.push({
      start: new Date(y, m, 1, 0, 0, 0, 0),
      end: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999),
      label,
      key,
    });
  }
  return out;
}

function ymKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** Gider işlemlerini ay dilimlerine böler (sadece !isIncome). */
export function bucketExpensesByMonth(
  transactions: TransactionRow[],
  windows: { start: Date; end: Date; label: string; key: string }[]
): MonthBucket[] {
  const map = new Map<string, number>();
  for (const w of windows) map.set(w.key, 0);

  for (const t of transactions) {
    if (t.isIncome) continue;
    const dt = new Date(t.transactionDate);
    const k = ymKey(dt);
    if (map.has(k)) map.set(k, (map.get(k) ?? 0) + Number(t.amount));
  }

  return windows.map((w) => ({
    key: w.key,
    label: w.label,
    start: w.start,
    end: w.end,
    total: Math.round((map.get(w.key) ?? 0) * 100) / 100,
  }));
}
