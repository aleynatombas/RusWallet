/**
 * Web FloatingChatbot / görsel referans: koyu lacivert disk, kalın koyu çerçeve,
 * hafif eşmerkez “radar” halkaları, neon cyan Lucide Bot çizgisi, yumuşak cyan glow.
 */
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { DARK_PAGE_BACKGROUND } from '../../theme/darkPalette';
import { LucideBotIcon } from './LucideBotIcon';

export type MobileMarkSize = 'header' | 'fab';

const SHELL: Record<MobileMarkSize, { outer: number; rim: number; icon: number }> = {
  header: { outer: 40, rim: 2, icon: 17 },
  fab: { outer: 64, rim: 3, icon: 26 },
};

const BG_FACE = '#0a0e23';
const BG_RIM = DARK_PAGE_BACKGROUND;
const RING_CYAN = 'rgba(34, 211, 238, 0.14)';

type ShellProps = {
  size: MobileMarkSize;
  children: React.ReactNode;
  style?: ViewStyle;
};

function ConcentricRings({ innerSize }: { innerSize: number }) {
  const scales = [0.9, 0.74, 0.58];
  return (
    <>
      {scales.map((s, i) => {
        const w = innerSize * s;
        const o = (innerSize - w) / 2;
        return (
          <View
            key={i}
            pointerEvents="none"
            style={[
              styles.ring,
              {
                left: o,
                top: o,
                width: w,
                height: w,
                borderRadius: w / 2,
                borderColor: `rgba(34, 211, 238, ${0.05 + i * 0.035})`,
              },
            ]}
          />
        );
      })}
    </>
  );
}

export function MobileAiAssistantMarkShell({ size, children, style }: ShellProps) {
  const { outer, rim } = SHELL[size];
  const inner = outer - rim * 2;

  return (
    <View style={[styles.glow, { width: outer, height: outer, borderRadius: outer / 2 }, style]}>
      <View
        style={[
          styles.rim,
          {
            width: outer,
            height: outer,
            borderRadius: outer / 2,
            padding: rim,
            backgroundColor: BG_RIM,
          },
        ]}
      >
        <View
          style={[
            styles.face,
            {
              width: inner,
              height: inner,
              borderRadius: inner / 2,
              borderColor: RING_CYAN,
            },
          ]}
        >
          <ConcentricRings innerSize={inner} />
          <View style={styles.iconLayer}>{children}</View>
        </View>
      </View>
    </View>
  );
}

export function MobileAiAssistantMark({ size, style }: { size: MobileMarkSize; style?: ViewStyle }) {
  const icon = SHELL[size].icon;
  return (
    <MobileAiAssistantMarkShell size={size} style={style}>
      <LucideBotIcon size={icon} />
    </MobileAiAssistantMarkShell>
  );
}

const styles = StyleSheet.create({
  glow: {
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  rim: {
    overflow: 'hidden',
  },
  face: {
    backgroundColor: BG_FACE,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconLayer: {
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
