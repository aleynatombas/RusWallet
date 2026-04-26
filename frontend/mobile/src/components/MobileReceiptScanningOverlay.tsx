/**
 * Web ReceiptScanningOverlay ile aynı metin ve düzen (ortada kart + dönen gösterge).
 */
import { Modal, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

interface MobileReceiptScanningOverlayProps {
  open: boolean;
  /** Varsayılan: fiş OCR metinleri */
  title?: string;
  hint?: string;
}

export function MobileReceiptScanningOverlay({
  open,
  title = 'Tarama yapılıyor…',
  hint = 'Fişiniz işleniyor, lütfen bekleyin.',
}: MobileReceiptScanningOverlayProps) {
  const theme = useTheme();

  return (
    <Modal visible={open} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop} accessibilityLiveRegion="polite">
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>
          <Text style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>{hint}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    width: '100%',
    height: '100%',
  },
  card: {
    alignItems: 'center',
    gap: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 40,
    paddingVertical: 32,
    maxWidth: 360,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  title: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  hint: { fontSize: 12, textAlign: 'center', maxWidth: 280, lineHeight: 18 },
});
