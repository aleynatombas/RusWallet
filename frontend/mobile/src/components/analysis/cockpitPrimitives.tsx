import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from 'react-native-paper';

export function fmtTry(n: number): string {
  return `${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`;
}

export function EsnekRing({
  percent,
  trackColor,
  strokeColor,
  textColor,
  size = 60,
}: {
  percent: number;
  trackColor: string;
  strokeColor: string;
  textColor: string;
  size?: number;
}) {
  const p = Math.min(100, Math.max(0, percent));
  const r = (size - 4) / 2 - 1;
  const stroke = 3.5;
  const c = 2 * Math.PI * r;
  const offset = c - (p / 100) * c;
  const cx = size / 2;
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={cx} cy={cx} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx}
          cy={cx}
          r={r}
          stroke={strokeColor}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, styles.ringCenter]} pointerEvents="none">
        <Text style={[styles.ringPct, { color: textColor }]}>{Math.round(p)}%</Text>
      </View>
    </View>
  );
}

export function GradientFlexBar({
  value,
  trackColor,
  accent,
  accentEnd,
}: {
  value: number;
  trackColor: string;
  accent: string;
  accentEnd: string;
}) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
      <View style={[styles.progressClip, { width: `${v}%` }]}>
        <LinearGradient
          colors={[accent, accentEnd, '#c4b5fd']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

export function CockpitSkeletonLines() {
  const theme = useTheme();
  const muted = theme.colors.onSurfaceVariant;
  return (
    <View style={styles.skelWrap} accessibilityElementsHidden>
      <View style={[styles.skelLine, { backgroundColor: muted, width: '100%', opacity: 0.35 }]} />
      <View style={[styles.skelLine, { backgroundColor: muted, width: '88%', opacity: 0.3 }]} />
      <View style={[styles.skelLine, { backgroundColor: muted, width: '72%', opacity: 0.25 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  ringCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPct: { fontSize: 11, fontWeight: '700' },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
  progressClip: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  skelWrap: { gap: 8 },
  skelLine: { height: 10, borderRadius: 6 },
});
