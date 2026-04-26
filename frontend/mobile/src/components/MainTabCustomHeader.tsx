/**
 * Mockup: [ Anasayfa ]   İşlemlerim  Analizlerim ········ ay + menü
 * Yalnızca aktif sekmede açık gri pill; diğerleri düz gri metin.
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainHeaderRight } from './MainHeaderRight';
import type { MainTabParamList } from '../navigation/types';

const TOP_TABS: { name: keyof MainTabParamList; label: string }[] = [
  { name: 'Home', label: 'Anasayfa' },
  { name: 'Transactions', label: 'İşlemlerim' },
  { name: 'Analysis', label: 'Analizlerim' },
];

export function MainTabCustomHeader() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const active = useNavigationState((state) => state?.routes[state?.index ?? 0]?.name);

  const isLight = !theme.dark;
  /** Koyu: mockup — sayfa ile aynı lacivert, aktif sekme koyu gri pill */
  const barBg = isLight ? '#ffffff' : theme.colors.background;
  const borderCol = isLight ? '#e5e7eb' : 'rgba(148, 163, 184, 0.12)';
  const activeBg = isLight ? '#f1f5f9' : '#1e293b';
  const labelActive = isLight ? '#0f172a' : '#ffffff';
  const labelInactive = isLight ? '#6b7280' : '#94a3b8';

  return (
    <View style={[styles.bar, { paddingTop: insets.top, backgroundColor: barBg, borderBottomColor: borderCol }]}>
      <View style={styles.row}>
        <View style={styles.tabs}>
          {TOP_TABS.map((t, index) => {
            const isOn = active === t.name;
            return (
              <Pressable
                key={t.name}
                onPress={() => navigation.navigate(t.name)}
                style={[
                  styles.pill,
                  isOn && { backgroundColor: activeBg },
                  index === 0 && styles.pillFirst,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isOn }}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isOn ? labelActive : labelInactive, fontWeight: isOn ? '600' : '500' },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <MainHeaderRight variant="minimal" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 48,
    gap: 10,
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 4,
  },
  pill: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
  },
  /** Anasayfa ile diğer sekmeler arasında mockup’taki boşluk */
  pillFirst: {
    marginRight: 12,
  },
  pillText: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
});
