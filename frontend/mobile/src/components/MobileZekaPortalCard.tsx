import { View, Text, Pressable, StyleSheet, DeviceEventEmitter } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface MobileZekaPortalCardProps {
  message: string;
  budgetStress: boolean;
  isDark: boolean;
}

/** Web ZekaPortalCard ile aynı rol; Lucide `Bot` ile uyumlu silüet için `robot` (dolu). */
export function MobileZekaPortalCard({ message, budgetStress, isDark }: MobileZekaPortalCardProps) {
  const fg = isDark ? '#f8fafc' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(15, 20, 25, 0.82)' : 'rgba(255, 255, 255, 0.4)';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)';

  const ringBorder = budgetStress
    ? isDark
      ? 'rgba(251, 146, 60, 0.5)'
      : 'rgba(251, 146, 60, 0.48)'
    : isDark
      ? 'rgba(45, 212, 191, 0.48)'
      : 'rgba(45, 212, 191, 0.42)';

  const glow = budgetStress ? 'rgba(251, 146, 60, 0.38)' : 'rgba(45, 212, 191, 0.38)';
  const iconColor = isDark ? '#5eead4' : '#14b8a6';

  function openAssistant() {
    DeviceEventEmitter.emit('ruswallet-chat-open', { message: '' });
  }

  return (
    <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
      <Text style={[styles.portalLabel, { color: muted }]}>ZEKA PORTALI</Text>

      <View style={styles.auraWrap}>
        <View style={[styles.ringOuter, { borderColor: ringBorder, shadowColor: glow }]}>
          <Pressable
            onPress={openAssistant}
            style={({ pressed }) => [
              styles.botBtn,
              {
                borderColor: ringBorder,
                opacity: pressed ? 0.92 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            accessibilityLabel="AI sohbet panelini aç"
          >
            <MaterialCommunityIcons name="robot" size={58} color={iconColor} />
          </Pressable>
        </View>
      </View>

      <Text style={[styles.message, { color: fg }]}>{message}</Text>
      <Text style={[styles.sub, { color: muted }]}>
        Asistana dokun — sohbet veya hızlı sorular; panelde ses, metin ve fiş kısayolu da var.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  portalLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 3.5, marginBottom: 20 },
  auraWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: 200,
    height: 200,
  },
  ringOuter: {
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 10,
  },
  botBtn: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
  },
  message: { fontSize: 17, fontWeight: '500', textAlign: 'center', lineHeight: 24, maxWidth: 400, paddingHorizontal: 4 },
  sub: { fontSize: 11, textAlign: 'center', marginTop: 12, lineHeight: 16, maxWidth: 340, paddingHorizontal: 8 },
});
