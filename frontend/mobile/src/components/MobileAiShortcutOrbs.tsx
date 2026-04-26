import { View, Text, Pressable, StyleSheet, DeviceEventEmitter } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getCardShadow } from '../theme/cardShadow';
import { themeColorAlpha } from '../theme/themeColorAlpha';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { CategorySlice } from '../lib/groupExpenseByCategory';
import { formatExpenseCategoryLabel } from '../lib/formatExpenseCategoryLabel';
import type { TransactionRow } from '../types/dashboard';
import type { MainTabParamList } from '../navigation/types';

function formatTry(n: number): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatTxDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

interface MobileAiShortcutOrbsProps {
  topCategories: CategorySlice[];
  isDark: boolean;
  compact?: boolean;
  monthTransactionCount?: number;
  lastTransaction?: TransactionRow | null;
  /** Web `shortcutStatsLabel` — örn. «Bu ay işlem», «Son 3 ay işlem» */
  periodTransactionLabel?: string;
}

/** Mockup: ortalanmış başlık, özet şeridi, giriş kanalları, dikey kategori kartları. */
export function MobileAiShortcutOrbs({
  topCategories,
  isDark,
  compact = true,
  monthTransactionCount,
  lastTransaction,
  periodTransactionLabel = 'Bu ay işlem',
}: MobileAiShortcutOrbsProps) {
  const theme = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const picks = topCategories.slice(0, 3);

  const titleMuted = theme.colors.onSurfaceVariant;
  const descMuted = theme.colors.onSurfaceVariant;
  const fg = theme.colors.onSurface;
  const cardBg = theme.colors.surface;
  const border = isDark ? themeColorAlpha(theme.colors.outline, 0.35) : theme.colors.outline;
  const showStats = typeof monthTransactionCount === 'number';
  const labelSection = theme.colors.onSurfaceVariant;

  const accent = theme.colors.primary;
  const accentSoftBg = isDark
    ? themeColorAlpha(accent, 0.1)
    : themeColorAlpha(accent, 0.08);
  const channelInnerBg = isDark
    ? themeColorAlpha(theme.colors.onSurface, 0.04)
    : themeColorAlpha(theme.colors.primary, 0.04);

  const pad = compact ? 16 : 20;
  const cardShadow = getCardShadow(isDark);

  function openReceipt() {
    DeviceEventEmitter.emit('ruswallet-open-receipt');
  }

  function openVoiceTransaction() {
    DeviceEventEmitter.emit('ruswallet-open-voice');
  }

  function openChatPreset(text: string) {
    DeviceEventEmitter.emit('ruswallet-chat-open', { message: text });
  }

  return (
    <View
      style={[
        styles.wrap,
        cardShadow,
        { backgroundColor: cardBg, borderColor: border, padding: pad },
      ]}
    >
      <Text style={[styles.titleMain, { color: titleMuted }]}>Hızlı AI kısayolları</Text>
      <Text style={[styles.desc, { color: descMuted }]}>
        Fiş veya sesle hızlı işlem ekleyin; kategori kısayolları finans asistanını açarak ilgili konuşmayı başlatır.
      </Text>

      {showStats ? (
        <View
          style={[
            styles.statsCard,
            {
              borderColor: isDark ? themeColorAlpha(theme.colors.outline, 0.45) : theme.colors.outline,
              backgroundColor: isDark ? theme.colors.elevation.level2 : theme.colors.surfaceVariant,
            },
          ]}
        >
          <View style={styles.statsCol}>
            <Text style={[styles.statsLabelCaps, { color: labelSection }]}>{periodTransactionLabel}</Text>
            <Text style={[styles.statsNum, { color: fg }]}>{monthTransactionCount}</Text>
          </View>
          <View style={[styles.statsDivider, { backgroundColor: themeColorAlpha(theme.colors.outline, 0.5) }]} />
          <View style={styles.statsColWide}>
            <Text style={[styles.statsLabelCaps, styles.statsLabelLeft, { color: labelSection }]}>Son işlem</Text>
            {lastTransaction ? (
              <>
                <Text style={[styles.lastTitle, { color: fg }]} numberOfLines={2}>
                  {lastTransaction.description?.trim() || '—'}
                </Text>
                <Text style={[styles.lastAmount, { color: accent }]}>
                  {lastTransaction.isIncome ? '+' : '−'}₺{formatTry(Math.abs(Number(lastTransaction.amount)))}
                </Text>
                <Text style={[styles.lastFoot, { color: descMuted }]} numberOfLines={2}>
                  {[lastTransaction.categoryName?.trim(), formatTxDate(lastTransaction.transactionDate)]
                    .filter(Boolean)
                    .join(' ')}
                </Text>
              </>
            ) : (
              <Text style={[styles.lastEmpty, { color: descMuted }]}>Henüz kayıt yok</Text>
            )}
          </View>
        </View>
      ) : null}

      <View style={styles.block}>
        <Text style={[styles.blockLabel, { color: labelSection }]}>Giriş kanalları</Text>
        <View style={styles.grid2}>
          <Pressable
            onPress={openReceipt}
            style={({ pressed }) => [
              styles.channelBtn,
              { borderColor: border, backgroundColor: channelInnerBg },
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons name="camera-outline" size={compact ? 28 : 32} color={accent} />
            <Text style={[styles.channelLabel, { color: accent }]}>Fiş tara</Text>
          </Pressable>
          <Pressable
            onPress={openVoiceTransaction}
            style={({ pressed }) => [
              styles.channelBtn,
              { borderColor: border, backgroundColor: channelInnerBg },
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons name="microphone-outline" size={compact ? 28 : 32} color={accent} />
            <Text style={[styles.channelLabel, { color: accent }]}>Sesle ekle</Text>
          </Pressable>
        </View>
      </View>

      {picks.length > 0 ? (
        <View style={styles.block}>
          <Text style={[styles.blockLabel, { color: labelSection }]}>Sık kullanılan kategoriler</Text>
          <View style={styles.catStack}>
            {picks.map((c) => {
              const label = formatExpenseCategoryLabel(c.name);
              return (
                <Pressable
                  key={c.name}
                  onPress={() =>
                    openChatPreset(`Hızlı ekle: ${label} kategorisinde harcama kaydı oluşturmak istiyorum.`)
                  }
                  style={({ pressed }) => [
                    styles.catRow,
                    {
                      borderColor: border,
                      backgroundColor: accentSoftBg,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons name="cart-outline" size={26} color={accent} />
                  <Text style={[styles.catRowLabel, { color: accent }]} numberOfLines={2}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <Text
          style={[
            styles.emptyCats,
            { color: descMuted, borderColor: themeColorAlpha(theme.colors.outline, isDark ? 0.45 : 0.55) },
          ]}
        >
          Henüz üst kategori yok; işlem ekledikçe burada kısayol önerileri görünür.
        </Text>
      )}

      <Pressable
        onPress={() => navigation.navigate('Transactions')}
        style={[
          styles.footerLink,
          { borderTopColor: themeColorAlpha(theme.colors.outline, isDark ? 0.35 : 0.5) },
        ]}
      >
        <Text style={[styles.footerText, { color: accent }]}>Tüm işlemleri gör →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  titleMain: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 13,
    marginBottom: 8,
  },
  desc: {
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 13,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 76,
  },
  statsColWide: {
    flex: 1.65,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  statsDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 2,
  },
  statsLabelLeft: {
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  statsLabelCaps: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  statsNum: {
    fontSize: 26,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  lastTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 0,
  },
  lastAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  lastFoot: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  lastEmpty: { fontSize: 12, marginTop: 6 },
  block: { gap: 8, marginBottom: 14 },
  blockLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  grid2: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
    width: '100%',
  },
  channelBtn: {
    flex: 1,
    minHeight: 100,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 10,
  },
  channelLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  catStack: { gap: 10, width: '100%' },
  catRow: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 76,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  catRowLabel: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: '92%',
    lineHeight: 20,
  },
  emptyCats: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 4,
  },
  footerLink: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: { fontSize: 14, fontWeight: '600' },
});
