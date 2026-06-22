import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { webPaletteMobile } from '../theme/webPaletteMobile';

function formatTry(n: number): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

interface MobileDashboardStatusCardProps {
  lifetimeBalance: number;
  lifetimeTotalIncome: number;
  lifetimeTotalExpense: number;
  monthlyIncome: number;
  monthlyExpense: number;
  isDark: boolean;
}

const C = {
  emerald: { light: '#059669', dark: '#34d399', bgL: 'rgba(16, 185, 129, 0.07)', bgD: 'rgba(16, 185, 129, 0.12)', borderL: 'rgba(16, 185, 129, 0.25)', borderD: 'rgba(52, 211, 153, 0.25)' },
  red: { light: '#dc2626', dark: '#f87171', bgL: 'rgba(239, 68, 68, 0.06)', bgD: 'rgba(239, 68, 68, 0.1)', borderL: 'rgba(239, 68, 68, 0.25)', borderD: 'rgba(248, 113, 113, 0.25)' },
  amber: { light: '#d97706', dark: '#fcd34d', bgL: 'rgba(245, 158, 11, 0.08)', bgD: 'rgba(245, 158, 11, 0.1)', borderL: 'rgba(245, 158, 11, 0.3)', borderD: 'rgba(252, 211, 77, 0.3)' },
};

export function MobileDashboardStatusCard({
  lifetimeBalance,
  lifetimeTotalIncome,
  lifetimeTotalExpense,
  monthlyIncome,
  monthlyExpense,
  isDark,
}: MobileDashboardStatusCardProps) {
  const monthNet = monthlyIncome - monthlyExpense;
  const fg = isDark ? '#f8fafc' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)';

  const primary = isDark ? webPaletteMobile.dark.primary : webPaletteMobile.light.primary;
  const primaryBg = isDark ? 'rgba(36,173,219,0.08)' : 'rgba(25,117,154,0.08)';
  const primaryBr = isDark ? 'rgba(36,173,219,0.25)' : 'rgba(25,117,154,0.25)';
  const em = primary;
  const emBg = primaryBg;
  const emBr = primaryBr;
  const rd = isDark ? '#ef4444' : '#dc2626';
  const rdBg = isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)';
  const rdBr = isDark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.25)';
  const netPos = monthNet >= 0;
  const am = primary;
  const amBg = primaryBg;
  const amBr = primaryBr;

  return (
    <View style={[styles.wrap, { backgroundColor: cardBg, borderColor: border }]}>
      <Text style={[styles.label, { color: muted }]}>TOPLAM BAKİYE</Text>
      <Text style={[styles.bigBalance, { color: fg }]}>₺{formatTry(lifetimeBalance)}</Text>
      <Text style={[styles.para, { color: muted }]}>
        Bu rakam <Text style={{ fontWeight: '600', color: fg }}>tüm zamanların</Text> netidir. Alttaki yeşil/kırmızı tutarlar{' '}
        <Text style={{ fontWeight: '600', color: fg }}>yalnızca bu ay</Text> içindir.
      </Text>
      <View style={[styles.lifetimeRow, { borderColor: isDark ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.45)', backgroundColor: isDark ? 'rgba(30,41,59,0.35)' : 'rgba(241,245,249,0.6)' }]}>
        <Text style={[styles.lifetimeText, { color: muted }]}>
          <Text style={{ color: fg }}>Tüm zamanlar:</Text> ₺{formatTry(lifetimeTotalIncome)} − ₺{formatTry(lifetimeTotalExpense)} ={' '}
          <Text style={{ fontWeight: '600', color: fg }}>₺{formatTry(lifetimeBalance)}</Text>
        </Text>
      </View>

      <Text style={[styles.sectionLabel, { color: muted, marginTop: 24 }]}>BU AY ÖZETİ</Text>
      <View style={styles.row2}>
        <View style={[styles.tile, { backgroundColor: emBg, borderColor: emBr }]}>
          <View style={styles.tileHead}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(52,211,153,0.15)' : 'rgba(16,185,129,0.15)' }]}>
              <MaterialCommunityIcons name="arrow-top-right" size={20} color={em} />
            </View>
            <Text style={[styles.tileTitle, { color: em }]}>Gelir</Text>
          </View>
          <Text style={[styles.tileAmt, { color: em }]}>₺{formatTry(monthlyIncome)}</Text>
          <Text style={[styles.tileHint, { color: muted }]}>Bu ay</Text>
        </View>
        <View style={[styles.tile, { backgroundColor: rdBg, borderColor: rdBr }]}>
          <View style={styles.tileHead}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(248,113,113,0.15)' : 'rgba(239,68,68,0.15)' }]}>
              <MaterialCommunityIcons name="arrow-bottom-right" size={20} color={rd} />
            </View>
            <Text style={[styles.tileTitle, { color: rd }]}>Gider</Text>
          </View>
          <Text style={[styles.tileAmt, { color: rd }]}>₺{formatTry(monthlyExpense)}</Text>
          <Text style={[styles.tileHint, { color: muted }]}>Bu ay</Text>
        </View>
      </View>

      <View style={[styles.netRow, { borderColor: netPos ? emBr : amBr, backgroundColor: netPos ? emBg : amBg }]}>
        <MaterialCommunityIcons name="equal" size={18} color={muted} style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.netLabel, { color: muted }]}>BU AY NET</Text>
          <Text style={[styles.netAmt, { color: netPos ? em : am }]}>₺{formatTry(monthNet)}</Text>
          <Text style={[styles.tileHint, { color: muted }]}>Bu ay gelir − bu ay gider</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  bigBalance: { fontSize: 36, fontWeight: '600', marginTop: 8, letterSpacing: -0.5 },
  para: { fontSize: 13, lineHeight: 20, marginTop: 10 },
  lifetimeRow: { marginTop: 12, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  lifetimeText: { fontSize: 11, fontVariant: ['tabular-nums'] },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  row2: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 12 },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  iconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  tileAmt: { fontSize: 20, fontWeight: '600', fontVariant: ['tabular-nums'] },
  tileHint: { fontSize: 11, marginTop: 4 },
  netRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 12 },
  netLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  netAmt: { fontSize: 18, fontWeight: '600', fontVariant: ['tabular-nums'], marginTop: 2 },
});
