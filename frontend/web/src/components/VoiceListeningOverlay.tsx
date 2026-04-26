import { Loader2 } from 'lucide-react';

interface VoiceListeningOverlayProps {
  open: boolean;
  /** Sunucuya gönderilirken kısa mesaj */
  mode?: 'listen' | 'parse';
}

/** Mikrofon dinlenirken veya metin işlenirken tam ekran örtü */
export function VoiceListeningOverlay({ open, mode = 'listen' }: VoiceListeningOverlayProps) {
  if (!open) return null;

  const title = mode === 'parse' ? 'İşleniyor…' : 'Dinleniyor…';
  const hint =
    mode === 'parse'
      ? 'Cümleniz tutar ve kategoriye çevriliyor.'
      : 'Cümlenizi bitirince durur; ardından metin sunucuya gönderilir.';

  return (
    <div
      className="fixed inset-0 z-[205] flex items-center justify-center bg-black/40"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-card px-10 py-8 text-center shadow-elevation-xl dark:shadow-2xl">
        <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden />
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
