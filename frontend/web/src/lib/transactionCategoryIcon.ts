import { ArrowDownCircle, Coffee, ShoppingCart, Train, Wallet, type LucideIcon } from 'lucide-react';

/** Küçük tablo/aksiyon ikonları için kategoriye göre Lucide bileşeni seçer. */
export function transactionCategoryIcon(categoryName: string, isIncome: boolean): LucideIcon {
  if (isIncome) return ArrowDownCircle;
  const n = categoryName.toLowerCase();
  if (/kahve|yemek|cafe|restoran|kebap/i.test(n)) return Coffee;
  if (/market|gıda|şok|migros/i.test(n)) return ShoppingCart;
  if (/ulaşım|taksi|metro|otobüs|benzin/i.test(n)) return Train;
  return Wallet;
}
