/**
 * Web FloatingChatbot ile uyumlu: Paper arka plan / yüzey, birincil renk halka ve bot çizgisi.
 */
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { darkPaperTheme } from '../../theme/paperThemes';
import { LucideBotIcon } from './LucideBotIcon';

const CHAT = darkPaperTheme.colors;
const RING_BORDER = 'rgba(125, 211, 252, 0.12)';
const FACE_BORDER = 'rgba(125, 211, 252, 0.22)';

export type MobileMarkSize = 'header' | 'fab';

const SHELL: Record<MobileMarkSize, { outer: number; rim: number; icon: number }> = {
  header: { outer: 40, rim: 2, icon: 17 },
  fab: { outer: 64, rim: 3, icon: 26 },
};

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
                borderColor: RING_BORDER,
                opacity: 0.55 + i * 0.15,
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
  const primary = CHAT.primary;

  return (
    <View style={[styles.glow, { width: outer, height: outer, borderRadius: outer / 2, shadowColor: primary }, style]}>
      <View
        style={[
          styles.rim,
          {
            width: outer,
            height: outer,
            borderRadius: outer / 2,
            padding: rim,
            backgroundColor: CHAT.background,
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
              borderColor: FACE_BORDER,
              backgroundColor: CHAT.surface,
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
      <LucideBotIcon size={icon} color={CHAT.primary} />
    </MobileAiAssistantMarkShell>
  );
}

const styles = StyleSheet.create({
  glow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  rim: {
    overflow: 'hidden',
  },
  face: {
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
