import { useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet, Modal, Platform } from 'react-native';
import type { BottomTabBarButtonProps, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PlatformPressable } from '@react-navigation/elements';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { navigateToAppSettings, navigateToOnboardingRevisit } from '../navigation/navigateApp';
import { TAB_ICON_SIZE, tabBarNavStyles } from './tabBarNavStyles';

/**
 * `MainTabCustomBar.renderTab` ile aynı iç yapı (tabPressableFill → tabInner → ikon kutusu + yazı).
 * `alignSelf: stretch` vb. ek stil yok — diğer sekmelerle aynı hizada kalır.
 */
type ProfileTabBarButtonProps = BottomTabBarButtonProps & {
  /** Tab bar’ın `navigation` prop’u — Ayarlar için App stack’e güvenilir geçiş */
  tabNavigation: BottomTabBarProps['navigation'];
};

export function ProfileTabBarButton(props: ProfileTabBarButtonProps) {
  const { style, accessibilityState, tabNavigation } = props;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { setThemeMode } = useAppTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const inactive = theme.dark ? '#94a3b8' : theme.colors.onSurfaceVariant;
  const color = inactive;
  const fg = theme.colors.onSurface;
  const surface = theme.colors.surface;
  const border = theme.colors.outline;

  function goSettings() {
    setMenuVisible(false);
    navigateToAppSettings(tabNavigation);
  }

  /** Web mobil hesap menüsündeki «Akıllı tanıtım» → /onboarding */
  function goOnboardingRevisit() {
    setMenuVisible(false);
    navigateToOnboardingRevisit(tabNavigation);
  }

  function openAppearance() {
    setMenuVisible(false);
    Alert.alert('Görünüm', 'Tema seçin', [
      { text: 'Aydınlık', onPress: () => setThemeMode('light') },
      { text: 'Karanlık', onPress: () => setThemeMode('dark') },
      { text: 'İptal', style: 'cancel' },
    ]);
  }

  function handleLogout() {
    setMenuVisible(false);
    Alert.alert('Çıkış', 'Oturumu kapatmak istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: () => logout() },
    ]);
  }

  /**
   * Diğer sekmeler doğrudan `PlatformPressable`+`tabSlot`; burada Modal yüzünden sarmalayıcı şart.
   * `flex:1` iç basın alanında kaymayı yapıyordu — sadece `tabSlot` + içeriği ortala (yükseklik içerik kadar).
   */
  return (
    <View style={[style, styles.profileCell]} collapsable={false}>
      <PlatformPressable
        accessibilityRole="button"
        accessibilityState={accessibilityState}
        accessibilityLabel="Hesabım menüsü"
        onPress={() => setMenuVisible(true)}
      >
        <View style={tabBarNavStyles.tabPressableFill}>
          <View style={tabBarNavStyles.tabInner}>
            <View style={tabBarNavStyles.tabIconBox}>
              <MaterialCommunityIcons name="account-outline" size={TAB_ICON_SIZE} color={color} />
            </View>
            <Text style={[tabBarNavStyles.tabLabel, { color }]} numberOfLines={1}>
              Hesabım
            </Text>
          </View>
        </View>
      </PlatformPressable>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)} />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: surface,
                borderColor: border,
                paddingBottom: Math.max(insets.bottom, 12) + 8,
              },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: theme.colors.outlineVariant }]} />
            <Pressable
              onPress={goSettings}
              style={({ pressed }) => [styles.sheetRow, pressed && { opacity: 0.85 }]}
            >
              <MaterialCommunityIcons name="cog-outline" size={22} color={fg} />
              <Text style={[styles.sheetRowLabel, { color: fg }]}>Ayarlar</Text>
            </Pressable>
            <Pressable
              onPress={goOnboardingRevisit}
              style={({ pressed }) => [styles.sheetRow, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel="Seni tanıyalım — profilini güncelle"
            >
              <MaterialCommunityIcons name="star-four-points-outline" size={22} color={fg} />
              <Text style={[styles.sheetRowLabel, { color: fg }]}>Seni tanıyalım</Text>
            </Pressable>
            <Pressable
              onPress={openAppearance}
              style={({ pressed }) => [styles.sheetRow, pressed && { opacity: 0.85 }]}
            >
              <MaterialCommunityIcons name="palette-outline" size={22} color={fg} />
              <Text style={[styles.sheetRowLabel, { color: fg }]}>Görünüm</Text>
            </Pressable>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.sheetRow, pressed && { opacity: 0.85 }]}
            >
              <MaterialCommunityIcons name="logout" size={22} color="#dc2626" />
              <Text style={[styles.sheetRowLabel, { color: '#dc2626' }]}>Çıkış yap</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCell: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 0,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 16 },
    }),
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  sheetRowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
