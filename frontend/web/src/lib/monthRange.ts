/** Bu ayın başı ve sonu (Transaction API start/end sorgusu için, YYYY-MM-DD). */
export function getCurrentMonthRangeStrings(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const lastDay = new Date(y, m + 1, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    start: `${y}-${pad(m + 1)}-01`,
    end: `${y}-${pad(m + 1)}-${pad(lastDay.getDate())}`,
  };
}

/** Bir önceki tam ay (geçen ay vs. bu ay karşılaştırması için). */
export function getPreviousMonthRangeStrings(): { start: string; end: string } {
  const now = new Date();
  const firstThis = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastPrev = new Date(firstThis.getTime() - 1);
  const y = lastPrev.getFullYear();
  const m = lastPrev.getMonth();
  const lastDay = new Date(y, m + 1, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    start: `${y}-${pad(m + 1)}-01`,
    end: `${y}-${pad(m + 1)}-${pad(lastDay.getDate())}`,
  };
}
