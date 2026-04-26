/** MaterialCommunityIcons adı — tablo satırı için. */
export function transactionCategoryIconName(categoryName: string, isIncome: boolean): string {
  if (isIncome) return 'cash-plus';
  const n = categoryName.toLowerCase();
  if (/kahve|yemek|cafe|restoran|kebap/i.test(n)) return 'coffee';
  if (/market|gıda|şok|migros/i.test(n)) return 'cart';
  if (/ulaşım|taksi|metro|otobüs|benzin/i.test(n)) return 'train';
  return 'wallet-outline';
}
