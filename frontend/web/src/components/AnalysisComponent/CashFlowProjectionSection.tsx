import { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TransactionRow } from '@/types/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildCashFlowProjection, estimateDaysUntilBalanceCritical } from '@/lib/buildCashFlowProjection';

interface CashFlowProjectionSectionProps {
  transactions: TransactionRow[];
  balance: number;
}

export function CashFlowProjectionSection({ transactions, balance }: CashFlowProjectionSectionProps) {
  const [spendLessPct, setSpendLessPct] = useState(0);

  const chartRows = useMemo(
    () => buildCashFlowProjection(transactions, spendLessPct),
    [transactions, spendLessPct]
  );

  const rechartsData = useMemo(
    () =>
      chartRows.map((r) => {
        const f = r.forecast;
        const ci = r.forecastCi;
        let forecastLow: number | null = null;
        let bandThickness: number | null = null;
        if (f != null && ci) {
          const low = f - ci[0];
          const high = f + ci[1];
          forecastLow = low;
          bandThickness = Math.max(0, high - low);
        }
        return {
          label: r.label,
          geçmiş: r.history,
          tahmin: f,
          forecastLow,
          bandThickness,
        };
      }),
    [chartRows]
  );

  const risk = useMemo(() => estimateDaysUntilBalanceCritical(balance, transactions), [balance, transactions]);

  const riskMessage = useMemo(() => {
    const d = risk.days;
    if (d != null && d > 0 && d <= 12 && risk.avgDailyExpense > 0 && balance > 0) {
      const n = Math.max(1, Math.ceil(d));
      return `Mevcut trend devam ederse, önümüzdeki ${n} gün içinde bakiye kritik eşiğe düşebilir.`;
    }
    if (d != null && d > 12 && d <= 45 && balance > 0) {
      return `Tahmini bozulma süresi yaklaşık ${Math.ceil(d)} gün. Kaydırıcıyla giderleri kısarak projeksiyondaki tahmin bandını canlı güncelleyebilirsiniz.`;
    }
    if (balance <= 0) {
      return 'Bakiye şu an sıfır veya negatif çizgide; grafik yine de günlük harcama trendinizi ve simülasyonu gösterir.';
    }
    return 'Geçmiş 30 gün düz çizgi; sonraki 30 gün orta tahmin + gölgeli güven bandı. Kaydırıcı: bu ay yüzde kaç daha az harcarsanız senaryo anında işlenir.';
  }, [risk, balance]);

  const hasHistory = chartRows.some((r) => r.history != null && r.history > 0);
  const hasForecast = chartRows.some((r) => r.forecast != null);

  return (
    <Card className="border-border/80">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Nakit akış projeksiyonu</CardTitle>
        <p className="text-sm font-medium text-primary/90">Gelecek simülasyonu — etkileşimli harcama tahmini</p>
        <CardDescription>
          Geçmiş 30 günün günlük harcamaları düz çizgi; sonraki 30 gün tahmini kesik çizgi ve gölgeli güven
          alanı. Kaydırıcı: «Bu ay %10 daha az harcarsam?» senaryosu — tahmin bandı anında güncellenir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-border/70 bg-muted/25 px-4 py-3 text-sm leading-relaxed text-foreground">
          {riskMessage}
        </div>

        <div className="space-y-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <label htmlFor="spend-sim" className="text-xs font-medium text-muted-foreground">
              Simülasyon: bu ay giderleri yüzde ne kadar kısarsam?
            </label>
            <span className="text-sm font-semibold tabular-nums text-primary">{spendLessPct}% daha az</span>
          </div>
          <input
            id="spend-sim"
            type="range"
            min={0}
            max={40}
            step={1}
            value={spendLessPct}
            onChange={(e) => setSpendLessPct(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-primary"
          />
          <p className="text-xs text-muted-foreground">
            Örnek: %10 seçildiğinde gelecek 30 günün günlük tahmini yaklaşık %10 düşer (mevcut trend ve oynaklık
            üzerinden).
          </p>
        </div>

        {!hasHistory && !hasForecast ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Projeksiyon için son dönemde yeterli gider verisi gerekir.
          </p>
        ) : (
          <div className="h-[320px] w-full sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={rechartsData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={4} height={40} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${Number(v).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
                  width={56}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const n = String(name ?? '');
                    if (n === 'Tahmin güven bandı' || n === '') return ['', ''];
                    const v = Number(value ?? 0);
                    if (value == null || Number.isNaN(v)) return ['—', n];
                    return [`${v.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, n];
                  }}
                  labelFormatter={(l) => `Gün: ${l}`}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                    fontSize: 12,
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="forecastLow"
                  stackId="ci"
                  stroke="none"
                  fill="transparent"
                  fillOpacity={0}
                  legendType="none"
                  name=""
                />
                <Area
                  type="monotone"
                  dataKey="bandThickness"
                  stackId="ci"
                  stroke="none"
                  fill="hsl(var(--chart-3))"
                  fillOpacity={0.22}
                  name="Tahmin güven bandı"
                />
                <Line
                  type="monotone"
                  dataKey="geçmiş"
                  name="Geçmiş (günlük harcama)"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="tahmin"
                  name="Tahmin (orta)"
                  stroke="hsl(var(--chart-5))"
                  strokeWidth={2.25}
                  strokeDasharray="6 4"
                  dot={false}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
