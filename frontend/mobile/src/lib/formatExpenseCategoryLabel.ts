/** Web ile aynı — varsayılan kategori adlarını kullanıcı dostu göster. */
export function formatExpenseCategoryLabel(raw: string | undefined | null): string {
  const n = (raw ?? '').trim();
  if (!n) return 'Diğer';
  if (n === 'Gider') return 'Genel gider';
  return n;
}

export function formatIncomeCategoryLabel(raw: string | undefined | null): string {
  const n = (raw ?? '').trim();
  if (!n) return 'Diğer';
  if (n === 'Gelir') return 'Genel gelir';
  return n;
}

export function formatTransactionCategoryLabel(raw: string | undefined | null, isIncome: boolean): string {
  return isIncome ? formatIncomeCategoryLabel(raw) : formatExpenseCategoryLabel(raw);
}
