import { getChartPalette } from '../theme/webPaletteMobile';

const PALETTE = [
  'hsl(221, 83%, 53%)',
  'hsl(142, 71%, 45%)',
  'hsl(262, 83%, 58%)',
  'hsl(32, 95%, 44%)',
  'hsl(340, 82%, 52%)',
  'hsl(199, 89%, 48%)',
  'hsl(48, 96%, 40%)',
  'hsl(280, 67%, 54%)',
];

export function categoryColorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 997;
  return PALETTE[h % PALETTE.length];
}

export function categoryColorSemanticOrHash(name: string): string {
  const n = name.toLowerCase();
  if (/market|migros|bim|a101|şok|sok|grocery|bakkal/i.test(n)) return 'hsl(221, 83%, 53%)';
  if (/yemek|gıda|gida|restoran|kahve|food|içecek|icecek/i.test(n)) return 'hsl(32, 95%, 44%)';
  if (/ulaşım|ulasim|taksi|metro|benzin|otobüs|otobus|transport/i.test(n)) return 'hsl(142, 71%, 45%)';
  if (/sağlık|saglik|eczane|ilaç|ilac/i.test(n)) return 'hsl(340, 82%, 52%)';
  if (/eğlence|eglence|sinema|oyun|hobi/i.test(n)) return 'hsl(262, 83%, 58%)';
  return categoryColorForName(name);
}

/** Web `--chart-*` (cyan ailesi); moda göre hex dilim renkleri */
export function categoryColorHexSemanticOrHash(name: string, isDark: boolean): string {
  const chart = getChartPalette(isDark);
  const n = name.toLowerCase();
  if (/market|migros|bim|a101|şok|sok|grocery|bakkal/i.test(n)) return chart[0]!;
  if (/yemek|gıda|gida|restoran|kahve|food|içecek|icecek/i.test(n)) return chart[3]!;
  if (/ulaşım|ulasim|taksi|metro|benzin|otobüs|otobus|transport/i.test(n)) return chart[2]!;
  if (/sağlık|saglik|eczane|ilaç|ilac/i.test(n)) return chart[1]!;
  if (/eğlence|eglence|sinema|oyun|hobi/i.test(n)) return chart[4]!;
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 997;
  return chart[h % chart.length]!;
}
