import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthBucket } from '@/lib/monthlyExpenseBuckets';
import type { AnomalyAlert } from '@/types/prediction';
import { cn } from '@/lib/utils';

interface SpendingTrajectoryChartProps {
  buckets: MonthBucket[];
  thisMonthExpenseMtd: number;
  projectedMonthEnd: number;
  /** Harcama anomalisi varsa Bugün noktası kırmızı vurgulanır. */
  anomalies?: AnomalyAlert[];
  /** Üst başlık üst kartta verildiğinde gizlenir. */
  embedded?: boolean;
  className?: string;
}

/**
 * Üç durak: dönem başı, bugün (MTD), ay sonu tahmini. Anomali varsa Bugün kırmızı işaretlenir.
 */
export function SpendingTrajectoryChart({
  buckets,
  thisMonthExpenseMtd,
  projectedMonthEnd,
  anomalies = [],
  embedded = false,
  className,
}: SpendingTrajectoryChartProps) {
  const hist = buckets.length > 1 ? buckets.slice(0, -1) : [];
  const firstAnchor = hist.length > 0 ? hist[0].total : buckets[0]?.total ?? 0;

  const mtd = Math.round(thisMonthExpenseMtd * 100) / 100;
  const proj = Math.round(projectedMonthEnd * 100) / 100;
  const start = Math.round(firstAnchor * 100) / 100;

  const hasAnomaly = anomalies.length > 0;

  const data: { name: string; gercek: number | null; tahmin: number | null }[] = [
    { name: 'Başlangıç', gercek: start, tahmin: null },
    { name: 'Bugün', gercek: mtd, tahmin: mtd },
    { name: 'Ay sonu (tahmin)', gercek: null, tahmin: proj },
  ];

  const hasAny = data.some((d) => (d.gercek ?? 0) > 0 || (d.tahmin ?? 0) > 0);

  return (
    <section className={cn('flex h-full min-h-0 flex-col', className)}>
      {!embedded ? (
        <div className="shrink-0 pb-3">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Harcama projeksiyonu</h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Çizgi: dönem başı → bugün → ay sonu tahmini (günlük tempoya göre).
          </p>
        </div>
      ) : null}
      <div
        className={cn(
          'w-full min-w-0 flex-1 rounded-lg',
          embedded ? 'h-[min(150px,20vh)] min-h-[110px]' : 'min-h-[120px]',
          hasAnomaly && 'ring-2 ring-destructive/35 dark:ring-destructive/30'
        )}
      >
        {hasAny ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                height={36}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${Number(v).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
                width={44}
              />
              <Tooltip
                formatter={(value) => {
                  const v = Number(value ?? 0);
                  return `${v.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
                }}
                contentStyle={{
                  borderRadius: 8,
                  border: 'none',
                  boxShadow: '0 4px 20px hsl(var(--foreground) / 0.08)',
                  background: 'hsl(var(--card))',
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="line" />
              <Line
                type="monotone"
                dataKey="gercek"
                name="Gerçekleşen"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 0 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="tahmin"
                name="Tahmin"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={{ r: 4, strokeWidth: 0 }}
                connectNulls
              />
              {hasAnomaly ? (
                <ReferenceDot
                  x="Bugün"
                  y={mtd}
                  r={7}
                  fill="hsl(var(--destructive))"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center py-6 text-center text-sm text-muted-foreground">
            Gider verisi yetersiz.
          </p>
        )}
      </div>
      <p className="mt-1.5 text-[9px] leading-snug text-muted-foreground sm:text-[10px]">
        {hasAnomaly ? (
          <span className="text-destructive">
            Bu dönem için anomali işareti var; &quot;Bugün&quot; noktası kırmızıdır ({anomalies.length} kayıt).
          </span>
        ) : (
          <>Anomali tespit edilirse &quot;Bugün&quot; noktası kırmızı yanar ve çerçeve uyarı verir.</>
        )}
      </p>
    </section>
  );
}
