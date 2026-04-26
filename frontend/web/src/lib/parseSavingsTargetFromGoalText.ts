/**
 * Hedef cümlesinden olası birikim tutarını çıkarır (örn. "400.000", "1.250.000", "500000").
 */
export function parseSavingsTargetFromGoalText(text: string): number | null {
  const t = text.trim();
  if (!t) return null;

  const withDots = t.match(/\d{1,3}(?:\.\d{3})+(?:,\d+)?/g);
  if (withDots) {
    let best: number | null = null;
    for (const raw of withDots) {
      const base = raw.split(',')[0].replace(/\./g, '');
      const n = parseInt(base, 10);
      if (!Number.isNaN(n) && n >= 10_000) {
        if (best == null || n > best) best = n;
      }
    }
    if (best != null) return best;
  }

  const longDigits = t.match(/\d{5,}/g);
  if (longDigits) {
    const n = Math.max(...longDigits.map((x) => parseInt(x, 10)));
    if (!Number.isNaN(n) && n >= 10_000) return n;
  }

  return null;
}
