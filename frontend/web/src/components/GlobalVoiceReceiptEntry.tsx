import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/services/api';
import type { ReceiptExtractResponse } from '@/types/receipt';
import { ReceiptConfirmDialog } from '@/components/ReceiptConfirmDialog';
import { ReceiptScanningOverlay } from '@/components/ReceiptScanningOverlay';
import { VoiceListeningOverlay } from '@/components/VoiceListeningOverlay';
import { useBrowserSpeechRecognition } from '@/lib/useBrowserSpeechRecognition';

const CHANGED = 'ruswallet-transactions-changed';

/** parse-voice 400 vb. teknik ayrıntı yerine gösterilir */
const VOICE_PARSE_ERROR_USER =
  'Sesi algılayamadım. Tekrar deneyin.';

function dispatchTransactionsChanged() {
  window.dispatchEvent(new Event(CHANGED));
}

/**
 * Sohbet üstünden ve sayfa olaylarından ses/fiş ile işlem: dinle veya fiş yükle → onay modalı (düzenlenebilir) → kayıt.
 * MainLayout’ta tek kez mount edilir.
 */
export function GlobalVoiceReceiptEntry() {
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [scanningReceipt, setScanningReceipt] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptExtract, setReceiptExtract] = useState<ReceiptExtractResponse | null>(null);
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);
  const [voiceParsing, setVoiceParsing] = useState(false);
  const [bannerError, setBannerError] = useState('');

  const { supported: voiceSupported, listening: voiceListening, error: speechError, listenOnce } =
    useBrowserSpeechRecognition();

  useEffect(() => {
    if (speechError) setBannerError(speechError);
  }, [speechError]);

  const runVoiceFlow = useCallback(() => {
    if (!voiceSupported) {
      setBannerError('Bu tarayıcıda ses tanıma yok (Chrome veya Edge deneyin).');
      return;
    }
    setBannerError('');
    listenOnce(async (text) => {
      setVoiceParsing(true);
      setBannerError('');
      try {
        const { data } = await api.post<ReceiptExtractResponse>('/Receipt/parse-voice', { text });
        setReceiptExtract(data);
        setReceiptDialogOpen(true);
      } catch {
        setBannerError(VOICE_PARSE_ERROR_USER);
      } finally {
        setVoiceParsing(false);
      }
    });
  }, [listenOnce, voiceSupported]);

  const openReceiptPicker = useCallback(() => {
    receiptInputRef.current?.click();
  }, []);

  useEffect(() => {
    window.addEventListener('ruswallet-open-voice', runVoiceFlow);
    window.addEventListener('ruswallet-open-receipt', openReceiptPicker);
    return () => {
      window.removeEventListener('ruswallet-open-voice', runVoiceFlow);
      window.removeEventListener('ruswallet-open-receipt', openReceiptPicker);
    };
  }, [runVoiceFlow, openReceiptPicker]);

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setScanningReceipt(true);
    setBannerError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<ReceiptExtractResponse>('/Receipt/upload', formData);
      setReceiptExtract(data);
      setReceiptDialogOpen(true);
    } catch (err: unknown) {
      setBannerError(err instanceof Error ? err.message : 'Fiş okunamadı.');
    } finally {
      setScanningReceipt(false);
    }
  };

  const handleReceiptConfirm = async (payload: {
    amount: number;
    transactionDateIso: string;
    description: string;
    categoryId: number;
    isIncome: boolean;
  }) => {
    setReceiptSubmitting(true);
    setBannerError('');
    try {
      await api.post('/Transaction/add', {
        amount: payload.amount,
        description: payload.description,
        transactionDate: new Date().toISOString(),
        isIncome: payload.isIncome,
        categoryId: payload.categoryId,
      });
      setReceiptDialogOpen(false);
      setReceiptExtract(null);
      dispatchTransactionsChanged();
    } catch (err: unknown) {
      setBannerError(err instanceof Error ? err.message : 'İşlem eklenemedi.');
    } finally {
      setReceiptSubmitting(false);
    }
  };

  return (
    <>
      <input
        ref={receiptInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/bmp"
        className="sr-only"
        tabIndex={-1}
        onChange={handleReceiptFileChange}
        aria-hidden
      />
      <ReceiptScanningOverlay open={scanningReceipt} />
      <VoiceListeningOverlay
        open={voiceListening || voiceParsing}
        mode={voiceParsing && !voiceListening ? 'parse' : 'listen'}
      />
      <ReceiptConfirmDialog
        open={receiptDialogOpen}
        data={receiptExtract}
        submitting={receiptSubmitting}
        onClose={() => {
          if (!receiptSubmitting) {
            setReceiptDialogOpen(false);
            setReceiptExtract(null);
          }
        }}
        onConfirm={(p) => void handleReceiptConfirm(p)}
      />
      {bannerError ? (
        <button
          type="button"
          className="fixed bottom-24 left-1/2 z-[200] w-[min(100%-2rem,28rem)] -translate-x-1/2 cursor-pointer rounded-lg border border-destructive/40 bg-destructive/15 px-4 py-3 text-center text-sm text-destructive shadow-lg backdrop-blur-sm dark:bg-destructive/25"
          role="alert"
          title="Kapat"
          onClick={() => setBannerError('')}
        >
          {bannerError}
        </button>
      ) : null}
    </>
  );
}
