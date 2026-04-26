import type { TransactionRow } from '../types/dashboard';

export interface CategorySlice {
  name: string;
  value: number;
}

/** Gider işlemlerini kategori adına göre gruplar (büyükten küçüğe). */
export function groupExpenseByCategory(transactions: TransactionRow[]): CategorySlice[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.isIncome) continue;
    const key = t.categoryName?.trim() || 'Diğer';
    map.set(key, (map.get(key) ?? 0) + Number(t.amount));
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
}
