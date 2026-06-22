/**
 * Web ReceiptConfirmDialog ile aynı alanlar ve metinler.
 */
import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, TextInput, useTheme } from 'react-native-paper';
import type { ReceiptExtractResponse } from '../types/receipt';

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

export interface MobileReceiptConfirmDialogProps {
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

export function MobileReceiptConfirmDialog({
  open,
  data,
  submitting,
  onClose,
  onConfirm,
}: MobileReceiptConfirmDialogProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [amount, setAmount] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [place, setPlace] = useState('');
  const [isIncome, setIsIncome] = useState(false);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    const ext = data.extraction;
    setAmount(ext.totalAmount > 0 ? String(ext.totalAmount).replace('.', ',') : '');
    const fallbackDate = toDateInputValue(new Date().toISOString());
    setDateStr(toDateInputValue(ext.transactionDate ?? undefined) || fallbackDate);
    setPlace(ext.vendorName?.trim() || '');
    setIsIncome(data.suggestedIsIncome);
  }, [data]);

  if (!data) return null;

  const isVoice = data.source === 'voice';

  function handleConfirm() {
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
    const categoryId = isIncome === data.suggestedIsIncome ? data.suggestedCategoryId : 0;
    onConfirm({
      amount: n,
      transactionDateIso: dateInputToIso(dateStr),
      description: fullDesc,
      categoryId,
      isIncome,
    });
  }

  const mutedBox = {
    backgroundColor: theme.colors.surfaceVariant,
    borderColor: theme.colors.outline,
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} disabled={submitting} accessibilityLabel="Kapat" />
        <KeyboardAvoidingView
          style={[
            styles.center,
            {
              justifyContent: keyboardHeight > 0 ? 'flex-end' : 'center',
              paddingBottom: keyboardHeight > 0 ? Math.max(insets.bottom, 10) + 8 : 12,
            },
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 12}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.dialog,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <Text style={[styles.h2, { color: theme.colors.onSurface }]}>Fiş bilgileri</Text>
            <Text style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>
              Tutarı ve yeri kontrol edin; uygunsa onaylayın. Kayıt tarihi hızlı işlem gibi onay anına
              göre oluşturulur; fişteki tarih alanı yalnızca referans.
            </Text>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              <TextInput
                label="Tutar (TL)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                mode="outlined"
                disabled={submitting}
              />
              <TextInput
                label="Tarih (YYYY-AA-GG)"
                value={dateStr}
                onChangeText={setDateStr}
                mode="outlined"
                placeholder="2025-03-29"
                disabled={submitting}
                autoCapitalize="none"
              />
              <TextInput
                label={isVoice ? 'Açıklama (düzenlenebilir)' : 'Yer / işletme'}
                value={place}
                onChangeText={setPlace}
                mode="outlined"
                placeholder={isVoice ? 'örn. Kahve' : 'örn. Market adı'}
                disabled={submitting}
              />

              <Text style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>İşlem türü</Text>
              <View style={styles.segment}>
                <Button
                  mode={isIncome ? 'contained' : 'outlined'}
                  compact
                  onPress={() => setIsIncome(true)}
                  disabled={submitting}
                  style={styles.segmentBtn}
                >
                  Gelir
                </Button>
                <Button
                  mode={!isIncome ? 'contained' : 'outlined'}
                  compact
                  onPress={() => setIsIncome(false)}
                  disabled={submitting}
                  style={styles.segmentBtn}
                >
                  Gider
                </Button>
              </View>
              <Text style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
                {isVoice
                  ? 'Metin ve AI önerisine göre seçildi; gerekirse değiştirin.'
                  : 'Fiş metnine ve AI önerisine göre seçildi; gerekirse değiştirin.'}
              </Text>

              <View style={[styles.catBox, mutedBox]}>
                <Text style={[styles.catLabel, { color: theme.colors.onSurfaceVariant }]}>
                  ÖNERİLEN KATEGORİ
                </Text>
                <Text style={[styles.catValue, { color: theme.colors.onSurface }]}>
                  {data.suggestedCategoryName || 'Diğer'}
                </Text>
              </View>

              <View style={styles.actions}>
                <Button mode="outlined" onPress={onClose} disabled={submitting} style={styles.actionBtn}>
                  Vazgeç
                </Button>
                <Button
                  mode="contained"
                  onPress={handleConfirm}
                  loading={submitting}
                  disabled={submitting}
                  style={styles.actionBtn}
                >
                  {submitting ? 'Kaydediliyor…' : 'Onayla'}
                </Button>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: 12,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    maxHeight: '88%',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  h2: { fontSize: 18, fontWeight: '600' },
  sub: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  scroll: { marginTop: 16, maxHeight: 440 },
  scrollContent: { gap: 12, paddingBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginTop: 4 },
  segment: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  segmentBtn: { flex: 1, minWidth: 120 },
  hint: { fontSize: 12, lineHeight: 18 },
  catBox: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  catLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, marginBottom: 4 },
  catValue: { fontSize: 15, fontWeight: '500' },
  transcriptBox: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  transcriptText: { fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  actionBtn: { flex: 1, minWidth: 120 },
});
