const tr = 'tr-TR';

function titleCaseWord(word: string): string {
  const w = word.trim();
  if (!w) return '';
  const lower = w.toLocaleLowerCase(tr);
  return lower.charAt(0).toLocaleUpperCase(tr) + lower.slice(1);
}

export function formatPersonNameSegment(segment: string | null | undefined): string {
  if (!segment?.trim()) return '';
  return segment
    .trim()
    .split(/\s+/)
    .map(titleCaseWord)
    .join(' ');
}

export function formatFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const a = formatPersonNameSegment(firstName);
  const b = formatPersonNameSegment(lastName);
  return [a, b].filter(Boolean).join(' ');
}

/** Web `formatPageTitleDisplay` ile aynı: başlık metni kelime başı büyük (karşılama satırı vb.). */
export function formatGoalTitleDisplay(text: string | null | undefined): string {
  if (!text?.trim()) return '';
  return text
    .trim()
    .split(/\s+/)
    .map(titleCaseWord)
    .join(' ');
}
