/**
 * Web `GlobalVoiceReceiptEntry` ile aynı sorumluluk: layout’ta tek kez mount;
 * ses / fiş → onay diyaloğu → kayıt; olaylar `ruswallet-open-voice` / `ruswallet-open-receipt`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, DeviceEventEmitter } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getApiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ReceiptExtractResponse } from '../types/receipt';
import { getSpeechRecognitionPackage } from '../lib/speechRecognitionSafe';
import { MobileReceiptScanningOverlay } from './MobileReceiptScanningOverlay';
import { MobileReceiptConfirmDialog } from './MobileReceiptConfirmDialog';

/** Web `VoiceListeningOverlay` ile aynı metinler (mode listen | parse). */
const VOICE_LISTEN_TITLE = 'Dinleniyor…';
const VOICE_LISTEN_HINT =
  'Cümlenizi bitirince durur; ardından metin sunucuya gönderilir.';
const VOICE_PARSE_TITLE = 'İşleniyor…';
const VOICE_PARSE_HINT = 'Cümleniz tutar ve kategoriye çevriliyor.';

function MobileGlobalVoiceReceiptContent() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [scanningReceipt, setScanningReceipt] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptExtract, setReceiptExtract] = useState<ReceiptExtractResponse | null>(null);
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);
  const [voiceParsing, setVoiceParsing] = useState(false);
  const [bannerError, setBannerError] = useState('');
  const [voiceListening, setVoiceListening] = useState(false);

  const voiceFinalHandlerRef = useRef<((text: string) => void) | null>(null);
  const lastVoiceTranscriptRef = useRef<string>('');

  function flushVoiceHandlerWithText(text: string) {
    const trimmed = text.trim();
    const fn = voiceFinalHandlerRef.current;
    voiceFinalHandlerRef.current = null;
    lastVoiceTranscriptRef.current = '';
    if (fn && trimmed) fn(trimmed);
  }

  useEffect(() => {
    const pkg = getSpeechRecognitionPackage();
    if (!pkg) return;
    const { ExpoSpeechRecognitionModule } = pkg;

    const subResult = ExpoSpeechRecognitionModule.addListener(
      'result',
      (event: { isFinal: boolean; results: { transcript?: string }[] }) => {
        const raw = event.results[0]?.transcript?.trim() ?? '';
        if (raw) lastVoiceTranscriptRef.current = raw;
        if (!event.isFinal) return;
        if (!raw) return;
        flushVoiceHandlerWithText(raw);
      }
    );
    const subError = ExpoSpeechRecognitionModule.addListener(
      'error',
      (event: { error: string; message?: string }) => {
        // Web `useBrowserSpeechRecognition`: aborted / no-speech sessiz
        if (event.error === 'aborted' || event.error === 'no-speech' || event.error === 'speech-timeout') {
          voiceFinalHandlerRef.current = null;
          lastVoiceTranscriptRef.current = '';
          setVoiceListening(false);
          return;
        }
        setBannerError(
          event.error === 'not-allowed'
            ? 'Mikrofon izni gerekli.'
            : `Ses tanıma: ${event.message ?? event.error}`
        );
        voiceFinalHandlerRef.current = null;
        lastVoiceTranscriptRef.current = '';
        setVoiceListening(false);
      }
    );
    const subStart = ExpoSpeechRecognitionModule.addListener('start', () => setVoiceListening(true));
    const subEnd = ExpoSpeechRecognitionModule.addListener('end', () => {
      setVoiceListening(false);
      if (voiceFinalHandlerRef.current && lastVoiceTranscriptRef.current.trim()) {
        flushVoiceHandlerWithText(lastVoiceTranscriptRef.current);
      } else if (voiceFinalHandlerRef.current) {
        voiceFinalHandlerRef.current = null;
        lastVoiceTranscriptRef.current = '';
        setBannerError('Konuşma algılanamadı. Tutar içeren bir cümle söyleyin (örn. «50 lira kahve»).');
      }
    });

    return () => {
      subResult.remove();
      subError.remove();
      subStart.remove();
      subEnd.remove();
    };
  }, []);

  const uploadReceiptAsset = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    setScanningReceipt(true);
    setBannerError('');
    try {
      const formData = new FormData();
      const name = asset.fileName ?? `receipt_${Date.now()}.jpg`;
      const mime = asset.mimeType ?? 'image/jpeg';
      formData.append('file', { uri: asset.uri, name, type: mime } as unknown as Blob);
      // Web axios zaman aşımı yok; OCR uzun sürebilir
      const { data } = await api.post<ReceiptExtractResponse>('/Receipt/upload', formData, {
        timeout: 0,
      });
      setReceiptExtract(data);
      setReceiptDialogOpen(true);
    } catch (err) {
      setBannerError(getApiErrorMessage(err, 'Fiş okunamadı.'));
    } finally {
      setScanningReceipt(false);
    }
  }, []);

  const launchLibrary = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setBannerError('Fiş seçmek için galeri izni gerekli.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (result.canceled || !result.assets[0]) return;
    await uploadReceiptAsset(result.assets[0]);
  }, [uploadReceiptAsset]);

  const launchCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setBannerError('Fiş çekmek için kamera izni gerekli.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (result.canceled || !result.assets[0]) return;
    await uploadReceiptAsset(result.assets[0]);
  }, [uploadReceiptAsset]);

  const openReceiptPicker = useCallback(() => {
    Alert.alert('Fiş ekle', 'Kaynağı seçin', [
      { text: 'Galeri', onPress: () => void launchLibrary() },
      { text: 'Kamera', onPress: () => void launchCamera() },
      { text: 'İptal', style: 'cancel' },
    ]);
  }, [launchCamera, launchLibrary]);

  const runVoiceFlow = useCallback(() => {
    const pkg = getSpeechRecognitionPackage();
    if (!pkg) {
      setBannerError(
        'Bu ortamda ses tanıma yok (Expo Go / eksik yerel modül). Web’de Chrome veya Edge deneyin; mobilde: npx expo run:android veya run:ios.'
      );
      return;
    }
    const { ExpoSpeechRecognitionModule } = pkg;
    setBannerError('');
    void (async () => {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setBannerError('Mikrofon izni gerekli.');
        return;
      }
      lastVoiceTranscriptRef.current = '';
      voiceFinalHandlerRef.current = (text) => {
        void (async () => {
          setVoiceParsing(true);
          setBannerError('');
          try {
            const { data } = await api.post<ReceiptExtractResponse>(
              '/Receipt/parse-voice',
              { text },
              { timeout: 0 }
            );
            setReceiptExtract(data);
            setReceiptDialogOpen(true);
          } catch (err) {
            setBannerError(getApiErrorMessage(err, 'Ses metni işlenemedi.'));
          } finally {
            setVoiceParsing(false);
          }
        })();
      };
      try {
        ExpoSpeechRecognitionModule.start({
          lang: 'tr-TR',
          interimResults: true,
          continuous: false,
        });
      } catch {
        voiceFinalHandlerRef.current = null;
        setBannerError('Ses tanıma başlatılamadı.');
      }
    })();
  }, []);

  useEffect(() => {
    const s1 = DeviceEventEmitter.addListener('ruswallet-open-receipt', () => {
      openReceiptPicker();
    });
    const s2 = DeviceEventEmitter.addListener('ruswallet-open-voice', () => {
      runVoiceFlow();
    });
    return () => {
      s1.remove();
      s2.remove();
    };
  }, [openReceiptPicker, runVoiceFlow]);

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
      DeviceEventEmitter.emit('ruswallet-transactions-changed');
    } catch (err) {
      setBannerError(getApiErrorMessage(err, 'İşlem eklenemedi.'));
    } finally {
      setReceiptSubmitting(false);
    }
  };

  const voiceOverlayOpen = voiceListening || voiceParsing;
  const voiceTitle = voiceParsing && !voiceListening ? VOICE_PARSE_TITLE : VOICE_LISTEN_TITLE;
  const voiceHint = voiceParsing && !voiceListening ? VOICE_PARSE_HINT : VOICE_LISTEN_HINT;

  return (
    <>
      <MobileReceiptScanningOverlay
        open={scanningReceipt}
        title="Tarama yapılıyor…"
        hint="Fişiniz işleniyor, lütfen bekleyin."
      />
      <MobileReceiptScanningOverlay open={voiceOverlayOpen && !scanningReceipt} title={voiceTitle} hint={voiceHint} />
      <MobileReceiptConfirmDialog
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
        <View
          pointerEvents="box-none"
          style={[styles.bannerWrap, { paddingBottom: Math.max(insets.bottom, 12) + 56 }]}
        >
          <View
            style={[
              styles.banner,
              {
                backgroundColor: theme.dark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)',
                borderColor: theme.dark ? 'rgba(239,68,68,0.45)' : 'rgba(239,68,68,0.35)',
              },
            ]}
            accessibilityRole="alert"
          >
            <Text style={[styles.bannerText, { color: theme.colors.error }]}>{bannerError}</Text>
            <Pressable onPress={() => setBannerError('')} hitSlop={12} accessibilityLabel="Kapat">
              <Text style={[styles.bannerDismiss, { color: theme.colors.error }]}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </>
  );
}

export function MobileGlobalVoiceReceiptEntry() {
  const { token } = useAuth();
  if (!token) return null;
  return <MobileGlobalVoiceReceiptContent />;
}

const styles = StyleSheet.create({
  bannerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 999,
  },
  banner: {
    width: '100%',
    maxWidth: 448,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  bannerText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  bannerDismiss: { fontSize: 12, fontWeight: '600', textAlign: 'center', textDecorationLine: 'underline' },
});
