import { useState } from 'react';
import { View, StyleSheet, Modal, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { IconButton, Menu, useTheme, Card, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import type { MainTabParamList } from '../navigation/types';
import { navigateToAppSettings, navigateToOnboardingRevisit } from '../navigation/navigateApp';

type MainHeaderRightProps = {
  /** Mockup: yalnızca tema + hamburger menü */
  variant?: 'default' | 'minimal';
};

export function MainHeaderRight({ variant = 'default' }: MainHeaderRightProps) {
  const theme = useTheme();
  const { toggleTheme, mode } = useAppTheme();
  const { logout } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showUnreadDot, setShowUnreadDot] = useState(true);

  function goSettings() {
    setMenuOpen(false);
    navigateToAppSettings(navigation);
  }

  function handleLogout() {
    setMenuOpen(false);
    logout();
  }

  function openNotifications() {
    setNotifOpen(true);
    setShowUnreadDot(false);
  }

  function openOnboardingHub() {
    navigateToOnboardingRevisit(navigation);
  }

  const minimal = variant === 'minimal';

  return (
    <View style={styles.row}>
      {!minimal ? (
        <>
          <Pressable
            onPress={openOnboardingHub}
            style={styles.sparkleWrap}
            accessibilityRole="button"
            accessibilityLabel="Akıllı tanıtım — bilgilerini güncelle"
            hitSlop={8}
          >
            <MaterialCommunityIcons name="star-four-points-outline" size={22} color="#f59e0b" />
          </Pressable>
          <Pressable
            onPress={openNotifications}
            style={styles.bellWrap}
            accessibilityRole="button"
            accessibilityLabel="Bildirimler"
            hitSlop={8}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color={theme.colors.onSurface} />
            {showUnreadDot ? <View style={[styles.dot, { borderColor: theme.colors.surface }]} /> : null}
          </Pressable>
        </>
      ) : null}
      <IconButton
        icon={mode === 'dark' ? 'weather-sunny' : 'weather-night'}
        size={22}
        onPress={toggleTheme}
        accessibilityLabel={mode === 'dark' ? 'Aydınlık tema' : 'Koyu tema'}
      />
      <Menu
        visible={menuOpen}
        onDismiss={() => setMenuOpen(false)}
        anchor={
          <IconButton
            icon={minimal ? 'menu' : 'account-circle-outline'}
            size={22}
            onPress={() => setMenuOpen(true)}
            accessibilityLabel={minimal ? 'Menü' : 'Hesap'}
          />
        }
        anchorPosition="bottom"
      >
        <Menu.Item onPress={goSettings} title="Ayarlar" />
        <Menu.Item onPress={handleLogout} title="Çıkış yap" />
      </Menu>

      <Modal visible={notifOpen} transparent animationType="fade" onRequestClose={() => setNotifOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setNotifOpen(false)}>
          <Pressable style={styles.modalInner} onPress={(e) => e.stopPropagation()}>
            <Card style={[styles.notifCard, { backgroundColor: theme.colors.surface }]} mode="elevated">
              <Card.Title title="Bildirimler" titleStyle={{ color: theme.colors.onSurface }} />
              <Card.Content>
                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 15 }}>
                  Şu an için yeni bildiriminiz yok. Önemli uyarılar ve hatırlatmalar burada görünecek.
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => setNotifOpen(false)}>Tamam</Button>
              </Card.Actions>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginRight: 4 },
  sparkleWrap: { padding: 6, justifyContent: 'center', alignItems: 'center' },
  bellWrap: { position: 'relative', padding: 6, justifyContent: 'center', alignItems: 'center' },
  dot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalInner: { maxWidth: 400, width: '100%', alignSelf: 'center' },
  notifCard: { borderRadius: 12 },
});
