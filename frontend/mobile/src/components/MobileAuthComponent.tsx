/**
 * MobileAuthComponent – Login/Register UI (diyagram: React Native Mobile UI Components)
 * React Native Paper: TextInput, Button, Card. API: login/register. Web ile aynı akış.
 */
import { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { TextInput, Button, Card, useTheme } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import type { LoginRequest, RegisterRequest } from '../types/auth';

export type MobileAuthMode = 'login' | 'register';

interface MobileAuthComponentProps {
  mode: MobileAuthMode;
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
  onSuccess?: () => void;
}

export function MobileAuthComponent({
  mode,
  onNavigateToLogin,
  onNavigateToRegister,
  onSuccess,
}: MobileAuthComponentProps) {
  const theme = useTheme();
  const { login, register, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  function getErrorMessage(err: unknown, defaultMsg: string): string {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout'))
        return 'Bağlantı zaman aşımı. Aynı Wi-Fi\'de misiniz? config/api.ts içinde bilgisayar IP\'si yazılı mı?';
      return err.response?.data?.message ?? err.message ?? defaultMsg;
    }
    if (err instanceof Error) return err.message;
    return defaultMsg;
  }

  async function handleLogin() {
    try {
      await login({ email, password } as LoginRequest);
      onSuccess?.();
    } catch (err) {
      Alert.alert('Hata', getErrorMessage(err, 'Giriş başarısız.'));
    }
  }

  async function handleRegister() {
    try {
      await register({ firstName, lastName, phoneNumber, email, password } as RegisterRequest);
      onSuccess?.();
    } catch (err) {
      Alert.alert('Hata', getErrorMessage(err, 'Kayıt başarısız.'));
    }
  }

  if (mode === 'login') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <Card style={styles.card}>
          <Card.Title title="RusWallet – Giriş" subtitle="Hesabınıza giriş yapın" />
          <Card.Content style={styles.content}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Şifre"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              mode="outlined"
              style={styles.input}
            />
            <Button mode="contained" onPress={handleLogin} loading={isLoading} disabled={isLoading} style={styles.button}>
              Giriş yap
            </Button>
            <Button mode="text" onPress={onNavigateToRegister} compact>
              Kayıt ol
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.containerScroll, { backgroundColor: theme.colors.surface }]}>
      <Card style={styles.card}>
        <Card.Title title="RusWallet – Kayıt" subtitle="Yeni hesap oluşturun" />
        <Card.Content style={styles.content}>
          <View style={styles.row}>
            <TextInput label="Ad" value={firstName} onChangeText={setFirstName} mode="outlined" style={[styles.input, styles.half]} />
            <TextInput label="Soyad" value={lastName} onChangeText={setLastName} mode="outlined" style={[styles.input, styles.half]} />
          </View>
          <TextInput label="Telefon" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" mode="outlined" style={styles.input} />
          <TextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" mode="outlined" style={styles.input} />
          <TextInput label="Şifre" value={password} onChangeText={setPassword} secureTextEntry mode="outlined" style={styles.input} />
          <Button mode="contained" onPress={handleRegister} loading={isLoading} disabled={isLoading} style={styles.button}>
            Kayıt ol
          </Button>
          <Button mode="text" onPress={onNavigateToLogin} compact>
            Zaten hesabım var – Giriş yap
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  containerScroll: { flexGrow: 1, padding: 24, paddingVertical: 32 },
  card: { marginBottom: 16 },
  content: { gap: 12 },
  input: { marginBottom: 0 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  button: { marginTop: 8 },
});
