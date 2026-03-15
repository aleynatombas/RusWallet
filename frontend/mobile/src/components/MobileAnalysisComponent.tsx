/**
 * MobileAnalysisComponent – Tarih filtresi + grafik üretimi (diyagram: React Native Mobile UI Components)
 * API Interface: GET /api/analysis/* (özet, bütçe önerisi, anomali)
 */
import { View, Text, StyleSheet } from 'react-native';

export function MobileAnalysisComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finansal Analiz</Text>
      <Text style={styles.placeholder}>Tarih filtresi ve grafikler sonraki adımda eklenecek.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', borderRadius: 8, margin: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  placeholder: { marginTop: 8, fontSize: 14, color: '#6b7280' },
});
