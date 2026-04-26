import { useState, useRef, type ComponentType } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import PhoneInput from 'react-native-phone-number-input';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { isValidEmailFormat, PASSWORD_RULES_HINT, validatePassword } from '../../lib/authValidation';
import { getApiErrorMessage } from '../../services/api';
import type { RegisterRequest } from '../../types/auth';
import type { AuthStackParamList } from '../../navigation/types';
import { mobileAuthVisual, FIELD_HEIGHT, FIELD_RADIUS } from './mobileAuthVisualTokens';
import {
  MobileAuthFieldLabel,
  MobileAuthTextInput,
  MobileAuthPasswordInput,
  MobileAuthPrimaryButton,
} from './MobileAuthFields';

type AuthNav = NavigationProp<AuthStackParamList>;

export function MobileRegisterForm({ navigation }: { navigation: AuthNav }) {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const v = isDark ? mobileAuthVisual.dark : mobileAuthVisual.light;
  const { register, isLoading } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneText, setPhoneText] = useState('');
  const phoneRef = useRef<any>(null);
  const PhoneInputView = PhoneInput as unknown as ComponentType<any>;

  async function handleRegister() {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Hata', 'Ad ve soyad gerekli.');
      return;
    }
    if (!isValidEmailFormat(email)) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girin (örn. ad@alan.com).');
      return;
    }
    const pwd = validatePassword(password);
    if (!pwd.ok) {
      Alert.alert('Hata', pwd.message);
      return;
    }
    if (!phoneText.trim()) {
      Alert.alert('Hata', 'Telefon numarası gerekli.');
      return;
    }
    const valid = phoneRef.current?.isValidNumber(phoneText) ?? false;
    if (!valid) {
      Alert.alert('Hata', 'Telefon numarası geçersiz.');
      return;
    }
    const phoneE164 =
      phoneRef.current?.getNumberAfterPossiblyEliminatingZero()?.formattedNumber ||
      phoneRef.current?.getNumberAfterPossiblyEliminatingZero()?.number ||
      '';
    if (!phoneE164.startsWith('+')) {
      Alert.alert('Hata', 'Telefon numarası formatlanamadı.');
      return;
    }
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneE164,
        email: email.trim(),
        password,
      } as RegisterRequest);
    } catch (err) {
      Alert.alert('Hata', getApiErrorMessage(err, 'Kayıt başarısız.'));
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: v.text }]}>RusWallet&apos;a Katıl</Text>
      <Text style={[styles.desc, { color: v.muted }]}>
        Birkaç alanla hesabını oluştur; ardından akıllı tanıtımla devam edebilirsin.
      </Text>

      <View style={styles.row}>
        <View style={styles.half}>
          <MobileAuthFieldLabel isDark={isDark}>Ad</MobileAuthFieldLabel>
          <MobileAuthTextInput isDark={isDark} value={firstName} onChangeText={setFirstName} autoComplete="name" />
        </View>
        <View style={styles.half}>
          <MobileAuthFieldLabel isDark={isDark}>Soyad</MobileAuthFieldLabel>
          <MobileAuthTextInput isDark={isDark} value={lastName} onChangeText={setLastName} autoComplete="family-name" />
        </View>
      </View>

      <View style={styles.fieldGap}>
        <MobileAuthFieldLabel isDark={isDark}>Telefon</MobileAuthFieldLabel>
        <PhoneInputView
          ref={phoneRef}
          defaultCode="TR"
          layout="first"
          value={phoneText}
          onChangeFormattedText={setPhoneText}
          containerStyle={[
            styles.phoneBox,
            { borderColor: v.border, backgroundColor: v.inputBg, borderRadius: FIELD_RADIUS },
          ]}
          textContainerStyle={{ backgroundColor: 'transparent', paddingVertical: 0 }}
          textInputStyle={{ color: v.text, fontSize: 14, height: FIELD_HEIGHT - 4 }}
          codeTextStyle={{ color: v.text, fontSize: 14, fontWeight: '600' }}
          flagButtonStyle={{ width: 52 }}
        />
      </View>

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
        <MobileAuthFieldLabel isDark={isDark}>Şifre</MobileAuthFieldLabel>
        <MobileAuthPasswordInput
          isDark={isDark}
          value={password}
          onChangeText={setPassword}
          autoComplete="new-password"
        />
        <Text style={[styles.hint, { color: v.muted }]}>{PASSWORD_RULES_HINT}</Text>
      </View>

      <View style={styles.ctaBlock}>
        <MobileAuthPrimaryButton
          isDark={isDark}
          label="Kayıt ol"
          loading={isLoading}
          onPress={() => void handleRegister()}
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.mutedInline, { color: v.muted }]}>Zaten hesabın var mı? </Text>
        <Pressable onPress={() => navigation.navigate('Login')} accessibilityRole="link">
          <Text style={[styles.linkBold, { color: v.linkPrimary }]}>Giriş yap</Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.forgotRow}
        accessibilityRole="link"
      >
        <Text style={[styles.linkPlain, { color: v.linkPrimary }]}>Şifremi unuttum</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignSelf: 'center', maxWidth: 400 },
  title: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.4,
    marginBottom: 6,
    textAlign: 'left',
  },
  desc: { fontSize: 13, lineHeight: 20, marginBottom: 16, textAlign: 'left' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  half: { flex: 1, minWidth: 0 },
  fieldGap: { marginBottom: 14 },
  phoneBox: {
    width: '100%',
    borderWidth: 1,
    height: FIELD_HEIGHT,
    overflow: 'hidden',
  },
  hint: { fontSize: 11, lineHeight: 16, marginTop: 6, textAlign: 'left' },
  ctaBlock: { marginTop: 6, marginBottom: 8 },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 12,
  },
  mutedInline: { fontSize: 14 },
  linkBold: { fontSize: 14, fontWeight: '600' },
  forgotRow: { alignSelf: 'flex-start', paddingVertical: 6 },
  linkPlain: { fontSize: 14, textDecorationLine: 'underline' },
});
