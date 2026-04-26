const tr = 'tr-TR';

function titleCaseWord(word: string): string {
  const w = word.trim();
  if (!w) return '';
  const lower = w.toLocaleLowerCase(tr);
  return lower.charAt(0).toLocaleUpperCase(tr) + lower.slice(1);
}

/** Tek kelime veya birden fazla kelimelik ad/soyad: Türkçe baş harf büyük (örn. aleyna → Aleyna, tombaş → Tombaş). */
export function formatPersonNameSegment(segment: string | null | undefined): string {
  if (!segment?.trim()) return '';
  return segment
    .trim()
    .split(/\s+/)
    .map(titleCaseWord)
    .join(' ');
}

/** Ad + soyad birlikte (navbar, karşılama metni). */
export function formatFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const a = formatPersonNameSegment(firstName);
  const b = formatPersonNameSegment(lastName);
  return [a, b].filter(Boolean).join(' ');
}

/** Finans hedefi metni: her kelime Türkçe baş harf büyük (örn. askere gitmek → Askere Gitmek). */
export function formatGoalTitleDisplay(text: string | null | undefined): string {
  if (!text?.trim()) return '';
  return text
    .trim()
    .split(/\s+/)
    .map(titleCaseWord)
    .join(' ');
}
