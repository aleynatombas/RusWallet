import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthComparisonBarsProps {
  thisMonthExpense: number;
  lastMonthExpense: number;
}

export function MonthComparisonBars({ thisMonthExpense, lastMonthExpense }: MonthComparisonBarsProps) {
  const data = [
    { ad: 'Bu ay', harcama: Math.round(thisMonthExpense * 100) / 100 },
    { ad: 'Geçen ay', harcama: Math.round(lastMonthExpense * 100) / 100 },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Bu ay vs. geçen ay</CardTitle>
        <CardDescription>Toplam gider karşılaştırması (takvim ayına göre).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="ad" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
              <Tooltip
                formatter={(value) => [`${Number(value ?? 0).toFixed(2)} TL`, 'Gider']}
                contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
              />
              <Bar dataKey="harcama" radius={[6, 6, 0, 0]} name="Toplam gider">
                {data.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-1))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
