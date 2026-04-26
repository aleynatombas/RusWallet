import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';
import { getCardShadow } from '../theme/cardShadow';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CategorySlice } from '../lib/groupExpenseByCategory';
import { categoryColorHexSemanticOrHash } from '../lib/categoryColor';
import { formatExpenseCategoryLabel } from '../lib/formatExpenseCategoryLabel';
import type { MainTabParamList } from '../navigation/types';

/** Web Recharts Pie innerRadius 70% / outerRadius 90% ile aynı oran (200×200 viewBox). */
const VB = 200;
const CX = 100;
const CY = 100;
const OUTER = 90;
const INNER = 70;
function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeDonutSlice(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, outerRadius, startAngle);
  const end = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return [
    'M',
    start.x,
    start.y,
    'A',
    outerRadius,
    outerRadius,
    0,
    largeArcFlag,
    1,
    end.x,
    end.y,
    'L',
    innerStart.x,
    innerStart.y,
    'A',
    innerRadius,
    innerRadius,
    0,
    largeArcFlag,
    0,
    innerEnd.x,
    innerEnd.y,
    'Z',
  ].join(' ');
}

function formatTl(n: number): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface MobileDashboardCategoryDonutProps {
  slices: CategorySlice[];
  monthlyExpenseTotal: number;
  isDark: boolean;
  compact?: boolean;
  /** Web `getDashboardPeriodLabels` ile uyumlu metinler */
  donutTitle?: string;
  donutCenterHint?: string;
  donutEmptyCompact?: string;
  donutEmptyFull?: string;
}

/** Web `DashboardCategoryDonut` ile aynı metin hiyerarşisi, legend flex-wrap, ince halka. */
export function MobileDashboardCategoryDonut({
  slices,
  monthlyExpenseTotal,
  isDark,
  compact,
  donutTitle = 'Bu ay gider · kategorilere göre',
  donutCenterHint = 'Bu ay · tüm giderler',
  donutEmptyCompact = 'Bu ay gider yok.',
  donutEmptyFull = 'Henüz bu ay kayıtlı gider yok; harcama ekledikçe pasta dolacak.',
}: MobileDashboardCategoryDonutProps) {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  /** RN’de aspectRatio bazen yükseklik 0 verir; pasta için px cinsinden kare boy şart. */
  const chartPx = Math.min(300, Math.max(220, windowWidth - 64));

  const total = monthlyExpenseTotal > 0 ? monthlyExpenseTotal : slices.reduce((a, s) => a + s.value, 0);
  const selected = activeIndex !== null && slices[activeIndex] ? slices[activeIndex] : null;
  const pct = selected && total > 0 ? Math.round((selected.value / total) * 100) : null;
  const label = selected ? formatExpenseCategoryLabel(selected.name) : null;

  const paths = useMemo(() => {
    if (total <= 0 || slices.length === 0) return [];
    let cum = 0;
    return slices.map((s, i) => {
      const startDeg = (360 * cum) / total;
      cum += s.value;
      const endDeg = (360 * cum) / total;
      const fill = categoryColorHexSemanticOrHash(s.name, isDark);
      const d = describeDonutSlice(CX, CY, INNER, OUTER, startDeg, endDeg);
      return { d, fill, name: s.name, index: i, value: s.value };
    });
  }, [slices, total, isDark]);

  const fg = theme.colors.onSurface;
  const muted = theme.colors.onSurfaceVariant;
  const primary = theme.colors.primary;
  const cardBg = theme.colors.surface;
  const border = isDark ? 'rgba(141, 155, 176, 0.14)' : theme.colors.outline;
  const sliceStroke = isDark ? theme.colors.background : '#ffffff';
  const cardShadow = getCardShadow(isDark);

  const pad = compact ? 16 : 18;

  if (total <= 0 || paths.length === 0) {
    return (
      <View
        style={[
          styles.wrap,
          cardShadow,
          { backgroundColor: cardBg, borderColor: border, padding: pad },
        ]}
      >
        <Text style={[styles.h2, { color: fg }]}>{donutTitle}</Text>
        <Text style={[styles.desc, { color: muted }]}>{compact ? donutEmptyCompact : donutEmptyFull}</Text>
        {!compact ? (
          <Pressable onPress={() => navigation.navigate('Transactions')} style={styles.linkBtn}>
            <Text style={[styles.link, { color: primary }]}>İşlemler sayfasına git</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        cardShadow,
        { backgroundColor: cardBg, borderColor: border, padding: pad },
      ]}
    >
      <Text style={[styles.h2, { color: fg }]}>{donutTitle}</Text>
      {!compact ? (
        <Text style={[styles.desc, { color: muted }]}>Dilime dokunun; merkezde kategori veya toplam görünür.</Text>
      ) : null}

      <View style={[styles.chartBox, { width: chartPx, height: chartPx }]}>
        <Svg width={chartPx} height={chartPx} viewBox={`0 0 ${VB} ${VB}`}>
          {paths.map((p) => (
            <Path
              key={p.name}
              d={p.d}
              fill={p.fill}
              stroke={activeIndex === p.index ? primary : sliceStroke}
              strokeWidth={activeIndex === p.index ? 2 : 1}
              onPress={() => setActiveIndex((i) => (i === p.index ? null : p.index))}
            />
          ))}
        </Svg>
        <View style={styles.centerOverlay} pointerEvents="none">
          {selected && pct !== null && label ? (
            <View style={styles.centerCol}>
              <Text style={[styles.centerSelLabel, { color: muted }]} numberOfLines={2}>
                {label}
              </Text>
              <Text style={[styles.centerSelAmt, { color: fg }]}>
                ₺{formatTl(selected.value)}{' '}
                <Text style={{ color: primary }}>%{pct}</Text>
              </Text>
            </View>
          ) : (
            <View style={styles.centerCol}>
              <Text style={[styles.centerDefLabel, { color: muted }]}>Toplam harcama</Text>
              <Text style={[styles.centerDefAmt, { color: fg }]}>₺{formatTl(total)}</Text>
              <Text style={[styles.centerDefHint, { color: muted }]}>{donutCenterHint}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.legend}>
        {paths.map((p) => (
          <Pressable
            key={p.name}
            onPress={() => setActiveIndex((i) => (i === p.index ? null : p.index))}
            style={[
              styles.chip,
              {
                borderColor:
                  activeIndex === p.index
                    ? primary
                    : isDark
                      ? 'rgba(148,163,184,0.35)'
                      : '#e5e7eb',
                backgroundColor:
                  activeIndex === p.index
                    ? isDark
                      ? 'rgba(56, 189, 248, 0.12)'
                      : 'rgba(2, 132, 199, 0.08)'
                    : isDark
                      ? 'rgba(30,41,59,0.5)'
                      : '#f9fafb',
              },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: p.fill }]} />
            <Text style={[styles.chipText, { color: fg }]} numberOfLines={1}>
              {formatExpenseCategoryLabel(p.name)}
            </Text>
          </Pressable>
        ))}
      </View>

      {!compact ? (
        <Pressable onPress={() => navigation.navigate('Transactions')} style={styles.footerLink}>
          <Text style={[styles.footerText, { color: muted }]}>
            Hızlı işlem için <Text style={{ color: primary, fontWeight: '600' }}>İşlemler</Text>.
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  h2: { fontSize: 16, fontWeight: '600', letterSpacing: -0.3 },
  desc: { fontSize: 13, marginTop: 6, lineHeight: 18 },
  linkBtn: { marginTop: 12, alignSelf: 'center' },
  link: { fontSize: 14, fontWeight: '600' },
  chartBox: {
    marginTop: 12,
    alignSelf: 'center',
    position: 'relative',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 36,
  },
  centerCol: { alignItems: 'center', gap: 4, maxWidth: '100%' },
  centerDefLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  centerDefAmt: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  centerDefHint: { fontSize: 10, textAlign: 'center', marginTop: 2 },
  centerSelLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 14,
  },
  centerSelAmt: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'], textAlign: 'center' },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 8, height: 8, borderRadius: 2 },
  chipText: { fontSize: 11, fontWeight: '600', flexShrink: 1 },
  footerLink: { marginTop: 12, alignItems: 'center' },
  footerText: { fontSize: 11, textAlign: 'center' },
});
