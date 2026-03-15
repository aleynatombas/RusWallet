/**
 * MobileDashboardComponent – Web ile aynı: Hoş geldin + email + Çıkış.
 * Bütçe kartları + grafikler API bağlandığında eklenecek.
 */
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export function MobileDashboardComponent() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>RusWallet – Dashboard</Text>
          <View style={styles.headerRight}>
            <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Çıkış</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.welcome}>
          Hoş geldin, {user?.firstName} {user?.lastName}. Bütçe kartları ve grafikler burada (API bağlandığında dolu olacak).
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  scrollView: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: '600', color: '#1f2937', flexShrink: 0 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  email: { fontSize: 14, color: '#4b5563', maxWidth: 140 },
  logoutBtn: { backgroundColor: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: '#374151', fontWeight: '500' },
  welcome: { fontSize: 16, color: '#4b5563', lineHeight: 24 },
});
