/**
 * Lucide `Bot` ile aynı çizim (24×24 viewBox), ölçeklenebilir stroke.
 */
import Svg, { Path, Rect } from 'react-native-svg';

const CYAN = '#22d3ee';

type Props = {
  size: number;
  color?: string;
  strokeWidth?: number;
};

export function LucideBotIcon({ size, color = CYAN, strokeWidth }: Props) {
  const sw = strokeWidth ?? Math.max(1.25, 1.75 * (size / 24));
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Path
        d="M12 8V4H8"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Rect x="4" y="8" width="16" height="12" rx="2" stroke={color} strokeWidth={sw} fill="none" />
      <Path d="M2 14h2" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      <Path d="M20 14h2" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      <Path d="M15 13v2" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      <Path d="M9 13v2" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
    </Svg>
  );
}
