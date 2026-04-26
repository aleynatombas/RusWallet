/**
 * Web `TransactionsPage`: başlık + ses/fiş + `TransactionsPanel`.
 */
import { View, Text, StyleSheet, DeviceEventEmitter } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { MobileTransactionsPanel } from './MobileTransactionsPanel';

export function MobileTransactionsComponent() {
  const theme = useTheme();
  const fg = theme.colors.onSurface;
  const headerIcon = theme.colors.onSurfaceVariant;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: fg }]}>İşlemlerim</Text>
        <View style={styles.headerActions}>
          <IconButton
            icon="microphone"
            mode="outlined"
            size={22}
            iconColor={headerIcon}
            onPress={() => DeviceEventEmitter.emit('ruswallet-open-voice')}
            accessibilityLabel="Sesle işlem ekle"
          />
          <IconButton
            icon="camera"
            mode="outlined"
            size={22}
            iconColor={headerIcon}
            onPress={() => DeviceEventEmitter.emit('ruswallet-open-receipt')}
            accessibilityLabel="Fiş veya fotoğraf yükle"
          />
        </View>
      </View>
      <View style={styles.panel}>
        <MobileTransactionsPanel />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 8,
  },
  headerActions: { flexDirection: 'row', marginRight: -8 },
  panel: { flex: 1, minHeight: 0, paddingHorizontal: 16 },
  screenTitle: { fontSize: 24, fontWeight: '600', letterSpacing: -0.5, flex: 1 },
});
