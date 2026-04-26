import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import axios from 'axios';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import {
  Card,
  Button,
  Divider,
  TextInput,
  useTheme,
  List,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { MobilePaperPasswordInput } from '../components/MobilePaperPasswordInput';
import { formatFullName } from '../lib/formatDisplayName';
import { api } from '../services/api';
import { CARD_SHADOW_BLEED, getCardShadow } from '../theme/cardShadow';
import type { AppStackParamList } from '../navigation/types';
import type { AuthResponse, ChangePasswordRequest, UpdateProfileRequest } from '../types/auth';

type Panel = 'menu' | 'profile' | 'security' | 'appearance';

function initials(first?: string | null, last?: string | null, email?: string | null) {
  const a = first?.trim().charAt(0);
  const b = last?.trim().charAt(0);
  if (a && b) return (a + b).toLocaleUpperCase('tr-TR');
  if (a) return a.toLocaleUpperCase('tr-TR');
  const e = email?.trim().charAt(0);
  return (e ?? '?').toLocaleUpperCase('tr-TR');
}

function fieldError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { message?: string } | undefined;
    if (d?.message && typeof d.message === 'string') return d.message;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Bir hata oluştu.';
}

/** Üst bar «Ayarlar» başlığı ile aynı hiyerarşi (native stack ~17pt semibold). */
function sectionLabelStyle(color: string) {
  return {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    color,
    paddingHorizontal: 0,
    paddingTop: 20,
    paddingBottom: 8,
  };
}

export function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, logout, applyAuthResponse } = useAuth();
  const { mode, setThemeMode } = useAppTheme();

  const [panel, setPanel] = useState<Panel>('menu');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const displayName = formatFullName(user?.firstName, user?.lastName) || 'Hesap';
  const muted = theme.colors.onSurfaceVariant;
  const fg = theme.colors.onSurface;

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setEmail(user.email ?? '');
  }, [user]);

  function goMenu() {
    setPanel('menu');
  }

  async function handleProfileSubmit() {
    setProfileError('');
    setProfileMessage('');
    setProfileLoading(true);
    try {
      const body: UpdateProfileRequest = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      };
      const { data } = await api.put<AuthResponse>('/auth/profile', body);
      applyAuthResponse(data);
      setProfileMessage('Profil bilgileriniz kaydedildi.');
    } catch (err) {
      setProfileError(fieldError(err));
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit() {
    setPasswordError('');
    setPasswordMessage('');
    if (newPassword !== newPassword2) {
      setPasswordError('Yeni şifreler eşleşmiyor.');
      return;
    }
    setPasswordLoading(true);
    try {
      const body: ChangePasswordRequest = { currentPassword, newPassword };
      const { data } = await api.post<{ message?: string }>('/auth/change-password', body);
      setPasswordMessage(data?.message ?? 'Şifreniz güncellendi.');
      setCurrentPassword('');
      setNewPassword('');
      setNewPassword2('');
    } catch (err) {
      setPasswordError(fieldError(err));
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Hesabı sil',
      'Hesabın kalıcı olarak silinecek. İşlemler ve diğer veriler geri getirilemez.\n\nDevam etmek istiyor musun?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/auth/me');
              logout();
            } catch (err) {
              Alert.alert('Hata', fieldError(err));
            }
          },
        },
      ]
    );
  }

  const themeLabel = mode === 'dark' ? 'Koyu' : 'Açık';
  const cardShadow = getCardShadow(theme.dark);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {panel === 'menu' ? (
          <>
            <Text style={[styles.sub, { color: muted }]}>
              Hesap bilgilerinizi ve uygulama tercihlerinizi yönetin.
            </Text>

            <Card style={[styles.summaryCard, cardShadow, { backgroundColor: theme.colors.surface }]} mode="outlined">
              <Card.Content style={styles.summaryRow}>
                <View
                  style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}
                  accessibilityRole="image"
                  accessibilityLabel="Profil harfi"
                >
                  <Text style={[styles.avatarText, { color: theme.colors.onPrimaryContainer }]}>
                    {initials(user?.firstName, user?.lastName, user?.email)}
                  </Text>
                </View>
                <View style={styles.summaryTextWrap}>
                  <Text style={[styles.summaryName, { color: fg }]} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={[styles.summaryEmail, { color: muted }]} numberOfLines={1}>
                    {user?.email ?? '—'}
          </Text>
                </View>
        </Card.Content>
      </Card>

            <Text style={sectionLabelStyle(muted)}>Hesap</Text>
            <View style={[cardShadow, { borderRadius: 16 }]}>
            <View
              style={[
                styles.group,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
              accessibilityLabel="Hesap ayarları"
            >
              <List.Item
                title="Profil"
                description="Ad, e-posta ve güvenlik ayarları burada düzenlenebilecek."
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDesc}
                onPress={() => setPanel('profile')}
                left={(p) => <List.Icon {...p} icon="account-outline" color={muted} />}
                right={(p) => <List.Icon {...p} icon="chevron-right" color={muted} />}
              />
              <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
              <List.Item
                title="Şifre değiştir"
                description="Oturum şifrenizi güncelleyin; unuttuysanız e-posta ile sıfırlayın."
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDesc}
                onPress={() => setPanel('security')}
                left={(p) => <List.Icon {...p} icon="key-outline" color={muted} />}
                right={(p) => <List.Icon {...p} icon="chevron-right" color={muted} />}
              />
            </View>
            </View>

            <Text style={sectionLabelStyle(muted)}>Uygulama</Text>
            <View style={[cardShadow, { borderRadius: 16 }]}>
            <View
              style={[
                styles.group,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <List.Item
                title="Görünüm"
                description="Açık veya koyu tema"
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDesc}
                onPress={() => setPanel('appearance')}
                left={(p) => <List.Icon {...p} icon="palette-outline" color={muted} />}
                right={(p) => (
                  <View style={styles.rowRight}>
                    <Text style={[styles.trailingValue, { color: muted }]}>{themeLabel}</Text>
                    <List.Icon {...p} icon="chevron-right" color={muted} />
                  </View>
                )}
              />
            </View>
            </View>

            <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
              onPress={handleDeleteAccount}
            >
              Hesabımı sil
            </Button>
            <View style={{ height: 10 }} />
            <Button mode="outlined" onPress={logout}>
              Çıkış yap
            </Button>
            <Text style={[styles.footerBrand, { color: muted }]}>RusWallet</Text>
          </>
        ) : null}

        {panel !== 'menu' ? (
          <>
            <Pressable
              onPress={goMenu}
              accessibilityRole="button"
              accessibilityLabel="Ayarlar ana listesine dön"
              style={({ pressed }) => [styles.backRow, pressed && { opacity: 0.7 }]}
            >
              <Text style={[styles.backChevron, { color: theme.colors.primary }]}>‹</Text>
              <Text style={[styles.backLabel, { color: muted }]}>{`Ayarlar'a dön`}</Text>
            </Pressable>
            <Text style={[styles.panelTitle, { color: fg }]}>
              {panel === 'profile' && 'Profil'}
              {panel === 'security' && 'Şifre değiştir'}
              {panel === 'appearance' && 'Görünüm'}
            </Text>
          </>
        ) : null}

        {panel === 'profile' ? (
          <View style={styles.panelBody}>
            <Text style={[styles.panelHint, { color: muted }]}>
              Ad, e-posta ve güvenlik ayarları burada düzenlenebilecek.
          </Text>
            <Card style={[cardShadow, { backgroundColor: theme.colors.surface }]} mode="outlined">
              <Card.Content style={{ gap: 12 }}>
                <View style={styles.nameRow}>
                  <TextInput
                    label="Ad"
                    value={firstName}
                    onChangeText={setFirstName}
                    mode="outlined"
                    dense
                    disabled={profileLoading}
                    style={styles.halfInput}
                  />
                  <TextInput
                    label="Soyad"
                    value={lastName}
                    onChangeText={setLastName}
                    mode="outlined"
                    dense
                    disabled={profileLoading}
                    style={styles.halfInput}
                  />
                </View>
                <TextInput
                  label="E-posta"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  dense
                  keyboardType="email-address"
                  autoCapitalize="none"
                  disabled={profileLoading}
                />
                {profileError ? (
                  <Text style={{ color: theme.colors.error, fontSize: 13 }}>{profileError}</Text>
                ) : null}
                {profileMessage ? (
                  <Text style={{ color: theme.colors.primary, fontSize: 13 }}>{profileMessage}</Text>
                ) : null}
                <Button mode="contained" onPress={handleProfileSubmit} disabled={profileLoading} loading={profileLoading}>
                  Profili kaydet
          </Button>
        </Card.Content>
      </Card>
          </View>
        ) : null}

        {panel === 'security' ? (
          <View style={styles.panelBody}>
            <Text style={[styles.panelHint, { color: muted }]}>
              Oturum şifrenizi güncelleyin. Şifrenizi unuttuysanız e-posta ile sıfırlayabilirsiniz.
            </Text>
            <Card style={[cardShadow, { backgroundColor: theme.colors.surface }]} mode="outlined">
              <Card.Content style={{ gap: 12 }}>
                <MobilePaperPasswordInput
                  label="Mevcut şifre"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  mode="outlined"
                  dense
                  disabled={passwordLoading}
                />
                <MobilePaperPasswordInput
                  label="Yeni şifre"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  mode="outlined"
                  dense
                  disabled={passwordLoading}
                />
                <Text style={[styles.pwdHint, { color: muted }]}>
                  En az 8 karakter; büyük, küçük harf, rakam ve özel karakter (!@#$% vb.).
                </Text>
                <MobilePaperPasswordInput
                  label="Yeni şifre (tekrar)"
                  value={newPassword2}
                  onChangeText={setNewPassword2}
                  mode="outlined"
                  dense
                  disabled={passwordLoading}
                />
                {passwordError ? (
                  <Text style={{ color: theme.colors.error, fontSize: 13 }}>{passwordError}</Text>
                ) : null}
                {passwordMessage ? (
                  <Text style={{ color: theme.colors.primary, fontSize: 13 }}>{passwordMessage}</Text>
                ) : null}
                <Button
                  mode="contained-tonal"
                  onPress={handlePasswordSubmit}
                  disabled={passwordLoading}
                  loading={passwordLoading}
                >
                  Şifreyi güncelle
                </Button>
              </Card.Content>
            </Card>
          </View>
        ) : null}

        {panel === 'appearance' ? (
          <View style={styles.panelBody}>
            <Text style={[styles.panelHint, { color: muted }]}>Uygulama temasını seçin.</Text>
            <Card style={[cardShadow, { backgroundColor: theme.colors.surface }]} mode="outlined">
              <Card.Content style={{ gap: 12 }}>
                <Text style={[styles.appearanceLabel, { color: fg }]}>Tema</Text>
                <View style={styles.themeRow}>
                  <Button
                    mode={mode === 'light' ? 'contained' : 'outlined'}
                    onPress={() => setThemeMode('light')}
                    style={styles.themeBtn}
                  >
                    Açık
                  </Button>
                  <Button
                    mode={mode === 'dark' ? 'contained' : 'outlined'}
                    onPress={() => setThemeMode('dark')}
                    style={styles.themeBtn}
                  >
                    Koyu
      </Button>
                </View>
                <Text style={[styles.pwdHint, { color: muted }]}>
                  Seçiminiz bu cihazda kaydedilir.
                </Text>
              </Card.Content>
            </Card>
          </View>
        ) : null}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16 + CARD_SHADOW_BLEED,
  },
  sub: { fontSize: 14, marginTop: 0, lineHeight: 20 },
  summaryCard: {
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  summaryTextWrap: { flex: 1, minWidth: 0 },
  summaryName: { fontSize: 16, fontWeight: '600' },
  summaryEmail: { fontSize: 14, marginTop: 2 },
  group: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  listTitle: { fontSize: 15, fontWeight: '500' },
  listDesc: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  trailingValue: { fontSize: 14, marginRight: -8 },
  divider: { marginVertical: 16 },
  footerBrand: { textAlign: 'center', fontSize: 11, marginTop: 16 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backChevron: { fontSize: 24, fontWeight: '400', marginTop: -2 },
  backLabel: { fontSize: 14, fontWeight: '500' },
  panelTitle: { fontSize: 22, fontWeight: '600', marginBottom: 12 },
  panelBody: { marginBottom: 24 },
  panelHint: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  nameRow: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  pwdHint: { fontSize: 11, lineHeight: 16 },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeBtn: { minWidth: 112 },
  appearanceLabel: { fontSize: 14, fontWeight: '600' },
});
