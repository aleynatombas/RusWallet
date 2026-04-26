import { View, Text, StyleSheet, Pressable, DeviceEventEmitter } from 'react-native';
import { useTheme } from 'react-native-paper';
import { AnalysisCard } from './AnalysisCard';
import type { AnalysisQaModuleDto } from '../../types/financialRoadmap';
import { useAnalysisPalette } from '../../theme/useAnalysisPalette';

export function MobileKisaSoruCard({ qa }: { qa: AnalysisQaModuleDto }) {
  const theme = useTheme();
  const p = useAnalysisPalette();
  const onPrimary = theme.colors.onPrimary;

  return (
    <AnalysisCard title="Kısa soru" headerBorder>
      <Text style={[styles.question, { color: p.fg }]}>{qa.question}</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() =>
            DeviceEventEmitter.emit('ruswallet-chat-open', { message: qa.chatMessageA, autoSubmit: false })
          }
          style={({ pressed }) => [
            styles.btn,
            styles.btnPrimary,
            { backgroundColor: p.accent, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={[styles.btnPrimaryText, { color: onPrimary }]}>{qa.optionA}</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            DeviceEventEmitter.emit('ruswallet-chat-open', { message: qa.chatMessageB, autoSubmit: false })
          }
          style={({ pressed }) => [
            styles.btn,
            styles.btnOutline,
            { borderColor: p.border, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={[styles.btnOutlineText, { color: p.fg }]}>{qa.optionB}</Text>
        </Pressable>
      </View>
    </AnalysisCard>
  );
}

const styles = StyleSheet.create({
  question: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  row: { flexDirection: 'column', gap: 8 },
  btn: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  btnPrimary: {},
  btnPrimaryText: { fontSize: 12, lineHeight: 17, fontWeight: '600' },
  btnOutline: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  btnOutlineText: { fontSize: 12, lineHeight: 17 },
});
