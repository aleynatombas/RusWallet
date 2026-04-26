import { useCallback, useContext } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  DeviceEventEmitter,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomTabBarHeightCallbackContext } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { PlatformPressable } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ProfileTabBarButton } from './ProfileTabBarButton';
import { MobileAiAssistantMark } from './ai/MobileAiAssistantMark';
import { TAB_ICON_SIZE, tabBarNavStyles } from './tabBarNavStyles';

/**
 * Referans: solda Anasayfa + İşlemlerim, ortada asistan, sağda Analizlerim + Hesabım.
 * Tüm sekme hücreleri aynı satır hizası (alignItems: center); orta ikon üstte taşır.
 */
export function MainTabCustomBar({ state, descriptors, navigation, insets: navInsets }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);

  const active = theme.dark ? '#818cf8' : theme.colors.primary;
  const inactive = theme.dark ? '#94a3b8' : theme.colors.onSurfaceVariant;
  const barBg = theme.dark ? theme.colors.background : theme.colors.surface;
  const borderTop = theme.dark ? 'rgba(148, 163, 184, 0.12)' : theme.colors.outlineVariant;

  const bottomPad = Math.max(navInsets.bottom, insets.bottom);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      onHeightChange?.(e.nativeEvent.layout.height);
    },
    [onHeightChange]
  );

  const home = state.routes.find((r) => r.name === 'Home');
  const transactions = state.routes.find((r) => r.name === 'Transactions');
  const analysis = state.routes.find((r) => r.name === 'Analysis');
  const profile = state.routes.find((r) => r.name === 'Profile');

  function emitChatToggle() {
    DeviceEventEmitter.emit('ruswallet-chat-toggle');
  }

  function renderTab(route: (typeof state.routes)[0] | undefined) {
    if (!route) return <View style={tabBarNavStyles.tabSlot} />;
    const focused = state.routes[state.index].key === route.key;
    const { options } = descriptors[route.key];
    const color = focused ? active : inactive;
    const icon = options.tabBarIcon?.({ focused, color, size: TAB_ICON_SIZE });
    const labelRaw = options.tabBarLabel ?? options.title ?? route.name;
    const label = typeof labelRaw === 'string' ? labelRaw : String(route.name);

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.dispatch({
          ...CommonActions.navigate(route),
          target: state.key,
        });
      }
    };

    const onLongPress = () => {
      navigation.emit({ type: 'tabLongPress', target: route.key });
    };

    return (
      <PlatformPressable
        key={route.key}
        onPress={onPress}
        onLongPress={onLongPress}
        style={tabBarNavStyles.tabSlot}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
      >
        <View style={tabBarNavStyles.tabPressableFill}>
          <View style={tabBarNavStyles.tabInner}>
            <View style={tabBarNavStyles.tabIconBox}>
              {icon ?? (
                <MaterialCommunityIcons name="circle-small" size={TAB_ICON_SIZE} color={color} />
              )}
            </View>
            <Text style={[tabBarNavStyles.tabLabel, { color }]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        </View>
      </PlatformPressable>
    );
  }

  return (
    <View style={[styles.shadowWrap, { width: windowWidth }]} onLayout={handleLayout}>
      <View style={[styles.bar, { backgroundColor: barBg, borderTopColor: borderTop, paddingBottom: bottomPad + 4 }]}>
        <View style={styles.row}>
          {renderTab(home)}
          {renderTab(transactions)}
          <View style={styles.centerColumn}>
            <Pressable
              onPress={emitChatToggle}
              accessibilityRole="button"
              accessibilityLabel="Finans asistanını aç veya kapat"
              style={({ pressed }) => [styles.centerFab, { opacity: pressed ? 0.92 : 1 }]}
            >
              <MobileAiAssistantMark size="fab" />
            </Pressable>
          </View>
          {renderTab(analysis)}
          {profile ? (
            <ProfileTabBarButton
              accessibilityState={{ selected: false }}
              style={tabBarNavStyles.tabSlot}
              children={null}
              tabNavigation={navigation}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 4,
  },
  /** flex-end kaldırıldı: yan profil hücresi stretch ile üstte kalıyordu; center ile ikon+yazı aynı taban çizgisinde */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    minHeight: 48,
  },
  centerColumn: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
  },
  centerFab: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
});
