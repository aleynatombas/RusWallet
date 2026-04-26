import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FutureSelfCardProps {
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export function FutureSelfCard({ balance, monthlyIncome, monthlyExpense }: FutureSelfCardProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [line, setLine] = useState('');
  const [emoji, setEmoji] = useState('🙂');

  async function reveal() {
    setOpen(true);
    setLoading(true);
    setLine('');
    try {
      const { data } = await api.get<{ estimatedAmount: number }>('/Prediction/monthly?period=1month');
      const predictedSpend = Number(data?.estimatedAmount ?? 0);
      const netMonth = monthlyIncome - monthlyExpense;
      const naive30 = balance + netMonth;
      const burn = predictedSpend > 0 ? predictedSpend : monthlyExpense;
      const pessimistic = balance - (burn - monthlyIncome) * 0.5;

      let e = '🙂';
      let msg = '';
      if (naive30 > balance * 1.15 && monthlyIncome > monthlyExpense) {
        e = '🚗';
        msg = `30 gün sonra tahmini bakiye üst seviyede olabilir: yaklaşık ${naive30.toFixed(0)} TL. Lüks hayat modu (caps değil, tahmin!).`;
      } else if (pessimistic < 0 || naive30 < balance * 0.5) {
        e = '🪨';
        msg = `Harcama hızı böyle giderse 30 gün sonra cüzdan “taş çiğneme” moduna yaklaşabilir. Tahmini ~${naive30.toFixed(0)} TL.`;
      } else {
        e = '😎';
        msg = `Gidişat dengeli: 30 gün sonra tahmini bakiye ~${naive30.toFixed(0)} TL civarı (oyuncak model, gerçek finansal tavsiye değil).`;
      }
      setEmoji(e);
      setLine(msg);
    } catch {
      setEmoji('🤷');
      setLine('Tahmin alınamadı; tekrar dene veya analiz sayfasına bak.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="border-dashed border-primary/35 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              30 gün sonraki ben
            </CardTitle>
            <CardDescription>
              Mevcut harcama hızına göre eğlenceli bir “caps” tahmini (AI tahmini + basit projeksiyon).
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => void reveal()}>
            Gelecekten mesaj al
          </Button>
        </CardContent>
      </Card>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Kapat" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-card/95 p-6 shadow-elevation-xl backdrop-blur-xl dark:shadow-2xl">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="text-center text-6xl">{emoji}</p>
            <p className="mt-4 text-center text-lg font-semibold leading-snug text-foreground">
              {loading ? 'Gelecek hesaplanıyor…' : line}
            </p>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Bu ekran eğlence amaçlıdır; yatırım tavsiyesi değildir.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
