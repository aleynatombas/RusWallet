import { View, Text, Pressable, StyleSheet, DeviceEventEmitter } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getCardShadow } from '../theme/cardShadow';
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

  const titleMuted = isDark ? '#94a3b8' : '#334155';
  const descMuted = isDark ? '#94a3b8' : '#64748b';
  const fg = isDark ? '#ffffff' : '#0f172a';
  const cardBg = isDark ? theme.colors.surface : '#ffffff';
  const border = isDark ? 'rgba(148, 163, 184, 0.14)' : '#e2e8f0';
  const showStats = typeof monthTransactionCount === 'number';
  const labelSection = isDark ? '#94a3b8' : '#475569';

  const blue = '#2563eb';
  const violetIcon = '#7c3aed';
  const violetText = isDark ? '#c4b5fd' : '#5b21b6';
  const catGreen = '#047857';
  const catGreenBg = isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5';

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
              borderColor: isDark ? 'rgba(148,163,184,0.2)' : '#e5e7eb',
              backgroundColor: isDark ? theme.colors.background : '#fafafa',
            },
          ]}
        >
          <View style={styles.statsCol}>
            <Text style={[styles.statsLabelCaps, { color: labelSection }]}>{periodTransactionLabel}</Text>
            <Text style={[styles.statsNum, { color: fg }]}>{monthTransactionCount}</Text>
          </View>
          <View style={[styles.statsDivider, { backgroundColor: isDark ? 'rgba(148,163,184,0.25)' : '#e5e7eb' }]} />
          <View style={styles.statsColWide}>
            <Text style={[styles.statsLabelCaps, styles.statsLabelLeft, { color: labelSection }]}>Son işlem</Text>
            {lastTransaction ? (
              <>
                <Text style={[styles.lastTitle, { color: fg }]} numberOfLines={2}>
                  {lastTransaction.description?.trim() || '—'}
                </Text>
                <Text
                  style={[
                    styles.lastAmount,
                    { color: lastTransaction.isIncome ? '#059669' : '#dc2626' },
                  ]}
                >
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
              { borderColor: border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff' },
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons name="camera-outline" size={compact ? 28 : 32} color={blue} />
            <Text style={[styles.channelLabel, { color: blue }]}>Fiş tara</Text>
          </Pressable>
          <Pressable
            onPress={openVoiceTransaction}
            style={({ pressed }) => [
              styles.channelBtn,
              { borderColor: border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff' },
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons name="microphone-outline" size={compact ? 28 : 32} color={violetIcon} />
            <Text style={[styles.channelLabel, { color: violetText }]}>Sesle ekle</Text>
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
                      backgroundColor: catGreenBg,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons name="cart-outline" size={26} color={catGreen} />
                  <Text style={[styles.catRowLabel, { color: catGreen }]} numberOfLines={2}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <Text style={[styles.emptyCats, { color: descMuted, borderColor: isDark ? 'rgba(148,163,184,0.3)' : 'rgba(15,23,42,0.15)' }]}>
          Henüz üst kategori yok; işlem ekledikçe burada kısayol önerileri görünür.
        </Text>
      )}

      <Pressable onPress={() => navigation.navigate('Transactions')} style={styles.footerLink}>
        <Text style={[styles.footerText, { color: '#6366f1' }]}>Tüm işlemleri gör →</Text>
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
    borderTopColor: 'rgba(148,163,184,0.25)',
  },
  footerText: { fontSize: 14, fontWeight: '600' },
});
