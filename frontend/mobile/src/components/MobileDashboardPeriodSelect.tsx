/**
 * Web `DashboardPeriodSelect` — özet dönemi (Bu ay, Son 3 ay, …).
 */
import { useState } from 'react';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';
import { Menu, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { DASHBOARD_PERIOD_OPTIONS, type DashboardPeriod } from '../lib/dashboardPeriod';

type Props = {
  value: DashboardPeriod;
  onChange: (v: DashboardPeriod) => void;
};

export function MobileDashboardPeriodSelect({ value, onChange }: Props) {
  const theme = useTheme();
  const isDark = theme.dark;
  const [open, setOpen] = useState(false);
  const current = DASHBOARD_PERIOD_OPTIONS.find((o) => o.value === value) ?? DASHBOARD_PERIOD_OPTIONS[0];

  /** Web `DashboardPeriodSelect` ile aynı teal ailesi (index.css --primary ~173°) */
  const border = isDark ? 'rgba(45, 212, 191, 0.22)' : 'rgba(15, 118, 110, 0.22)';
  const bg = isDark ? 'rgba(13, 148, 136, 0.14)' : 'rgba(20, 184, 166, 0.08)';
  const fg = isDark ? '#cbd5e1' : '#0f172a';
  const chevron = isDark ? '#94a3b8' : '#64748b';

  return (
    <View style={styles.wrap}>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <View style={styles.anchorAlign}>
            <Pressable
              onPress={() => setOpen(true)}
              style={({ pressed }) => [
                styles.trigger,
                {
                  borderColor: border,
                  backgroundColor: bg,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Özet dönemi: ${current.label}. Değiştirmek için dokunun.`}
            >
              <Text
                style={[styles.triggerLabel, { color: fg }, Platform.OS === 'android' && { includeFontPadding: false }]}
                numberOfLines={1}
              >
                {current.label}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={14} color={chevron} />
            </Pressable>
          </View>
        }
        contentStyle={{ backgroundColor: theme.colors.surface }}
      >
        {DASHBOARD_PERIOD_OPTIONS.map((o) => (
          <Menu.Item
            key={o.value}
            onPress={() => {
              onChange(o.value);
              setOpen(false);
            }}
            title={o.label}
            titleStyle={value === o.value ? styles.menuItemSelected : undefined}
          />
        ))}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Sağa yaslı; satırda alt hizayı `MobileHomeComponent` `alignItems: 'flex-end` ile tutar */
  wrap: {
    flexShrink: 0,
    alignSelf: 'flex-end',
    height: 28,
    justifyContent: 'flex-end',
  },
  anchorAlign: {
    justifyContent: 'center',
  },
  /** Yazı boyutu aynı; çerçeve + iç boşluk küçük kutu */
  trigger: {
    height: 28,
    minWidth: 80,
    paddingHorizontal: 6,
    paddingVertical: 0,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  /** `flex:1` üstte sabit genişlik olmayınca 0 kalıyor — «Bu ay» görünmez oluyordu */
  triggerLabel: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    flexShrink: 1,
  },
  menuItemSelected: {
    fontWeight: '700',
  },
});
