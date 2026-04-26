import type { TransactionRow } from '@/types/dashboard';
import { groupExpenseByCategory } from '@/lib/groupExpenseByCategory';

/** Geçen aya göre en çok yüzde artan kategori (eşik: min %15 ve önceki ay > 50 TL). */
export function topCategoryMonthOverMonth(
  currentMonth: TransactionRow[],
  previousMonth: TransactionRow[]
): { name: string; pct: number; current: number; previous: number } | null {
  const cur = groupExpenseByCategory(currentMonth);
  const prev = groupExpenseByCategory(previousMonth);
  let best: { name: string; pct: number; current: number; previous: number } | null = null;
  for (const c of cur) {
    const pVal = prev.find((x) => x.name === c.name)?.value ?? 0;
    if (pVal < 50) continue;
    const pct = ((c.value - pVal) / pVal) * 100;
    if (pct >= 15 && (!best || pct > best.pct)) {
      best = { name: c.name, pct, current: c.value, previous: pVal };
    }
  }
  return best;
}
