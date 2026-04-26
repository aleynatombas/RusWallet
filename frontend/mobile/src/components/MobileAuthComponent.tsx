/**
 * Giriş / kayıt — koyu modda referans görsel ile uyumlu (zemin, kart, çerçeve, tipografi, buton).
 */
import { useRef, useState, useMemo, type ComponentType } from 'react';
import { View, ScrollView, StyleSheet, Alert, Text, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { TextInput, Button, Card, useTheme, type MD3Theme } from 'react-native-paper';
import PhoneInput from 'react-native-phone-number-input';
import { useAuth } from '../context/AuthContext';
import { LOGIN_SETS, REGISTER_SETS, ACTIVE_LOGIN, ACTIVE_REGISTER } from '../config/authCopy';
import { isValidEmailFormat, PASSWORD_RULES_HINT, validatePassword } from '../lib/authValidation';
import { getApiErrorMessage } from '../services/api';
import { MobilePaperPasswordInput } from './MobilePaperPasswordInput';
import { AUTH_SCREEN_DARK } from '../theme/authScreenPalette';
import type { LoginRequest, RegisterRequest } from '../types/auth';

export type MobileAuthMode = 'login' | 'register';

interface MobileAuthComponentProps {
  mode: MobileAuthMode;
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
  onSuccess?: () => void;
}

const loginCopy = LOGIN_SETS[ACTIVE_LOGIN];
const registerCopy = REGISTER_SETS[ACTIVE_REGISTER];

const FONT_SM = 14;
const FONT_TITLE = 26;
const FONT_XS = 12;

function buildInputTheme(base: MD3Theme, isDark: boolean): typeof base {
  if (!isDark) {
    return {
      ...base,
      fonts: {
        ...base.fonts,
        labelLarge: { ...base.fonts.labelLarge, fontWeight: '600' },
        labelMedium: { ...base.fonts.labelMedium, fontWeight: '600' },
      },
    };
  }
  const d = AUTH_SCREEN_DARK;
  return {
    ...base,
    colors: {
      ...base.colors,
      surface: d.inputFill,
      onSurface: d.title,
      onSurfaceVariant: d.subtitle,
      outline: d.border,
      primary: d.primaryButton,
    },
    fonts: {
      ...base.fonts,
      labelLarge: { ...base.fonts.labelLarge, fontWeight: '700' },
      labelMedium: { ...base.fonts.labelMedium, fontWeight: '700' },
    },
  };
}

export function MobileAuthComponent({
  mode,
  onNavigateToLogin,
  onNavigateToRegister,
  onSuccess,
}: MobileAuthComponentProps) {
  const theme = useTheme();
  const isDark = theme.dark === true;
  const { login, register, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneText, setPhoneText] = useState('');
  const phoneRef = useRef<any>(null);

  const PhoneInputView = PhoneInput as unknown as ComponentType<any>;

  const inputTheme = useMemo(() => buildInputTheme(theme, isDark), [theme, isDark]);

  function getErrorMessage(err: unknown, defaultMsg: string): string {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout'))
        return "Bağlantı zaman aşımı. Aynı Wi-Fi'de misiniz? config/api.ts içinde bilgisayar IP'si yazılı mı?";
      return getApiErrorMessage(err, defaultMsg);
    }
    if (err instanceof Error) return err.message;
    return defaultMsg;
  }

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
      onSuccess?.();
    } catch (err) {
      Alert.alert('Hata', getErrorMessage(err, 'Giriş başarısız.'));
    }
  }

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
      onSuccess?.();
    } catch (err) {
      Alert.alert('Hata', getErrorMessage(err, 'Kayıt başarısız.'));
    }
  }

  const pageBg = isDark ? AUTH_SCREEN_DARK.pageBg : theme.colors.background;
  const cardBg = isDark ? AUTH_SCREEN_DARK.cardBg : theme.colors.surface;
  const cardBorder = isDark ? AUTH_SCREEN_DARK.border : theme.colors.outline;
  const titleColor = isDark ? AUTH_SCREEN_DARK.title : theme.colors.onSurface;
  const subtitleColor = isDark ? AUTH_SCREEN_DARK.subtitle : theme.colors.onSurfaceVariant;
  const primaryBtn = isDark ? AUTH_SCREEN_DARK.primaryButton : theme.colors.primary;
  const onPrimary = isDark ? AUTH_SCREEN_DARK.onPrimary : theme.colors.onPrimary;
  const mutedLink = isDark ? AUTH_SCREEN_DARK.mutedLink : theme.colors.onSurfaceVariant;
  const accentLink = isDark ? AUTH_SCREEN_DARK.linkAccent : theme.colors.primary;
  const cardRadius = isDark ? 11 : 8;
  const innerPad = isDark ? 40 : 24;
  const placeholderColor = isDark ? AUTH_SCREEN_DARK.placeholder : theme.colors.onSurfaceVariant;

  const cardStyle = [
    styles.card,
    {
      backgroundColor: cardBg,
      borderColor: cardBorder,
      borderRadius: cardRadius,
    },
    Platform.OS === 'ios' && !isDark
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
        }
      : !isDark
        ? { elevation: 2 }
        : { elevation: 0 },
  ];

  const titleStyle = [styles.cardTitle, { color: titleColor }];
  const subtitleStyle = [styles.cardSubtitle, { color: subtitleColor }];

  const loginForm = (
    <>
      <Text style={titleStyle}>{loginCopy.title}</Text>
      <Text style={subtitleStyle}>{loginCopy.description}</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        mode="outlined"
        placeholder="ornek@email.com"
        placeholderTextColor={placeholderColor}
        style={styles.input}
        theme={inputTheme}
        outlineStyle={[styles.inputOutline, { borderColor: cardBorder }]}
        contentStyle={[styles.inputContent, { color: titleColor }]}
      />
      <MobilePaperPasswordInput
        label="Şifre"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        style={styles.input}
        theme={inputTheme}
        outlineStyle={[styles.inputOutline, { borderColor: cardBorder }]}
        contentStyle={[styles.inputContent, { color: titleColor }]}
      />
      <View style={styles.loginActions}>
        <Button
          mode="contained"
          compact
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          buttonColor={primaryBtn}
          textColor={onPrimary}
          style={styles.primaryButton}
          contentStyle={styles.primaryButtonContent}
          labelStyle={styles.primaryButtonLabel}
        >
          Giriş yap
        </Button>
        <View style={styles.linkColumn}>
          <Pressable
            onPress={() => onNavigateToRegister?.()}
            accessibilityRole="link"
            accessibilityLabel="Kayıt ol"
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
            style={({ pressed }) => [styles.linkHit, pressed && styles.linkPressed]}
          >
            <Text style={[styles.primaryLinkLabel, { color: accentLink }]}>Kayıt ol</Text>
          </Pressable>
        </View>
      </View>
    </>
  );

  const registerForm = (
    <>
      <Text style={titleStyle}>{registerCopy.title}</Text>
      <Text style={subtitleStyle}>{registerCopy.description}</Text>

      <View style={styles.row}>
        <TextInput
          label="Ad"
          value={firstName}
          onChangeText={setFirstName}
          mode="outlined"
          style={[styles.input, styles.half]}
          theme={inputTheme}
          outlineStyle={[styles.inputOutline, { borderColor: cardBorder }]}
          contentStyle={[styles.inputContent, { color: titleColor }]}
        />
        <TextInput
          label="Soyad"
          value={lastName}
          onChangeText={setLastName}
          mode="outlined"
          style={[styles.input, styles.half]}
          theme={inputTheme}
          outlineStyle={[styles.inputOutline, { borderColor: cardBorder }]}
          contentStyle={[styles.inputContent, { color: titleColor }]}
        />
      </View>
      <PhoneInputView
        ref={phoneRef}
        defaultCode="TR"
        layout="first"
        value={phoneText}
        onChangeFormattedText={setPhoneText}
        containerStyle={[styles.phoneContainer, { borderColor: cardBorder, backgroundColor: 'transparent' }]}
        textContainerStyle={[styles.phoneTextContainer, { backgroundColor: 'transparent' }]}
        textInputStyle={[styles.phoneTextInput, { color: titleColor }]}
        codeTextStyle={[styles.phoneCodeText, { color: titleColor }]}
        flagButtonStyle={styles.phoneFlagBtn}
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        mode="outlined"
        placeholder="ornek@email.com"
        placeholderTextColor={placeholderColor}
        style={styles.input}
        theme={inputTheme}
        outlineStyle={[styles.inputOutline, { borderColor: cardBorder }]}
        contentStyle={[styles.inputContent, { color: titleColor }]}
      />
      <MobilePaperPasswordInput
        label="Şifre"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        style={styles.input}
        theme={inputTheme}
        outlineStyle={[styles.inputOutline, { borderColor: cardBorder }]}
        contentStyle={[styles.inputContent, { color: titleColor }]}
      />
      <Text style={[styles.hint, { color: subtitleColor }]}>{PASSWORD_RULES_HINT}</Text>
      <View style={styles.loginActions}>
        <Button
          mode="contained"
          compact
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
          buttonColor={primaryBtn}
          textColor={onPrimary}
          style={styles.primaryButton}
          contentStyle={styles.primaryButtonContent}
          labelStyle={styles.primaryButtonLabel}
        >
          Kayıt ol
        </Button>
        <Pressable
          onPress={() => onNavigateToLogin?.()}
          accessibilityRole="link"
          accessibilityLabel="Giriş yap"
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          style={({ pressed }) => [styles.linkHit, styles.linkHitWide, pressed && styles.linkPressed]}
        >
          <Text style={[styles.primaryLinkLabel, { color: accentLink }]}>Zaten hesabım var – Giriş yap</Text>
        </Pressable>
      </View>
    </>
  );

  if (mode === 'login') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: pageBg }]} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <Card mode="outlined" style={cardStyle}>
            <View style={[styles.cardInner, { padding: innerPad }]}>{loginForm}</View>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pageBg }]} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.containerScroll}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <Card mode="outlined" style={cardStyle}>
          <View style={[styles.cardInner, { padding: innerPad }]}>{registerForm}</View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  containerScroll: { flexGrow: 1, padding: 24, paddingVertical: 32, justifyContent: 'center' },
  card: {
    width: '100%',
    maxWidth: 384,
    alignSelf: 'center',
    marginBottom: 16,
  },
  cardInner: {
    gap: 16,
  },
  cardTitle: {
    fontSize: FONT_TITLE,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    fontSize: FONT_SM,
    fontWeight: '400',
    marginTop: -8,
    marginBottom: 4,
  },
  input: { marginBottom: 0, backgroundColor: 'transparent' },
  inputOutline: { borderRadius: 8 },
  inputContent: { fontSize: FONT_SM, fontWeight: '400' },
  row: { flexDirection: 'row', gap: 16 },
  phoneContainer: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    overflow: 'hidden',
  },
  phoneTextContainer: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  phoneTextInput: {
    fontSize: FONT_SM,
    paddingVertical: 0,
  },
  phoneCodeText: {
    fontSize: FONT_SM,
    fontWeight: '600',
  },
  phoneFlagBtn: {
    width: 52,
  },
  half: { flex: 1 },
  /** Buton ile alt linkler arası ~8px (web gap-2); kartın genel gap’inden ayrı blok */
  loginActions: {
    gap: 8,
    alignSelf: 'stretch',
  },
  primaryButton: {
    marginTop: 0,
    borderRadius: 6,
    alignSelf: 'stretch',
  },
  primaryButtonContent: {
    paddingVertical: 0,
    paddingHorizontal: 16,
    minHeight: 40,
    height: 40,
  },
  primaryButtonLabel: {
    fontSize: FONT_SM,
    fontWeight: '500',
    letterSpacing: 0.15,
    marginVertical: 0,
  },
  mutedLinkLabel: {
    fontSize: FONT_SM,
    fontWeight: '400',
    textAlign: 'center',
  },
  primaryLinkLabel: {
    fontSize: FONT_SM,
    fontWeight: '400',
    textAlign: 'center',
  },
  linkHit: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkHitWide: {
    alignSelf: 'stretch',
  },
  linkPressed: {
    opacity: 0.75,
  },
  linkColumn: {
    gap: 6,
    alignItems: 'center',
    width: '100%',
  },
  hint: { fontSize: FONT_XS, lineHeight: 18 },
});
