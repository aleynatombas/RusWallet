import { categoryColorForName } from '@/lib/categoryColor';
import { formatExpenseCategoryLabel } from '@/lib/formatExpenseCategoryLabel';

export interface DonutSlice {
  name: string;
  value: number;
}

interface CategoryDonutChartProps {
  slices: DonutSlice[];
  className?: string;
}

/** Pasta (donut) — conic-gradient + merkez maskesi. */
export function CategoryDonutChart({ slices, className }: CategoryDonutChartProps) {
  const total = slices.reduce((s, x) => s + x.value, 0);

  if (total <= 0 || slices.length === 0) {
    return (
      <div
        className={`flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground ${className ?? ''}`}
      >
        <p>Bu ay henüz gider kaydı yok veya tutarlar henüz kategorilere yansımadı.</p>
        <p className="mt-1 text-xs">
          Gelir (maaş vb.) pasta grafiğine dahil edilmez. Gider ekledikçe grafik güncellenir.
        </p>
      </div>
    );
  }

  let acc = 0;
  const parts: string[] = [];
  for (const slice of slices) {
    const pct = (slice.value / total) * 100;
    const start = acc;
    acc += pct;
    const color = categoryColorForName(slice.name);
    parts.push(`${color} ${start}% ${acc}%`);
  }
  const gradient = `conic-gradient(from -90deg, ${parts.join(', ')})`;

  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center ${className ?? ''}`}>
      <div className="relative mx-auto h-52 w-52 shrink-0">
        <div
          className="h-full w-full rounded-full shadow-inner"
          style={{ background: gradient }}
        />
        <div className="absolute inset-[32%] flex flex-col items-center justify-center rounded-full bg-background text-center shadow-elevation dark:shadow-sm">
          <span className="text-sm font-semibold tabular-nums leading-tight text-foreground">
            {total.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-muted-foreground">TL gider</span>
        </div>
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
        {slices.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: categoryColorForName(s.name) }}
              />
              <span className="truncate">{formatExpenseCategoryLabel(s.name)}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {((s.value / total) * 100).toFixed(0)}% · {s.value.toFixed(2)} TL
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
