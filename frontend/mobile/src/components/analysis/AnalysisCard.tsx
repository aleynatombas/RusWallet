import type { ReactNode } from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { getCardShadow } from '../../theme/cardShadow';
import { useAnalysisPalette } from '../../theme/useAnalysisPalette';

export type AnalysisCardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Başlık altı ince çizgi (web CardHeader). */
  headerBorder?: boolean;
};

export function AnalysisCard({ title, subtitle, children, style, headerBorder = true }: AnalysisCardProps) {
  const theme = useTheme();
  const p = useAnalysisPalette();
  const showHeader = Boolean(title || subtitle);
  const shadow = getCardShadow(theme.dark);

  return (
    <View
      style={[
        styles.card,
        shadow,
        { borderColor: p.border, backgroundColor: p.cardBg },
        style,
      ]}
    >
      {showHeader ? (
        <View
          style={[
            styles.header,
            headerBorder && styles.headerBorder,
            { borderBottomColor: p.border },
          ]}
        >
          {title ? <Text style={[styles.title, { color: p.fg }]}>{title}</Text> : null}
          {subtitle ? <Text style={[styles.subtitle, { color: p.subtitle }]}>{subtitle}</Text> : null}
        </View>
      ) : null}
      <View style={showHeader ? styles.body : styles.bodyFlush}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'visible',
    marginBottom: 14,
  },
  header: {
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 11,
  },
  headerBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
  },
  body: {
    paddingHorizontal: 15,
    paddingBottom: 16,
    paddingTop: 6,
  },
  bodyFlush: {
    paddingHorizontal: 15,
    paddingVertical: 16,
  },
});
