import { Platform, StyleSheet } from 'react-native';

/** Alt sekme: tüm öğeler aynı ölçü (ikon kutusu + yazı) */
export const TAB_ICON_SIZE = 22;

export const tabBarNavStyles = StyleSheet.create({
  tabSlot: {
    flex: 1,
    minWidth: 0,
  },
  tabPressableFill: {
    width: '100%',
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 2,
    gap: 2,
  },
  tabIconBox: {
    width: TAB_ICON_SIZE,
    height: TAB_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.15,
    textAlign: 'center',
    lineHeight: 12,
    ...Platform.select({
      android: { includeFontPadding: false as const },
      default: {},
    }),
  },
});
