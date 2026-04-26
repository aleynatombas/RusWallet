import { formatPageTitleDisplay } from '@/lib/pageTitle';

interface MonthOverMonthDeltaBadgeProps {
  percentChangeVsPreviousMonth: number | null;
  hasComparableData: boolean;
}

/** Geçen aya göre yüzde farkı; giderde artış = uyarı rengi. */
export function MonthOverMonthDeltaBadge({
  percentChangeVsPreviousMonth: pct,
  hasComparableData,
}: MonthOverMonthDeltaBadgeProps) {
  if (!hasComparableData) {
    return (
      <span className="text-[8px] font-medium text-muted-foreground">
        {formatPageTitleDisplay('Kayıt az')}
      </span>
    );
  }
  if (pct == null) {
    return (
      <span className="text-[8px] font-medium text-muted-foreground">
        {formatPageTitleDisplay('Önceki ay için veri yok')}
      </span>
    );
  }

  const abs = Math.abs(pct);
  const formatted = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(abs);
  const worse = pct > 2;
  const better = pct < -2;
  const arrow = pct >= 0 ? '↑' : '↓';

  return (
    <span
      className={
        worse
          ? 'text-[9px] font-semibold tabular-nums text-rose-400'
          : better
            ? 'text-[9px] font-semibold tabular-nums text-primary'
            : 'text-[9px] font-medium tabular-nums text-muted-foreground'
      }
    >
      {arrow} %{formatted}
    </span>
  );
}
