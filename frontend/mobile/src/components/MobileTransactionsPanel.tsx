/**
 * Web `TransactionsPanel` ile aynı: bu ay işlemleri, arama, hızlı ekle (kategori + tutar + Gelir/Gider), PATCH düzenleme.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  DeviceEventEmitter,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { TextInput, Button, Card, useTheme } from 'react-native-paper';
import { api, getApiErrorMessage } from '../services/api';
import { CARD_SHADOW_BLEED, getCardShadow } from '../theme/cardShadow';
import type { TransactionRow } from '../types/dashboard';
import { getCurrentMonthRangeStrings } from '../lib/monthRange';
import {
  formatExpenseCategoryLabel,
  formatIncomeCategoryLabel,
  formatTransactionCategoryLabel,
} from '../lib/formatExpenseCategoryLabel';
import { buildQuickCategorySuggestionPool, quickCategoryViolatesType } from '../lib/quickCategoryPresets';

interface MobileTransactionsPanelProps {
  onTransactionChange?: () => void;
}

interface CategoryOption {
  categoryId: number;
  name: string;
  isIncome: boolean;
}

function parseTrAmount(raw: string): number | null {
  const n = parseFloat(raw.replace(/\s/g, '').replace(/\./g, '').replace(',', '.'));
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}

function transactionMatchesQuery(t: TransactionRow, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  const desc = (t.description ?? '').toLowerCase();
  const cat = (t.categoryName ?? '').toLowerCase();
  const d = new Date(t.transactionDate);
  const iso = d.toISOString().slice(0, 10);
  const tr = d.toLocaleDateString('tr-TR');
  return desc.includes(q) || cat.includes(q) || iso.includes(q) || tr.toLowerCase().includes(q);
}

export function MobileTransactionsPanel({ onTransactionChange }: MobileTransactionsPanelProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarH = useBottomTabBarHeight();

  const [monthTx, setMonthTx] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [quickCategory, setQuickCategory] = useState('');
  const [categorySuggestOpen, setCategorySuggestOpen] = useState(false);

  const [editing, setEditing] = useState<TransactionRow | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCategorySuggestOpen, setEditCategorySuggestOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const muted = theme.colors.onSurfaceVariant;
  const fg = theme.colors.onSurface;
  const border = theme.colors.outlineVariant;
  const cardBg = theme.colors.surface;
  const cardShadow = getCardShadow(theme.dark);

  const loadCategories = useCallback(async () => {
    try {
      const res = await api.get<CategoryOption[]>('/Category');
      setCategories(res.data ?? []);
    } catch {
      setCategories([]);
    }
  }, []);

  /** Web `TransactionsPanel.loadMonth` ile aynı: sadece bu ay (start/end). */
  const loadMonth = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const { start, end } = getCurrentMonthRangeStrings();
      const res = await api.get<TransactionRow[]>('/Transaction', { params: { start, end } });
      setMonthTx(res.data ?? []);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Veri yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMonth();
      void loadCategories();
    }, [loadMonth, loadCategories])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('ruswallet-transactions-changed', () => {
      void loadMonth();
      void loadCategories();
    });
    return () => sub.remove();
  }, [loadMonth, loadCategories]);

  const filtered = useMemo(() => monthTx.filter((t) => transactionMatchesQuery(t, search)), [monthTx, search]);

  const sortedFiltered = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      ),
    [filtered]
  );

  const suggestionPool = useMemo(
    () => buildQuickCategorySuggestionPool(categories.map((c) => c.name)),
    [categories]
  );

  /** `txRow` ile aynı; görünür alanda tam 3 satır, fazlası içeride kayar */
  const TX_ROW_MIN = 88;
  const LIST_VISIBLE_ROWS = 3;
  const listViewportHeight = TX_ROW_MIN * LIST_VISIBLE_ROWS;

  /** Klavyesiz seçim: tam öneri havuzu (yazı süzgeci yok) */
  const quickCategoryList = suggestionPool;
  const editCategoryList = suggestionPool;

  const amountValid = useMemo(() => parseTrAmount(amount) != null, [amount]);

  function openEdit(t: TransactionRow) {
    setError('');
    setEditing(t);
    setEditAmount(t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setEditCategory((t.categoryName ?? '').trim());
    setEditCategorySuggestOpen(false);
  }

  function pickEditSuggestion(label: string) {
    setEditCategory(label);
    setEditCategorySuggestOpen(false);
  }

  function closeEdit() {
    if (editSaving) return;
    setEditing(null);
  }

  async function saveEdit() {
    if (!editing) return;
    const n = parseTrAmount(editAmount);
    if (n == null) {
      setError('Geçerli bir tutar girin.');
      return;
    }
    const catName = editCategory.trim();
    if (!catName) {
      setError('Listeden kategori seçin.');
      return;
    }
    const presetErr = quickCategoryViolatesType(catName, editing.isIncome);
    if (presetErr) {
      setError(presetErr);
      return;
    }
    const hit = categories.find(
      (c) => c.name.trim().toLowerCase() === catName.toLowerCase() && c.isIncome === editing.isIncome
    );
    setEditSaving(true);
    setError('');
    try {
      let categoryId = hit?.categoryId;
      if (categoryId == null) {
        const ensure = await api.post<{ categoryId: number }>('/Category/ensure', {
          name: catName,
          isIncome: editing.isIncome,
        });
        categoryId = ensure.data.categoryId;
      }
      await api.patch(`/Transaction/${editing.transactionId}`, {
        amount: n,
        categoryId,
      });
      setEditing(null);
      await loadMonth();
      await loadCategories();
      onTransactionChange?.();
      DeviceEventEmitter.emit('ruswallet-transactions-changed');
    } catch (e) {
      setError(getApiErrorMessage(e, 'Güncellenemedi.'));
    } finally {
      setEditSaving(false);
    }
  }

  function pickSuggestion(label: string) {
    setQuickCategory(label);
    setCategorySuggestOpen(false);
  }

  async function submitQuick(income: boolean) {
    const n = parseTrAmount(amount);
    if (n == null) {
      setError('Geçerli bir tutar girin.');
      return;
    }
    const catName = quickCategory.trim();
    if (!catName) {
      setError('Listeden kategori seçin.');
      return;
    }
    const presetErr = quickCategoryViolatesType(catName, income);
    if (presetErr) {
      setError(presetErr);
      return;
    }
    const hit = categories.find(
      (c) => c.name.trim().toLowerCase() === catName.toLowerCase() && c.isIncome === income
    );
    setSubmitting(true);
    setError('');
    try {
      let categoryId = hit?.categoryId;
      if (categoryId == null) {
        const ensure = await api.post<{ categoryId: number }>('/Category/ensure', {
          name: catName,
          isIncome: income,
        });
        categoryId = ensure.data.categoryId;
      }
      const labelFmt = income ? formatIncomeCategoryLabel(catName) : formatExpenseCategoryLabel(catName);
      const description = `${labelFmt} — hızlı giriş`;
      await api.post('/Transaction/add', {
        amount: n,
        description,
        transactionDate: new Date().toISOString(),
        isIncome: income,
        categoryId,
      });
      setAmount('');
      setQuickCategory('');
      await loadMonth();
      await loadCategories();
      onTransactionChange?.();
      DeviceEventEmitter.emit('ruswallet-transactions-changed');
    } catch (e) {
      setError(getApiErrorMessage(e, 'Kaydedilemedi.'));
    } finally {
      setSubmitting(false);
    }
  }

  const bottomPad = tabBarH + Math.max(insets.bottom, 8) + 16;
  /** Üst gölge kesilmesin; kart başlıktan biraz ayrılsın (iOS shadow alanı). */
  const scrollTopPad = 12;

  const renderTxRow = useCallback(
    (t: TransactionRow) => (
      <View style={[styles.txRow, { borderBottomColor: border }]}>
        <View style={styles.txMain}>
          <Text style={[styles.txDesc, { color: fg }]} numberOfLines={2}>
            {t.description}
          </Text>
          <Text style={[styles.txSub, { color: muted }]}>
            {formatTransactionCategoryLabel(t.categoryName, t.isIncome)}
            {' · '}
            {new Date(t.transactionDate).toLocaleString('tr-TR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmt, t.isIncome ? styles.txIn : styles.txOut]}>
            {t.isIncome ? '+' : '−'}
            {t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
          </Text>
          <Button mode="outlined" compact onPress={() => openEdit(t)} style={styles.updateBtn}>
            Güncelle
          </Button>
        </View>
      </View>
    ),
    [border, fg, muted]
  );

  return (
    <>
      <ScrollView
        style={styles.scrollRoot}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: scrollTopPad,
            paddingBottom: bottomPad,
            paddingHorizontal: CARD_SHADOW_BLEED,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {error ? (
          <Text style={[styles.errorBanner, { color: theme.colors.error }]} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <View style={[styles.listCard, cardShadow, { backgroundColor: cardBg, borderColor: border }]}>
          <View
            style={[
              styles.searchWrap,
              { borderColor: border, backgroundColor: theme.dark ? 'rgba(255,255,255,0.06)' : cardBg },
            ]}
          >
            <MaterialCommunityIcons name="magnify" size={18} color={muted} style={styles.searchIcon} />
            <TextInput
              mode="flat"
              placeholder="Tarih, işlem adı veya kategori ara…"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              autoCorrect={false}
            />
          </View>

          <Text style={[styles.listSectionTitle, { color: muted }]}>Son işlemlerim</Text>

          {loading ? (
            <View style={[styles.listPlaceholder, { minHeight: listViewportHeight }]}>
              <Text style={[styles.emptyLikeWeb, { color: muted }]}>Yükleniyor…</Text>
            </View>
          ) : sortedFiltered.length === 0 ? (
            <View style={[styles.listPlaceholder, { minHeight: listViewportHeight }]}>
              <Text style={[styles.emptyLikeWeb, { color: muted }]}>
                {search.trim() ? 'Eşleşen işlem yok.' : 'Bu ay henüz işlem yok.'}
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.listScrollShell,
                { borderColor: border, height: listViewportHeight },
              ]}
            >
              <ScrollView
                style={styles.listInner}
                contentContainerStyle={styles.listContent}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
              >
                {sortedFiltered.map((t) => (
                  <View key={t.transactionId}>{renderTxRow(t)}</View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <Card
          style={[styles.quickCard, cardShadow, { backgroundColor: cardBg, borderColor: border, overflow: 'visible' }]}
          mode="outlined"
        >
          <Card.Title
            title="Hızlı ekle"
            subtitle="Kategoriyi listeden seçin; kayıt türünü Gelir veya Gider ile belirleyin."
            titleStyle={{ color: fg, fontSize: 18 }}
            subtitleStyle={{ color: muted, fontSize: 13, lineHeight: 18 }}
          />
          <Card.Content style={[styles.quickInner, { overflow: 'visible' }]}>
            <View style={[styles.fieldCol, { overflow: 'visible', zIndex: categorySuggestOpen ? 20 : 0 }]}>
              <Text style={[styles.label, { color: muted }]}>
                Kategori <Text style={{ color: theme.colors.error }}>*</Text>
              </Text>
              <View style={styles.categoryPickerShell}>
                <Pressable
                  onPress={() => setCategorySuggestOpen((o) => !o)}
                  style={({ pressed }) => [
                    styles.categoryTrigger,
                    { borderColor: border, backgroundColor: cardBg, opacity: pressed ? 0.92 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={quickCategory.trim() ? quickCategory : 'Kategori seçin'}
                >
                  <Text style={[styles.categoryTriggerText, { color: quickCategory.trim() ? fg : muted }]} numberOfLines={1}>
                    {quickCategory.trim() ? quickCategory : 'Kategori seçin'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={22} color={muted} />
                </Pressable>
                {categorySuggestOpen && quickCategoryList.length > 0 ? (
                  <View style={[styles.suggestPanelUp, { borderColor: border, backgroundColor: cardBg }]}>
                    <ScrollView
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      style={styles.suggestScroll}
                      showsVerticalScrollIndicator
                    >
                      <Pressable
                        onPress={() => {
                          setQuickCategory('');
                          setCategorySuggestOpen(false);
                        }}
                        style={({ pressed }) => [styles.suggestRow, pressed && { opacity: 0.85 }]}
                      >
                        <Text style={{ color: muted, fontSize: 13 }}>— Seçimi temizle —</Text>
                      </Pressable>
                      {quickCategoryList.map((label) => (
                        <Pressable
                          key={label}
                          onPress={() => pickSuggestion(label)}
                          style={({ pressed }) => [styles.suggestRow, pressed && { opacity: 0.85 }]}
                        >
                          <Text style={{ color: fg, fontSize: 14 }}>{label}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.fieldCol}>
              <Text style={[styles.label, { color: muted }]}>
                Tutar (TL) <Text style={{ color: theme.colors.error }}>*</Text>
              </Text>
              <TextInput
                mode="outlined"
                keyboardType="decimal-pad"
                placeholder="0,00"
                value={amount}
                onChangeText={setAmount}
                dense
              />
            </View>

            <View style={styles.quickBtns}>
              <Button
                mode="contained"
                disabled={submitting || !amountValid}
                loading={submitting}
                onPress={() => void submitQuick(true)}
                style={styles.quickBtnHalf}
              >
                Gelir
              </Button>
              <Button
                mode="outlined"
                disabled={submitting || !amountValid}
                onPress={() => void submitQuick(false)}
                style={styles.quickBtnHalf}
              >
                Gider
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {editing ? (
        <Modal visible transparent animationType="fade" onRequestClose={closeEdit}>
          <Pressable style={styles.modalBackdrop} onPress={closeEdit}>
            <Pressable
              style={[styles.modalCard, cardShadow, { backgroundColor: cardBg, borderColor: border }]}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={[styles.modalTitle, { color: fg }]}>İşlemi güncelle</Text>
              <Text style={[styles.modalSub, { color: muted }]} numberOfLines={2}>
                {editing.description}
              </Text>

              <Text style={[styles.label, { color: muted, marginTop: 16 }]}>Tutar (TL)</Text>
              <TextInput
                mode="outlined"
                keyboardType="decimal-pad"
                value={editAmount}
                onChangeText={setEditAmount}
                disabled={editSaving}
                dense
              />

              <Text style={[styles.label, { color: muted, marginTop: 12 }]}>
                Kategori <Text style={{ color: theme.colors.error }}>*</Text>
              </Text>
              <View style={[styles.fieldCol, { overflow: 'visible', zIndex: editCategorySuggestOpen ? 20 : 0 }]}>
                <View style={styles.categoryPickerShell}>
                  <Pressable
                    onPress={() => !editSaving && setEditCategorySuggestOpen((o) => !o)}
                    style={({ pressed }) => [
                      styles.categoryTrigger,
                      { borderColor: border, backgroundColor: cardBg, opacity: pressed ? 0.92 : 1 },
                    ]}
                    disabled={editSaving}
                    accessibilityRole="button"
                    accessibilityLabel={editCategory.trim() ? editCategory : 'Kategori seçin'}
                  >
                    <Text style={[styles.categoryTriggerText, { color: editCategory.trim() ? fg : muted }]} numberOfLines={1}>
                      {editCategory.trim() ? editCategory : 'Kategori seçin'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={22} color={muted} />
                  </Pressable>
                  {editCategorySuggestOpen && editCategoryList.length > 0 ? (
                    <View style={[styles.suggestPanelUp, { borderColor: border, backgroundColor: cardBg }]}>
                      <ScrollView
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                        style={styles.suggestScroll}
                        showsVerticalScrollIndicator
                      >
                        <Pressable
                          onPress={() => {
                            setEditCategory('');
                            setEditCategorySuggestOpen(false);
                          }}
                          style={({ pressed }) => [styles.suggestRow, pressed && { opacity: 0.85 }]}
                          disabled={editSaving}
                        >
                          <Text style={{ color: muted, fontSize: 13 }}>— Seçimi temizle —</Text>
                        </Pressable>
                        {editCategoryList.map((label) => (
                          <Pressable
                            key={label}
                            onPress={() => pickEditSuggestion(label)}
                            style={({ pressed }) => [styles.suggestRow, pressed && { opacity: 0.85 }]}
                            disabled={editSaving}
                          >
                            <Text style={{ color: fg, fontSize: 14 }}>{label}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={closeEdit} disabled={editSaving}>
                  İptal
                </Button>
                <Button mode="contained" onPress={() => void saveEdit()} loading={editSaving} disabled={editSaving}>
                  Kaydet
                </Button>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  scrollRoot: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  errorBanner: { fontSize: 13, marginBottom: 8 },
  listCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 8,
    overflow: 'visible',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    marginBottom: 12,
    minHeight: 44,
  },
  listSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  listPlaceholder: {
    justifyContent: 'center',
    paddingVertical: 16,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, backgroundColor: 'transparent', minHeight: 44 },
  /** Web `py-6 text-sm text-muted-foreground` */
  emptyLikeWeb: { paddingVertical: 8, paddingHorizontal: 4, fontSize: 14, textAlign: 'left', lineHeight: 20 },
  /** Web: `rounded-xl border border-border/60` içinde kaydırılan liste */
  listScrollShell: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  muted: { fontSize: 14 },
  /** Sabit yükseklik kabuğu içinde kaydırılan liste */
  listInner: { flex: 1 },
  listContent: {
    paddingBottom: 12,
    paddingHorizontal: 6,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 88,
    paddingVertical: 12,
    paddingHorizontal: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  txMain: { flex: 1, minWidth: 0, paddingRight: 4 },
  txDesc: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  txSub: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  txRight: { alignItems: 'flex-end', justifyContent: 'center', gap: 8, minWidth: 108 },
  txAmt: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
  txIn: { color: '#16a34a' },
  txOut: { color: '#dc2626' },
  updateBtn: { alignSelf: 'flex-end', marginTop: 2 },
  quickCard: { borderRadius: 12, marginTop: 10, marginBottom: 8 },
  quickInner: { gap: 12, paddingTop: 0 },
  fieldCol: { gap: 6 },
  label: { fontSize: 12, fontWeight: '500' },
  /** Liste tetikleyicinin üstünde (column-reverse: önce tetikleyici JSX’te) */
  categoryPickerShell: {
    position: 'relative',
    alignSelf: 'stretch',
    flexDirection: 'column-reverse',
  },
  categoryTrigger: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryTriggerText: {
    flexShrink: 1,
    fontSize: 16,
    marginRight: 4,
  },
  suggestPanelUp: {
    marginBottom: 8,
    maxHeight: 280,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  suggestScroll: {
    maxHeight: 280,
  },
  suggestRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148,163,184,0.2)',
  },
  quickBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  quickBtnHalf: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 16, padding: 20, borderWidth: StyleSheet.hairlineWidth, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalSub: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
});
