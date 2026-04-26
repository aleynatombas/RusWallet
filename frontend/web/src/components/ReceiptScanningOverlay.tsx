import { Loader2 } from 'lucide-react';

interface ReceiptScanningOverlayProps {
  open: boolean;
}

/** Fiş OCR sırasında ekran ortasında tam ekran örtü + animasyon */
export function ReceiptScanningOverlay({ open }: ReceiptScanningOverlayProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[205] flex items-center justify-center bg-black/40"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-10 py-8 text-center shadow-elevation-xl dark:shadow-2xl">
        <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden />
        <p className="text-base font-semibold text-foreground">Tarama yapılıyor…</p>
        <p className="max-w-xs text-xs text-muted-foreground">Fişiniz işleniyor, lütfen bekleyin.</p>
      </div>
    </div>
  );
}
