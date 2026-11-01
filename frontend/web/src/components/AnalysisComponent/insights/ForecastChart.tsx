import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ForecastSeriesPointDto } from '@/types/smartInsights';
import { fmtTry } from './InsightCardShell';

interface Row {
  label: string;
  actual: number | null;
  forecast: number | null;
  band: [number, number] | null;
  kind: ForecastSeriesPointDto['kind'];
  mtd: number | null;
}

/**
 * Gerçekleşen aylar düz çizgi, tahmin (bu ay sonu + gelecek ay) kesikli çizgi, tahmin aralığı gölgeli alan.
 * Kesikli çizgi son tamamlanmış aydan başlar ki iki seri görsel olarak birleşsin.
 */
export function toForecastRows(series: ForecastSeriesPointDto[]): Row[] {
  const lastCompleteIdx = series.map((p) => p.kind).lastIndexOf('complete');
  return series.map((p, i) => {
    const isConnector = i === lastCompleteIdx && series.some((s) => s.kind !== 'complete' && s.forecast != null);
    if (p.kind === 'complete') {
      return {
        label: p.label,
        actual: p.actual,
        forecast: isConnector ? p.actual : null,
        band: isConnector && p.actual != null ? [p.actual, p.actual] : null,
        kind: p.kind,
        mtd: null,
      };
    }
    const f = p.forecast;
    return {
      label: p.label,
      actual: null,
      forecast: f,
      band: f == null ? null : [p.lower ?? f, p.upper ?? f],
      kind: p.kind,
      mtd: p.kind === 'current' ? p.actual : null,
    };
  });
}

export function ForecastChart({ series, compact = false }: { series: ForecastSeriesPointDto[]; compact?: boolean }) {
  const rows = toForecastRows(series);
  const values = rows.flatMap((r) => [r.actual, r.forecast, r.band?.[0], r.band?.[1]]).filter((v): v is number => v != null);
  const max = values.length ? Math.max(...values) : 1;
  const min = values.length ? Math.min(...values) : 0;
  const pad = Math.max((max - min) * 0.15, max * 0.05, 1);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={rows} margin={{ left: compact ? 0 : 8, right: compact ? 10 : 24, top: 6, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          interval={compact ? 'preserveStartEnd' : 0}
          tick={{ fontSize: compact ? 9 : 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          hide={compact}
          domain={[Math.max(0, min - pad), max + pad]}
          tickFormatter={(v: number) => `${Math.round(v / 1000)}B`}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={<ForecastTooltip />} cursor={{ stroke: 'hsl(var(--border))' }} />
        <Area
          dataKey="band"
          stroke="none"
          fill="hsl(var(--primary))"
          fillOpacity={0.12}
          isAnimationActive={false}
          connectNulls
        />
        <Line
          dataKey="actual"
          stroke="hsl(var(--foreground))"
          strokeOpacity={0.75}
          strokeWidth={2}
          dot={{ r: compact ? 0 : 3 }}
          isAnimationActive={false}
          connectNulls={false}
        />
        <Line
          dataKey="forecast"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={{ r: compact ? 2 : 4, fill: 'hsl(var(--primary))' }}
          isAnimationActive={false}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function ForecastTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-[11px] text-popover-foreground shadow-elevation-lg">
      <p className="mb-0.5 font-semibold">{r.label}</p>
      {r.kind === 'complete' ? <p>Gerçekleşen: {fmtTry(r.actual)}</p> : null}
      {r.kind === 'current' ? (
        <>
          <p>Bugüne kadar: {fmtTry(r.mtd)}</p>
          <p className="text-primary">Ay sonu tahmini: {fmtTry(r.forecast)}</p>
        </>
      ) : null}
      {r.kind === 'forecast' ? (
        <>
          <p className="text-primary">Tahmin: {fmtTry(r.forecast)}</p>
          {r.band ? (
            <p className="text-muted-foreground">
              Aralık: {fmtTry(r.band[0])} – {fmtTry(r.band[1])}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function ForecastLegend() {
  return (
    <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <span className="h-0.5 w-3 rounded bg-foreground/70" /> Gerçekleşen
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-0 w-3 border-t-2 border-dashed border-primary" /> Tahmin
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-3 rounded-sm bg-primary/15" /> Aralık
      </span>
    </div>
  );
}
