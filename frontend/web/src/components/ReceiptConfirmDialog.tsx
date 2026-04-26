import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ReceiptExtractResponse } from '@/types/receipt';

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateInputToIso(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  const d = new Date(dateStr + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

interface ReceiptConfirmDialogProps {
  open: boolean;
  data: ReceiptExtractResponse | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    amount: number;
    transactionDateIso: string;
    description: string;
    categoryId: number;
    isIncome: boolean;
  }) => void;
}

export function ReceiptConfirmDialog({
  open,
  data,
  submitting,
  onClose,
  onConfirm,
}: ReceiptConfirmDialogProps) {
  const [amount, setAmount] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [place, setPlace] = useState('');
  const [isIncome, setIsIncome] = useState(false);

  useEffect(() => {
    if (!data) return;
    const ext = data.extraction;
    setAmount(ext.totalAmount > 0 ? String(ext.totalAmount).replace('.', ',') : '');
    const fallbackDate = toDateInputValue(new Date().toISOString());
    setDateStr(toDateInputValue(ext.transactionDate ?? undefined) || fallbackDate);
    setPlace(ext.vendorName?.trim() || '');
    setIsIncome(data.suggestedIsIncome);
  }, [data]);

  if (!open || !data) return null;

  const isVoice = data.source === 'voice';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    const n = parseFloat(amount.replace(',', '.'));
    if (Number.isNaN(n) || n <= 0) return;
    const desc = place.trim() || (isVoice ? 'Sesli işlem' : 'Fiş');
    const fullDesc = isVoice
      ? /^ses:/i.test(desc)
        ? desc
        : `Ses: ${desc}`
      : /^fiş/i.test(desc)
        ? desc
        : `Fiş: ${desc}`;
    const categoryId =
      isIncome === data.suggestedIsIncome ? data.suggestedCategoryId : 0;
    onConfirm({
      amount: n,
      transactionDateIso: dateInputToIso(dateStr),
      description: fullDesc,
      categoryId,
      isIncome,
    });
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[210] bg-black/50"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-dialog-title"
        className="fixed left-1/2 top-1/2 z-[211] w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 text-card-foreground shadow-elevation-xl dark:shadow-2xl"
      >
        <h2 id="receipt-dialog-title" className="text-lg font-semibold leading-none">
          {isVoice ? 'Sesli işlem' : 'Fiş bilgileri'}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isVoice
            ? 'Algılanan metni ve tutarı kontrol edin; onaylayınca işlem bugünün tarihiyle kaydedilir.'
            : 'Tutarı ve yeri kontrol edin; uygunsa onaylayın. Kayıt tarihi, hızlı işlemde olduğu gibi onay anındaki tarih/saat ile oluşturulur (bu ay grafiği ve özetle uyumlu).'}
        </p>

        {isVoice && data.extraction.rawText ? (
          <div className="mt-4 space-y-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-left text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Algılanan konuşma
            </p>
            <p className="whitespace-pre-wrap text-foreground">{data.extraction.rawText}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receipt-amount">Tutar (TL)</Label>
            <Input
              id="receipt-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receipt-date">Tarih</Label>
            <Input
              id="receipt-date"
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receipt-place">{isVoice ? 'Açıklama (düzenlenebilir)' : 'Yer / işletme'}</Label>
            <Input
              id="receipt-place"
              placeholder={isVoice ? 'örn. Kahve' : 'örn. Market adı'}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label>İşlem türü</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={isIncome ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsIncome(true)}
              >
                Gelir
              </Button>
              <Button
                type="button"
                variant={!isIncome ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsIncome(false)}
              >
                Gider
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {isVoice
                ? 'Metin ve AI önerisine göre seçildi; gerekirse değiştirin.'
                : 'Fiş metnine ve AI önerisine göre seçildi; gerekirse değiştirin.'}
            </p>
          </div>
          <div className="space-y-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Önerilen kategori</p>
            <p className="font-medium text-foreground">{data.suggestedCategoryName || 'Diğer'}</p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Kaydediliyor…' : 'Onayla'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
