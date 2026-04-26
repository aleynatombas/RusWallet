import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { isValidEmailFormat } from '../../lib/authValidation';
import { getApiErrorMessage } from '../../services/api';
import type { LoginRequest } from '../../types/auth';
import type { AuthStackParamList } from '../../navigation/types';
import { mobileAuthVisual } from './mobileAuthVisualTokens';
import {
  MobileAuthFieldLabel,
  MobileAuthTextInput,
  MobileAuthPasswordInput,
  MobileAuthPrimaryButton,
} from './MobileAuthFields';

type AuthNav = NavigationProp<AuthStackParamList>;

export function MobileLoginForm({
  navigation,
}: {
  navigation: AuthNav;
}) {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const v = isDark ? mobileAuthVisual.dark : mobileAuthVisual.light;
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin() {
    if (!isValidEmailFormat(email)) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girin (örn. ad@alan.com).');
      return;
    }
    if (!password) {
      Alert.alert('Hata', 'Şifre gerekli.');
      return;
    }
    try {
      await login({ email: email.trim(), password } as LoginRequest);
    } catch (err) {
      Alert.alert('Hata', getApiErrorMessage(err, 'Giriş başarısız.'));
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: v.text }]}>Hoş geldin</Text>
      <Text style={[styles.desc, { color: v.muted }]}>
        E-posta ve şifrenle giriş yap; hesabın yoksa kayıt olabilirsin.
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
          textContentType="emailAddress"
          placeholder="ornek@email.com"
        />
      </View>
      <View style={styles.fieldGap}>
        <MobileAuthFieldLabel isDark={isDark}>Şifre</MobileAuthFieldLabel>
        <MobileAuthPasswordInput isDark={isDark} value={password} onChangeText={setPassword} />
      </View>

      <View style={styles.ctaBlock}>
        <MobileAuthPrimaryButton
          isDark={isDark}
          label="Giriş yap"
          loading={isLoading}
          onPress={() => void handleLogin()}
        />
      </View>

      <Pressable
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.linkCenter}
        accessibilityRole="link"
      >
        <Text style={[styles.link, { color: v.linkPrimary }]}>Şifremi unuttum</Text>
      </Pressable>

      <View style={styles.footerRow}>
        <Text style={[styles.mutedInline, { color: v.muted }]}>Hesabın yok mu? </Text>
        <Pressable onPress={() => navigation.navigate('Register')} accessibilityRole="link">
          <Text style={[styles.linkBold, { color: v.linkPrimary }]}>Kayıt ol</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0, width: '100%', alignSelf: 'center', maxWidth: 400 },
  title: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'left',
  },
  desc: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
    textAlign: 'left',
  },
  fieldGap: { marginBottom: 16 },
  ctaBlock: { marginTop: 8, marginBottom: 12 },
  linkCenter: { alignSelf: 'flex-start', paddingVertical: 8 },
  link: { fontSize: 14, fontWeight: '500', textDecorationLine: 'underline' },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
  },
  mutedInline: { fontSize: 14 },
  linkBold: { fontSize: 14, fontWeight: '600' },
});
