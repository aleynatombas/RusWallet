/**
 * Donut — tek tonda (~192–196°); ayrım çoğunlukla parlaklık: koyu ↔ çok açık yan yana.
 */
const PALETTE = [
  'hsl(193, 46%, 40%)',
  'hsl(195, 36%, 78%)',
  'hsl(192, 44%, 48%)',
  'hsl(196, 34%, 74%)',
  'hsl(194, 42%, 54%)',
  'hsl(195, 30%, 84%)',
  'hsl(192, 48%, 44%)',
  'hsl(196, 38%, 64%)',
];

export function categoryColorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 997;
  return PALETTE[h % PALETTE.length];
}

/** Analiz / pastel dilimler — aynı hue ailesi, daha açık tonlar */
export function pastelColorForSlice(name: string, index: number): string {
  const soft = [
    'hsl(193, 22%, 92%)',
    'hsl(195, 18%, 86%)',
    'hsl(192, 24%, 90%)',
    'hsl(196, 16%, 88%)',
    'hsl(194, 20%, 84%)',
    'hsl(195, 14%, 94%)',
    'hsl(192, 18%, 82%)',
    'hsl(196, 20%, 90%)',
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 3)) % 997;
  return soft[(h + index) % soft.length];
}

/** Bilinen kategoriler: hepsi aynı paletten farklı indeks (çok renk yok) */
export function categoryColorSemanticOrHash(name: string): string {
  const n = name.toLowerCase();
  if (/market|migros|bim|a101|şok|sok|grocery|bakkal/i.test(n)) return PALETTE[0];
  if (/yemek|gıda|gida|restoran|kahve|food|içecek|icecek/i.test(n)) return PALETTE[1];
  if (/ulaşım|ulasim|taksi|metro|benzin|otobüs|otobus|transport/i.test(n)) return PALETTE[2];
  if (/sağlık|saglik|eczane|ilaç|ilac/i.test(n)) return PALETTE[3];
  if (/eğlence|eglence|sinema|oyun|hobi/i.test(n)) return PALETTE[4];
  return categoryColorForName(name);
}
