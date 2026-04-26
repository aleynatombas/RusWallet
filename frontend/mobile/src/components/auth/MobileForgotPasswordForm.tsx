import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import type { NavigationProp } from '@react-navigation/native';
import { useAppTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import type { ResetPasswordByEmailRequest } from '../../types/auth';
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
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit() {
    setMessage('');
    const em = email.trim();
    if (!isValidEmailFormat(em)) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girin (örn. ad@alan.com).');
      return;
    }
    if (newPassword !== newPassword2) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    try {
      const body: ResetPasswordByEmailRequest = { email: em, newPassword };
      const { data } = await api.post<{ message?: string }>('/auth/reset-password-by-email', body);
      setMessage(data?.message ?? 'Şifreniz güncellendi. Giriş yapabilirsiniz.');
      setNewPassword('');
      setNewPassword2('');
    } catch (err) {
      Alert.alert('Hata', fieldError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: v.text }]}>Şifremi unuttum</Text>
      <Text style={[styles.desc, { color: v.muted }]}>
        Hesabına kayıtlı e-postayı ve yeni şifreni gir; ardından giriş yapabilirsin.
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

      {message ? (
        <Text style={[styles.ok, { color: v.success }]} accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}

      <View style={styles.ctaBlock}>
        <MobileAuthPrimaryButton
          isDark={isDark}
          label="Şifreyi güncelle"
          loading={loading}
          onPress={() => void handleSubmit()}
        />
      </View>

      <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkCenter} accessibilityRole="link">
        <Text style={[styles.link, { color: v.linkPrimary }]}>Girişe dön</Text>
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
