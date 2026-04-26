import { View, Text, StyleSheet } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { DARK_SURFACE } from '../theme/darkPalette';
import { getCardShadow } from '../theme/cardShadow';
import { themeColorAlpha } from '../theme/themeColorAlpha';

function formatTry(n: number): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/** Koyu: web `.dark` kart / sınır; ikonlar web gibi tek `primary` (teal) */
const DARK = {
  card: DARK_SURFACE,
  border: 'rgba(141, 155, 176, 0.14)',
  muted: 'rgb(141, 155, 176)',
  fg: 'rgb(243, 246, 247)',
};

interface MobileDashboardMetricCardsProps {
  monthlyIncome: number;
  monthlyExpense: number;
  lifetimeBalance: number;
  /** Web `DashboardMetricCards` ile aynı başlıklar (döneme göre) */
  incomeTitle?: string;
  incomeSubtitle?: string;
  expenseTitle?: string;
  expenseSubtitle?: string;
}

/** Web `DashboardMetricCards`: üst satır başlık + ikon, tutar, alt açıklama — sol hizalı sabit aralık */
export function MobileDashboardMetricCards({
  monthlyIncome,
  monthlyExpense,
  lifetimeBalance,
  incomeTitle = 'Bu ay gelir',
  incomeSubtitle = 'Bu ay kayıtlı gelirler',
  expenseTitle = 'Bu ay gider',
  expenseSubtitle = 'Bu ay kayıtlı giderler',
}: MobileDashboardMetricCardsProps) {
  const theme = useTheme();
  const light = !theme.dark;

  const muted = light ? theme.colors.onSurfaceVariant : DARK.muted;
  const fg = light ? theme.colors.onSurface : DARK.fg;
  const cardBorder = light ? theme.colors.outline : DARK.border;
  const cardBg = light ? theme.colors.surface : DARK.card;

  const iconBg = light
    ? { backgroundColor: themeColorAlpha(theme.colors.primary, 0.1) }
    : { backgroundColor: themeColorAlpha(theme.colors.primary, 0.12) };
  const accentIc = theme.colors.primary;

  const cardShadow = getCardShadow(theme.dark);

  return (
    <View style={styles.grid}>
      <Card mode="outlined" style={[styles.card, { borderColor: cardBorder, backgroundColor: cardBg }, cardShadow]}>
        <Card.Content style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.label, { color: muted }]}>{incomeTitle}</Text>
            <View style={[styles.iconWrap, iconBg]}>
              <MaterialCommunityIcons name="arrow-top-right" size={18} color={accentIc} />
            </View>
          </View>
          <Text style={[styles.value, { color: fg }]}>₺{formatTry(monthlyIncome)}</Text>
          <Text style={[styles.caption, { color: muted }]}>{incomeSubtitle}</Text>
        </Card.Content>
      </Card>

      <Card mode="outlined" style={[styles.card, { borderColor: cardBorder, backgroundColor: cardBg }, cardShadow]}>
        <Card.Content style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.label, { color: muted }]}>{expenseTitle}</Text>
            <View style={[styles.iconWrap, iconBg]}>
              <MaterialCommunityIcons name="arrow-bottom-right" size={18} color={accentIc} />
            </View>
          </View>
          <Text style={[styles.value, { color: fg }]}>₺{formatTry(monthlyExpense)}</Text>
          <Text style={[styles.caption, { color: muted }]}>{expenseSubtitle}</Text>
        </Card.Content>
      </Card>

      <Card mode="outlined" style={[styles.card, { borderColor: cardBorder, backgroundColor: cardBg }, cardShadow]}>
        <Card.Content style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.label, { color: muted }]}>Toplam bakiye</Text>
            <View style={[styles.iconWrap, iconBg]}>
              <MaterialCommunityIcons name="wallet-outline" size={18} color={accentIc} />
            </View>
          </View>
          <Text style={[styles.value, { color: fg }]}>₺{formatTry(lifetimeBalance)}</Text>
          <Text style={[styles.caption, { color: muted }]}>Tüm zamanlar (gelir − gider)</Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 14 },
  card: { borderRadius: 12 },
  content: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    minHeight: 32,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    paddingRight: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    lineHeight: 30,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
});
