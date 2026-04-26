import { View, Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

const LOGO = require('../../../assets/ruswallet-rw-logo.png');

const sizes = {
  navbar: { w: 120, h: 45 },
  auth: { w: 226, h: 84 },
  /** Açılış splash — ortada daha büyük */
  splash: { w: 276, h: 102 },
} as const;

type Variant = keyof typeof sizes;

type RusWalletLogoMarkProps = {
  variant: Variant;
  style?: StyleProp<ViewStyle>;
};

/** PNG logomark. */
export function RusWalletLogoMark({ variant, style }: RusWalletLogoMarkProps) {
  const d = sizes[variant];

  return (
    <View style={[styles.wrap, { width: d.w, height: d.h }, style]} accessibilityRole="image" accessibilityLabel="RusWallet">
      <Image
        source={LOGO}
        style={{ width: d.w, height: d.h }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
});
