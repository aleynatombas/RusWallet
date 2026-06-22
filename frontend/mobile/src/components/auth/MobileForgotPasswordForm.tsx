import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import type { NavigationProp } from '@react-navigation/native';
import { useAppTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import type { AuthStackParamList } from '../../navigation/types';
import { isValidEmailFormat } from '../../lib/authValidation';
import { mobileAuthVisual } from './mobileAuthVisualTokens';
import {
  MobileAuthFieldLabel,
  MobileAuthTextInput,
  MobileAuthPasswordInput,
  MobileAuthPrimaryButton,
} from './MobileAuthFields';

type AuthNav = NavigationProp<AuthStackParamList>;

function fieldError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { message?: string } | undefined;
    if (d?.message && typeof d.message === 'string') return d.message;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Bir hata oluştu.';
}

export function MobileForgotPasswordForm({ navigation }: { navigation: AuthNav }) {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const v = isDark ? mobileAuthVisual.dark : mobileAuthVisual.light;

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ── Adım 1: Kod gönder ─────────────────────────────────────────────────
  async function handleSendCode() {
    setMessage('');
    const em = email.trim();
    if (!isValidEmailFormat(em)) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girin (örn. ad@alan.com).');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<{ message?: string }>('/auth/forgot-password', { email: em });
      setMessage(data?.message ?? 'Doğrulama kodu e-postanıza gönderildi.');
      setStep(2);
    } catch (err) {
      Alert.alert('Hata', fieldError(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Adım 2: Kodu + yeni şifreyi gönder ─────────────────────────────────
  async function handleResetPassword() {
    setMessage('');
    if (newPassword !== newPassword2) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<{ message?: string }>('/auth/reset-password', {
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
      Alert.alert('Başarılı', data?.message ?? 'Şifreniz güncellendi. Giriş yapabilirsiniz.', [
        { text: 'Giriş yap', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      Alert.alert('Hata', fieldError(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Adım 1 ekranı ──────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <View style={styles.wrap}>
        <Text style={[styles.title, { color: v.text }]}>Şifremi unuttum</Text>
        <Text style={[styles.desc, { color: v.muted }]}>
          Hesabına kayıtlı e-posta adresini gir; 6 haneli doğrulama kodu gönderilecek.
        </Text>

        <View style={styles.fieldGap}>
          <MobileAuthFieldLabel isDark={isDark}>E-posta</MobileAuthFieldLabel>
          <MobileAuthTextInput
            isDark={isDark}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="ornek@email.com"
          />
        </View>

        {message ? (
          <Text style={[styles.ok, { color: v.success }]}>{message}</Text>
        ) : null}

        <View style={styles.ctaBlock}>
          <MobileAuthPrimaryButton
            isDark={isDark}
            label="Doğrulama kodu gönder"
            loading={loading}
            onPress={() => void handleSendCode()}
          />
        </View>

        <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkCenter} accessibilityRole="link">
          <Text style={[styles.link, { color: v.linkPrimary }]}>Girişe dön</Text>
        </Pressable>
      </View>
    );
  }

  // ── Adım 2 ekranı ──────────────────────────────────────────────────────
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: v.text }]}>Kodu girin</Text>
      <Text style={[styles.desc, { color: v.muted }]}>
        {email} adresine gönderilen 6 haneli kodu ve yeni şifrenizi girin.
      </Text>

      <View style={styles.fieldGap}>
        <MobileAuthFieldLabel isDark={isDark}>Doğrulama kodu</MobileAuthFieldLabel>
        <MobileAuthTextInput
          isDark={isDark}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={6}
          autoComplete="one-time-code"
          placeholder="123456"
        />
      </View>
      <View style={styles.fieldGap}>
        <MobileAuthFieldLabel isDark={isDark}>Yeni şifre</MobileAuthFieldLabel>
        <MobileAuthPasswordInput
          isDark={isDark}
          value={newPassword}
          onChangeText={setNewPassword}
          autoComplete="new-password"
          placeholder="Yeni şifre"
        />
      </View>
      <View style={styles.fieldGap}>
        <MobileAuthFieldLabel isDark={isDark}>Yeni şifre (tekrar)</MobileAuthFieldLabel>
        <MobileAuthPasswordInput
          isDark={isDark}
          value={newPassword2}
          onChangeText={setNewPassword2}
          autoComplete="new-password"
          placeholder="Tekrar"
        />
      </View>

      <View style={styles.ctaBlock}>
        <MobileAuthPrimaryButton
          isDark={isDark}
          label="Şifremi sıfırla"
          loading={loading}
          onPress={() => void handleResetPassword()}
        />
      </View>

      <Pressable onPress={() => { setStep(1); setMessage(''); setCode(''); }} style={styles.linkCenter} accessibilityRole="link">
        <Text style={[styles.link, { color: v.linkPrimary }]}>Geri</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignSelf: 'center', maxWidth: 400 },
  title: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'left',
  },
  desc: { fontSize: 14, lineHeight: 21, marginBottom: 20, textAlign: 'left' },
  fieldGap: { marginBottom: 16 },
  ctaBlock: { marginTop: 8, marginBottom: 12 },
  ok: { fontSize: 14, marginBottom: 8, textAlign: 'left' },
  linkCenter: { alignSelf: 'flex-start', paddingVertical: 10 },
  link: { fontSize: 14, fontWeight: '600' },
});
