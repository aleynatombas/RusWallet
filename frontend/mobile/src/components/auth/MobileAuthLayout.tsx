import type { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NavigationProp } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../context/ThemeContext';
import { mobileAuthVisual } from './mobileAuthVisualTokens';
import type { AuthStackParamList } from '../../navigation/types';

type AuthNav = NavigationProp<AuthStackParamList>;

type TabKey = 'login' | 'register';

interface MobileAuthLayoutProps {
  navigation: AuthNav;
  /** Hangi sekme vurgulu (forgot ekranında `login` — web ile aynı) */
  activeTab: TabKey;
  /** Şifremi unuttum tam ekranı: sekmeler yine görünür, alt içerik forgot formu */
  forgotMode?: boolean;
  children: ReactNode;
}

export function MobileAuthLayout({
  navigation,
  activeTab,
  forgotMode = false,
  children,
}: MobileAuthLayoutProps) {
  const insets = useSafeAreaInsets();
  const { mode, toggleTheme } = useAppTheme();
  const isDark = mode === 'dark';
  const v = isDark ? mobileAuthVisual.dark : mobileAuthVisual.light;
  const tabHighlight: TabKey = forgotMode ? 'login' : activeTab;

  return (
    <View style={styles.flex}>
      <LinearGradient colors={[...v.pageGradient]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <Pressable
          onPress={toggleTheme}
          style={({ pressed }) => [
            styles.themeBtn,
            {
              top: insets.top + 6,
              backgroundColor: isDark ? 'rgba(8,24,46,0.88)' : 'rgba(255,255,255,0.92)',
              borderColor: v.border,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
          accessibilityLabel={isDark ? 'Açık tema' : 'Koyu tema'}
        >
          <MaterialCommunityIcons name={isDark ? 'white-balance-sunny' : 'weather-night'} size={22} color={v.text} />
        </Pressable>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={insets.top + 8}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.inner}>
            <View style={[styles.tabRow, { borderBottomColor: v.border }]}>
              <Pressable
                onPress={() => navigation.navigate('Login')}
                style={styles.tabPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: tabHighlight === 'login' }}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: tabHighlight === 'login' ? v.tabActive : v.tabInactive },
                  ]}
                >
                  Giriş yap
                </Text>
                {tabHighlight === 'login' ? (
                  <LinearGradient
                    colors={[...v.tabUnderline]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tabUnderline}
                  />
                ) : (
                  <View style={styles.tabUnderlinePlaceholder} />
                )}
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('Register')}
                style={styles.tabPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: tabHighlight === 'register' }}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: tabHighlight === 'register' ? v.tabActive : v.tabInactive },
                  ]}
                >
                  Kayıt ol
                </Text>
                {tabHighlight === 'register' ? (
                  <LinearGradient
                    colors={[...v.tabUnderline]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tabUnderline}
                  />
                ) : (
                  <View style={styles.tabUnderlinePlaceholder} />
                )}
              </Pressable>
            </View>

            <View style={styles.formBlock}>{children}</View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  themeBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
    paddingTop: 48,
  },
  inner: {
    paddingHorizontal: 20,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'stretch',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 36,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 6,
    marginBottom: 8,
  },
  tabPress: {
    paddingBottom: 10,
    minWidth: 100,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    borderRadius: 2,
  },
  tabUnderlinePlaceholder: {
    height: 2,
    marginTop: 0,
  },
  formBlock: {
    paddingTop: 12,
  },
});
