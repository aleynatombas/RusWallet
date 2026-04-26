import type { TransactionRow } from '@/types/dashboard';

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** Ay bazında kategori → toplam gider (son N ay). */
export function buildExpenseCategoryMonthMatrix(transactions: TransactionRow[], maxMonths = 6): {
  months: string[];
  byCategory: Record<string, number[]>;
} {
  const expense = transactions.filter((t) => !t.isIncome);
  const monthSet = new Set<string>();
  for (const t of expense) monthSet.add(monthKey(t.transactionDate));
  const months = [...monthSet].sort().slice(-maxMonths);

  const byCategory: Record<string, number[]> = {};
  for (const m of months) {
    for (const t of expense) {
      if (monthKey(t.transactionDate) !== m) continue;
      const cat = (t.categoryName ?? '').trim() || 'Diğer';
      if (!byCategory[cat]) byCategory[cat] = months.map(() => 0);
    }
  }

  const idx = (m: string) => months.indexOf(m);
  for (const t of expense) {
    const m = monthKey(t.transactionDate);
    const i = idx(m);
    if (i < 0) continue;
    const cat = (t.categoryName ?? '').trim() || 'Diğer';
    if (!byCategory[cat]) byCategory[cat] = months.map(() => 0);
    byCategory[cat][i] += Number(t.amount);
  }

  return { months, byCategory };
}

function pearson(a: number[], b: number[]): number | null {
  if (a.length !== b.length || a.length < 3) return null;
  const n = a.length;
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  if (den < 1e-9) return null;
  return num / den;
}

export interface CategoryCorrelationNote {
  /** En güçlü ilişki (|r| maks.) */
  otherCategory: string;
  coefficient: number;
  direction: 'negatif' | 'pozitif';
  technicalLine: string;
}

export function explainCategoryCorrelation(
  categoryName: string,
  matrix: Record<string, number[]>
): CategoryCorrelationNote | null {
  const self = matrix[categoryName];
  if (!self) return null;
  let best: { other: string; r: number } | null = null;
  for (const [other, series] of Object.entries(matrix)) {
    if (other === categoryName) continue;
    const r = pearson(self, series);
    if (r == null) continue;
    if (!best || Math.abs(r) > Math.abs(best.r)) best = { other, r };
  }
  if (!best) return null;
  const direction: 'negatif' | 'pozitif' = best.r < 0 ? 'negatif' : 'pozitif';
  const rStr = best.r.toFixed(2).replace('.', ',');
  const technicalLine = `${categoryName} harcamaları ile ${best.other} harcamaları arasında (Pearson r ≈ ${rStr}) ${direction} korelasyon tespit edildi; aylık seriler, ${self.length} ay.`;
  return {
    otherCategory: best.other,
    coefficient: best.r,
    direction,
    technicalLine,
  };
}
