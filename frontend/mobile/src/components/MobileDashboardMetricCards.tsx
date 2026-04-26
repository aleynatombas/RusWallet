import { View, Text, StyleSheet } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { DARK_SURFACE } from '../theme/darkPalette';
import { getCardShadow } from '../theme/cardShadow';

function formatTry(n: number): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/** Web dashboard / koyu mockup ile uyumlu */
const DARK = {
  card: DARK_SURFACE,
  border: 'rgba(148, 163, 184, 0.14)',
  muted: '#94a3b8',
  fg: '#ffffff',
  incomeBg: 'rgba(16, 185, 129, 0.15)',
  incomeIc: '#34d399',
  expenseBg: 'rgba(244, 63, 94, 0.15)',
  expenseIc: '#fb7185',
  balanceBg: 'rgba(99, 102, 241, 0.12)',
  balanceIc: '#818cf8',
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

  const muted = light ? '#64748b' : DARK.muted;
  const fg = light ? '#0f172a' : DARK.fg;
  const cardBorder = light ? '#e2e8f0' : DARK.border;
  const cardBg = light ? '#ffffff' : DARK.card;

  const incBg = light ? styles.iconIncomeLight : { backgroundColor: DARK.incomeBg };
  const expBg = light ? styles.iconExpenseLight : { backgroundColor: DARK.expenseBg };
  const balBg = light ? styles.iconBalanceLight : { backgroundColor: DARK.balanceBg };
  const incIc = light ? '#15803d' : DARK.incomeIc;
  const expIc = light ? '#be123c' : DARK.expenseIc;
  const balIc = light ? '#4338ca' : DARK.balanceIc;

  const cardShadow = getCardShadow(theme.dark);

  return (
    <View style={styles.grid}>
      <Card mode="outlined" style={[styles.card, { borderColor: cardBorder, backgroundColor: cardBg }, cardShadow]}>
        <Card.Content style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.label, { color: muted }]}>{incomeTitle}</Text>
            <View style={[styles.iconWrap, incBg]}>
              <MaterialCommunityIcons name="arrow-top-right" size={18} color={incIc} />
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
            <View style={[styles.iconWrap, expBg]}>
              <MaterialCommunityIcons name="arrow-bottom-right" size={18} color={expIc} />
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
            <View style={[styles.iconWrap, balBg]}>
              <MaterialCommunityIcons name="wallet-outline" size={18} color={balIc} />
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
  iconIncomeLight: { backgroundColor: '#dcfce7' },
  iconExpenseLight: { backgroundColor: '#fce7f3' },
  iconBalanceLight: { backgroundColor: '#ede9fe' },
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
