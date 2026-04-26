import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthBucket } from '@/lib/monthlyExpenseBuckets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ForecastTrendChartProps {
  buckets: MonthBucket[];
  forecastAmount: number;
  forecastMonthLabel: string;
  predictionMessage?: string | null;
}

export function ForecastTrendChart({
  buckets,
  forecastAmount,
  forecastMonthLabel,
  predictionMessage,
}: ForecastTrendChartProps) {
  const chartData: { name: string; gercek: number | null; tahmin: number | null }[] = buckets.map((b) => ({
    name: b.label,
    gercek: b.total,
    tahmin: null as number | null,
  }));

  if (chartData.length > 0) {
    const lastIdx = chartData.length - 1;
    const lastTotal = buckets[buckets.length - 1]?.total ?? 0;
    chartData[lastIdx] = { ...chartData[lastIdx], tahmin: lastTotal };
  }
  chartData.push({
    name: forecastMonthLabel,
    gercek: null,
    tahmin: forecastAmount,
  });

  const hasAny = buckets.some((b) => b.total > 0) || forecastAmount > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gelecek ay harcama tahmini</CardTitle>
        <CardDescription>
          Gerçekleşen aylık toplamlar düz çizgi; modelin öngördüğü gelecek ay kesik çizgi ile bağlanır.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasAny ? (
          <>
            <div className="h-[300px] w-full sm:h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={56} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${Number(v).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
                  />
                  <Tooltip
                    formatter={(value) => {
                      const v = Number(value ?? 0);
                      return `${v.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
                    }}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="gercek"
                    name="Gerçekleşen (aylık)"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="tahmin"
                    name="Tahmin (gelecek ay)"
                    stroke="hsl(var(--chart-4))"
                    strokeWidth={2.5}
                    strokeDasharray="7 5"
                    dot={{ r: 4 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {predictionMessage ? <p className="mt-4 text-sm text-muted-foreground">{predictionMessage}</p> : null}
          </>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">Henüz yeterli gider verisi yok.</p>
        )}
      </CardContent>
    </Card>
  );
}
