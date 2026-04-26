import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Camera, ChevronDown, Mic, Search } from 'lucide-react';
import { api } from '@/services/api';
import type { TransactionRow } from '@/types/dashboard';
import { getCurrentMonthRangeStrings } from '@/lib/monthRange';
import {
  formatExpenseCategoryLabel,
  formatIncomeCategoryLabel,
  formatTransactionCategoryLabel,
} from '@/lib/formatExpenseCategoryLabel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { PAGE_TITLE_CLASS, formatPageTitleDisplay } from '@/lib/pageTitle';
import { buildQuickCategorySuggestionPool, quickCategoryViolatesType } from '@/lib/quickCategoryPresets';

interface TransactionsPanelProps {
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
  return (
    desc.includes(q) || cat.includes(q) || iso.includes(q) || tr.toLowerCase().includes(q)
  );
}

export function TransactionsPanel({ onTransactionChange }: TransactionsPanelProps) {
  const location = useLocation();
  const [monthTx, setMonthTx] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [quickCategory, setQuickCategory] = useState('');
  const [categorySuggestOpen, setCategorySuggestOpen] = useState(false);
  const quickCategoryRef = useRef<HTMLDivElement | null>(null);

  const [editing, setEditing] = useState<TransactionRow | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCategorySuggestOpen, setEditCategorySuggestOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const editCategoryRef = useRef<HTMLDivElement | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const res = await api.get<CategoryOption[]>('/Category');
      setCategories(res.data ?? []);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadMonth = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const { start, end } = getCurrentMonthRangeStrings();
      const res = await api.get<TransactionRow[]>('/Transaction', { params: { start, end } });
      setMonthTx(res.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Veri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMonth();
  }, [loadMonth, location.pathname]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories, location.pathname]);

  useEffect(() => {
    const onGlobal = () => {
      void loadMonth();
      void loadCategories();
    };
    window.addEventListener('ruswallet-transactions-changed', onGlobal);
    return () => window.removeEventListener('ruswallet-transactions-changed', onGlobal);
  }, [loadMonth, loadCategories]);

  const filtered = useMemo(
    () => monthTx.filter((t) => transactionMatchesQuery(t, search)),
    [monthTx, search]
  );

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

  useEffect(() => {
    if (!categorySuggestOpen) return;
    const onDown = (e: MouseEvent) => {
      if (quickCategoryRef.current && !quickCategoryRef.current.contains(e.target as Node)) {
        setCategorySuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [categorySuggestOpen]);

  useEffect(() => {
    if (!editCategorySuggestOpen) return;
    const onDown = (e: MouseEvent) => {
      if (editCategoryRef.current && !editCategoryRef.current.contains(e.target as Node)) {
        setEditCategorySuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [editCategorySuggestOpen]);

  const amountValid = useMemo(() => parseTrAmount(amount) != null, [amount]);

  function openEdit(t: TransactionRow) {
    setError('');
    setEditing(t);
    setEditAmount(
      t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
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
      window.dispatchEvent(new Event('ruswallet-transactions-changed'));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Güncellenemedi.');
    } finally {
      setEditSaving(false);
    }
  }

  function pickSuggestion(label: string) {
    setQuickCategory(label);
    setCategorySuggestOpen(false);
  }

  function clearQuickCategorySelection() {
    setQuickCategory('');
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
      window.dispatchEvent(new Event('ruswallet-transactions-changed'));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative box-border flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-x-hidden overflow-y-hidden">
      {error ? (
        <p className="shrink-0 break-words text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <header className="mb-3 flex min-w-0 shrink-0 items-center justify-between gap-2 sm:mb-4 sm:gap-3">
        <h1 className={cn('min-w-0 flex-1', PAGE_TITLE_CLASS)}>
          {formatPageTitleDisplay('İşlemlerim')}
        </h1>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full border-transparent text-muted-foreground shadow-none hover:bg-accent hover:text-foreground"
            aria-label="Sesli komut"
            title="Sesle işlem ekle"
            onClick={() => window.dispatchEvent(new Event('ruswallet-open-voice'))}
          >
            <Mic className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full border-transparent text-muted-foreground shadow-none hover:bg-accent hover:text-foreground"
            aria-label="Fiş tarama"
            title="Fiş veya fotoğraf yükle"
            onClick={() => window.dispatchEvent(new Event('ruswallet-open-receipt'))}
          >
            <Camera className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col gap-3 overflow-hidden sm:gap-4">
        <Card className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-border/80">
          <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-4 sm:p-6">
            <div className="w-full min-w-0 max-w-full shrink-0 md:max-w-2xl">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tarih, işlem adı veya kategori ara…"
                  className="h-11 w-full rounded-full border-border/70 bg-background pl-10 pr-4 shadow-sm"
                  autoComplete="off"
                />
              </div>
            </div>
            {loading ? (
              <p className="py-6 text-left text-sm text-muted-foreground">Yükleniyor…</p>
            ) : sortedFiltered.length === 0 ? (
              <p className="py-6 text-left text-sm text-muted-foreground">
                {search.trim() ? 'Eşleşen işlem yok.' : 'Bu ay henüz işlem yok.'}
              </p>
            ) : (
              <>
                <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-border/60 [-webkit-overflow-scrolling:touch]">
                  <ul className="divide-y divide-border">
                    {sortedFiltered.map((t) => (
                      <li
                        key={t.transactionId}
                        className="flex flex-col gap-2 px-3 py-3 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-4"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="break-words font-medium leading-snug text-foreground">{t.description}</p>
                          <p className="break-words text-xs text-muted-foreground">
                            {formatTransactionCategoryLabel(t.categoryName, t.isIncome)}
                            {' · '}
                            {new Date(t.transactionDate).toLocaleString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex min-w-0 shrink-0 flex-col items-end gap-1.5 self-end sm:self-start">
                          <span
                            className={cn(
                              'text-right tabular-nums text-base font-semibold sm:text-sm',
                              t.isIncome ? 'text-primary' : 'text-rose-600'
                            )}
                          >
                            {t.isIncome ? '+' : '−'}
                            {t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => openEdit(t)}
                          >
                            Güncelle
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 shrink-0 border-border/80">
          <CardHeader className="space-y-1 px-4 pb-3 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-lg">Hızlı ekle</CardTitle>
            <CardDescription className="break-words text-pretty">
              Kayıt türünü Gelir veya Gider ile belirleyin.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="w-full min-w-0 max-w-3xl space-y-5">
              <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
                <div className="min-w-0 space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Kategori <span className="text-destructive">*</span>
                  </span>
                  <div ref={quickCategoryRef} className="relative z-20">
                    <button
                      type="button"
                      id="quick-category-trigger"
                      className={cn(
                        'flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm shadow-sm ring-offset-background transition-colors',
                        'hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                      )}
                      aria-haspopup="listbox"
                      aria-expanded={categorySuggestOpen}
                      aria-controls="quick-category-suggestions"
                      onClick={() => setCategorySuggestOpen((o) => !o)}
                    >
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate',
                          !quickCategory.trim() && 'text-muted-foreground'
                        )}
                      >
                        {quickCategory.trim() || 'Kategori seçin'}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                    </button>
                    {categorySuggestOpen ? (
                      <ul
                        id="quick-category-suggestions"
                        role="listbox"
                        className="absolute bottom-full left-0 right-0 z-30 mb-1 max-h-[min(17.5rem,50vh)] w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-elevation-lg dark:shadow-md"
                      >
                        <li role="option">
                          <button
                            type="button"
                            className="flex w-full break-words px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => clearQuickCategorySelection()}
                          >
                            — Seçimi temizle —
                          </button>
                        </li>
                        {suggestionPool.map((label) => (
                          <li key={label} role="option">
                            <button
                              type="button"
                              className="flex w-full break-words px-3 py-2 text-left text-sm hover:bg-muted"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => pickSuggestion(label)}
                            >
                              {label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label htmlFor="quick-amount" className="text-xs font-medium text-muted-foreground">
                    Tutar (TL) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="quick-amount"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-11 w-full rounded-lg text-base tabular-nums"
                    aria-required="true"
                    aria-invalid={!amountValid && amount.trim() !== ''}
                  />
                </div>
              </div>

              <div className="border-t border-border/60 pt-4">
                <div className="grid min-w-0 w-full max-w-md grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    type="button"
                    disabled={submitting || !amountValid}
                    onClick={() => void submitQuick(true)}
                  >
                    Gelir
                  </Button>
                  <Button
                    type="button"
                    disabled={submitting || !amountValid}
                    variant="outline"
                    onClick={() => void submitQuick(false)}
                  >
                    Gider
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {editing ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[220] bg-black/50"
            aria-label="Kapat"
            onClick={closeEdit}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tx-edit-title"
            className="fixed left-1/2 top-1/2 z-[221] max-h-[min(90dvh,100vh)] w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-4 text-card-foreground shadow-elevation-xl dark:shadow-2xl sm:p-6"
          >
            <h2 id="tx-edit-title" className="text-lg font-semibold leading-none">
              İşlemi güncelle
            </h2>
            <p className="mt-2 line-clamp-3 break-words text-sm text-muted-foreground sm:line-clamp-2">
              {editing.description}
            </p>
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void saveEdit();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Tutar (TL)</Label>
                <Input
                  id="edit-amount"
                  inputMode="decimal"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="h-11 tabular-nums"
                  autoComplete="off"
                  disabled={editSaving}
                />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Kategori <span className="text-destructive">*</span>
                </span>
                <div ref={editCategoryRef} className="relative z-[230]">
                  <button
                    type="button"
                    id="edit-category-trigger"
                    disabled={editSaving}
                    className={cn(
                      'flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm shadow-sm ring-offset-background transition-colors',
                      'hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      editSaving && 'pointer-events-none opacity-60'
                    )}
                    aria-haspopup="listbox"
                    aria-expanded={editCategorySuggestOpen}
                    aria-controls="edit-category-suggestions"
                    onClick={() => setEditCategorySuggestOpen((o) => !o)}
                  >
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate',
                        !editCategory.trim() && 'text-muted-foreground'
                      )}
                    >
                      {editCategory.trim() || 'Kategori seçin'}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                  </button>
                  {editCategorySuggestOpen ? (
                    <ul
                      id="edit-category-suggestions"
                      role="listbox"
                      className="absolute bottom-full left-0 right-0 z-[240] mb-1 max-h-[min(17.5rem,50vh)] w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-elevation-lg dark:shadow-md"
                    >
                      <li role="option">
                        <button
                          type="button"
                          className="flex w-full break-words px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setEditCategory('');
                            setEditCategorySuggestOpen(false);
                          }}
                        >
                          — Seçimi temizle —
                        </button>
                      </li>
                      {suggestionPool.map((label) => (
                        <li key={label} role="option">
                          <button
                            type="button"
                            className="flex w-full break-words px-3 py-2 text-left text-sm hover:bg-muted"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => pickEditSuggestion(label)}
                          >
                            {label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={closeEdit} disabled={editSaving}>
                  İptal
                </Button>
                <Button type="submit" disabled={editSaving}>
                  {editSaving ? 'Kaydediliyor…' : 'Kaydet'}
                </Button>
              </div>
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}
