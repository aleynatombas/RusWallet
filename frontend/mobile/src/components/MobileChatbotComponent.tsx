/**
 * MobileChatbotComponent – Chat UI, AI tabanlı finansal chatbot (diyagram: React Native Mobile UI Components)
 * API Interface: POST /api/chatbot
 */
import { View, Text, StyleSheet } from 'react-native';

export function MobileChatbotComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finansal Chatbot</Text>
      <Text style={styles.placeholder}>Sohbet arayüzü ve API entegrasyonu sonraki adımda eklenecek.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', borderRadius: 8, margin: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  placeholder: { marginTop: 8, fontSize: 14, color: '#6b7280' },
});
