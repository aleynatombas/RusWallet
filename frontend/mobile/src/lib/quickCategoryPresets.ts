/**
 * Hazır gider / gelir etiketleri — web `quickCategoryPresets.ts` ile aynı.
 */

const EXPENSE_CORE = [
  'Abonelik',
  'Bakım onarım',
  'Cafe',
  'Eğitim',
  'Eğlence',
  'Faturalar',
  'Giyim',
  'Hediye',
  'Kırtasiye',
  'Kozmetik',
  'Market',
  'Restoran',
  'Sağlık',
  'Teknoloji',
  'Ulaşım',
  'Yakıt',
] as const;

const INCOME_CORE = [
  'Ek gelir',
  'Freelance',
  'Geri ödeme',
  'Hediye geliri',
  'Kira geliri',
  'Maaş',
  'Satış',
  'Yatırım getirisi',
] as const;

function sortTr(a: string, b: string): number {
  return a.localeCompare(b, 'tr', { sensitivity: 'base' });
}

export const QUICK_PRESET_EXPENSE: readonly string[] = [...[...EXPENSE_CORE].sort(sortTr), 'Diğer gider'];

export const QUICK_PRESET_INCOME: readonly string[] = [...[...INCOME_CORE].sort(sortTr), 'Diğer gelir'];

const expNorm = new Set(QUICK_PRESET_EXPENSE.map((s) => s.trim().toLowerCase()));
const incNorm = new Set(QUICK_PRESET_INCOME.map((s) => s.trim().toLowerCase()));

export function quickCategoryViolatesType(name: string, isIncomeButton: boolean): string | null {
  const k = name.trim().toLowerCase();
  if (!k) return null;
  const isExpPreset = expNorm.has(k);
  const isIncPreset = incNorm.has(k);
  if (isExpPreset && isIncomeButton) {
    return 'Bu hazır kategori gider içindir. Gider (−) ile ekleyin veya gelir kategorisi yazın.';
  }
  if (isIncPreset && !isIncomeButton) {
    return 'Bu hazır kategori gelir içindir. Gelir (+) ile ekleyin veya gider kategorisi yazın.';
  }
  return null;
}

const ANCHOR_EXP = 'diğer gider';
const ANCHOR_INC = 'diğer gelir';

export function buildQuickCategorySuggestionPool(userCategoryNames: string[]): string[] {
  const set = new Set<string>();
  const add = (s: string) => {
    const t = s.trim();
    if (t) set.add(t);
  };
  for (const s of QUICK_PRESET_EXPENSE) add(s);
  for (const s of QUICK_PRESET_INCOME) add(s);
  for (const s of userCategoryNames) add(s);

  const takeAnchor = (canonicalLower: string): string | null => {
    for (const s of set) {
      if (s.trim().toLowerCase() === canonicalLower) return s;
    }
    return null;
  };

  const digerGider = takeAnchor(ANCHOR_EXP);
  const digerGelir = takeAnchor(ANCHOR_INC);

  const rest = [...set].filter((s) => {
    const l = s.trim().toLowerCase();
    return l !== ANCHOR_EXP && l !== ANCHOR_INC;
  });
  rest.sort(sortTr);

  const tail: string[] = [];
  if (digerGider) tail.push(digerGider);
  if (digerGelir) tail.push(digerGelir);

  return [...rest, ...tail];
}

export function filterSuggestionPoolByQuery(pool: string[], query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return pool;
  return pool.filter((s) => s.toLowerCase().includes(q));
}
