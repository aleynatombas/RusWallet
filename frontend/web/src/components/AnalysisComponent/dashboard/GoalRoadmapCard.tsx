import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarClock, Check, Flag, Loader2, Pencil, PiggyBank, Plus, Target } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatGoalTitleDisplay } from '@/lib/formatDisplayName';
import type { OnboardingStateDto, UserFinancialProfilePayload } from '@/types/onboarding';
import { fmtTry, InsightCardShell } from '../insights/InsightCardShell';

interface Props {
  profile: UserFinancialProfilePayload | null;
  /** Hedef tutarı: profildeki tutar ya da hedef metninden çıkarılan tutar. */
  targetAmount: number | null;
  /** Genel bakiye (gelir − gider, tüm kayıtlar) — "biriktirilen" olarak kullanılır. */
  balance: number;
  /** Bu ay kayıtlı gelir − gider (yoksa tanıtımdaki gelir − sabit gider). */
  monthlyDisposableCap: number;
  disposableSource: 'records' | 'onboarding';
  defaultAllocation: number;
  onProfileUpdated: (profile: UserFinancialProfilePayload | null) => void;
  expanded?: boolean;
  className?: string;
}

function etaLabel(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

function niceStep(max: number) {
  if (max <= 2_000) return 50;
  if (max <= 10_000) return 100;
  if (max <= 50_000) return 250;
  return 1_000;
}

/** Hedef ve yol haritası: hedef, biriken, kalan, ilerleme, aylık birikim (kaydedilir) ve tahmini bitiş. */
export function GoalRoadmapCard({
  profile,
  targetAmount,
  balance,
  monthlyDisposableCap,
  disposableSource,
  defaultAllocation,
  onProfileUpdated,
  expanded = false,
  className,
}: Props) {
  const location = useLocation();
  const goalName = profile?.mainGoal?.trim() || '';
  const savedContribution = profile?.monthlyGoalContribution != null && profile.monthlyGoalContribution > 0
    ? Number(profile.monthlyGoalContribution)
    : null;

  const [allocation, setAllocation] = useState(savedContribution ?? defaultAllocation);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    setAllocation(savedContribution ?? defaultAllocation);
  }, [savedContribution, defaultAllocation]);

  const saved = Math.max(0, balance);
  const target = targetAmount ?? 0;
  const remaining = Math.max(0, target - saved);
  const progress = target > 0 ? Math.min(100, (saved / target) * 100) : 0;

  const sliderMax = useMemo(() => {
    const base = Math.max(monthlyDisposableCap, savedContribution ?? 0, allocation, 1_000);
    const capped = remaining > 0 ? Math.min(base, Math.max(remaining, 1_000)) : base;
    const step = niceStep(capped);
    return Math.max(step, Math.ceil(capped / step) * step);
  }, [monthlyDisposableCap, savedContribution, allocation, remaining]);
  const step = niceStep(sliderMax);

  const months = remaining > 0 && allocation > 0 ? Math.ceil(remaining / allocation) : null;
  const dirty = Math.round(allocation) !== Math.round(savedContribution ?? -1);
  const overBudget = disposableSource === 'records' && monthlyDisposableCap > 0 && allocation > monthlyDisposableCap;

  const saveAllocation = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await api.post<OnboardingStateDto>('/Onboarding/update-profile', {
        monthlyGoalContribution: Math.max(0, Math.round(allocation)),
      });
      onProfileUpdated(res.data?.profile ?? null);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2_000);
    } catch {
      setSaveError('Kaydedilemedi, tekrar dene.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <InsightCardShell
        title="Hedeflerim"
        icon={<Target className="h-4 w-4" aria-hidden />}
        expanded={expanded}
        className={className}
      >
        {!goalName ? (
          <div id="finans-hedef" className="flex flex-1 scroll-mt-16 flex-col items-center justify-center gap-2 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Flag className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Henüz bir hedefin yok</p>
              <p className="mx-auto max-w-xs text-[11px] leading-snug text-muted-foreground">
                Tatil, acil durum fonu ya da yeni bir telefon… Bir hedef belirle, her ay ne kadar ayırman gerektiğini ve ne zaman
                ulaşacağını birlikte görelim.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              <Button size="sm" className="h-7 gap-1 px-2.5 text-[11px]" onClick={() => setEditOpen(true)}>
                <Plus className="h-3 w-3" aria-hidden /> Hedef oluştur
              </Button>
              <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-[11px]">
                <Link to="/onboarding" state={{ background: location }}>
                  Tanıtımı tekrar aç
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className={cn('flex min-h-0 flex-1 flex-col', expanded ? 'gap-4' : 'gap-1.5 overflow-y-auto pr-0.5')}>
            {/* Hedef başlığı */}
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
                  expanded ? 'h-11 w-11' : 'h-8 w-8'
                )}
                aria-hidden
              >
                <Flag className={expanded ? 'h-5 w-5' : 'h-4 w-4'} />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('line-clamp-2 font-semibold leading-tight text-foreground', expanded ? 'text-lg' : 'text-sm')}>
                  {formatGoalTitleDisplay(goalName.slice(0, 120))}
                </p>
                <p className={cn('text-muted-foreground', expanded ? 'text-xs' : 'text-[10px]')}>
                  {target > 0 ? `Hedef: ${fmtTry(target)}` : 'Hedef tutarı henüz girilmedi'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 shrink-0 gap-1 px-2 text-[10px]"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3 w-3" aria-hidden /> Düzenle
              </Button>
            </div>

            {target <= 0 ? (
              <div className="rounded-md border border-dashed border-border p-2 text-[11px] text-muted-foreground">
                İlerlemeni ve tahmini bitiş tarihini hesaplayabilmemiz için hedefine bir tutar ekle.
                <Button size="sm" variant="outline" className="ml-2 h-6 px-2 text-[10px]" onClick={() => setEditOpen(true)}>
                  Tutar ekle
                </Button>
              </div>
            ) : (
              <>
                {/* İlerleme */}
                <div>
                  <div className="flex items-center gap-2">
                    <p className={cn('shrink-0 font-bold tabular-nums leading-none text-foreground', expanded ? 'text-3xl' : 'text-lg')}>
                      %{Math.floor(progress)}
                      <span className={cn('ml-1 font-normal text-muted-foreground', expanded ? 'text-xs' : 'text-[10px]')}>tamamlandı</span>
                    </p>
                    <div
                      className={cn('min-w-0 flex-1 overflow-hidden rounded-full bg-muted', expanded ? 'h-3' : 'h-2')}
                      role="progressbar"
                      aria-label="Hedef ilerlemesi"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.floor(progress)}
                    >
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className={cn('grid grid-cols-3', expanded ? 'mt-3 gap-2.5' : 'mt-1.5 gap-1.5')}>
                    <Mini label="Hedef" value={fmtTry(target)} large={expanded} />
                    <Mini label="Biriktirilen" value={fmtTry(saved)} hint="Kayıtlı tüm gelirlerin − giderlerin (bakiyen)" large={expanded} />
                    <Mini label="Kalan" value={fmtTry(remaining)} strong large={expanded} />
                  </div>
                  {balance < 0 ? (
                    <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-300">
                      Kayıtlı giderlerin gelirlerinden fazla; biriken tutar sıfır kabul edildi.
                    </p>
                  ) : null}
                </div>

                {remaining <= 0 ? (
                  <p className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                    <Check className="h-3.5 w-3.5" aria-hidden /> Tebrikler, bakiyen hedef tutarına ulaştı.
                  </p>
                ) : (
                  <div className={cn('rounded-md border border-border/70 bg-background/40 dark:bg-background/20', expanded ? 'p-3.5' : 'p-2')}>
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="goal-monthly" className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <PiggyBank className="h-3.5 w-3.5" aria-hidden /> Aylık birikim
                      </label>
                      <div className="flex items-center gap-1">
                        <Input
                          id="goal-monthly"
                          inputMode="numeric"
                          value={allocation > 0 ? Math.round(allocation).toLocaleString('tr-TR') : ''}
                          placeholder="0"
                          onChange={(e) => {
                            const n = Number(e.target.value.replace(/\D/g, ''));
                            setAllocation(Number.isFinite(n) ? Math.min(n, 100_000_000) : 0);
                          }}
                          className="h-7 w-24 rounded-md px-2 text-right text-xs font-semibold tabular-nums"
                          aria-describedby="goal-eta"
                        />
                        <span className="text-xs text-muted-foreground">₺</span>
                      </div>
                    </div>
                    <Slider
                      aria-label="Aylık birikim tutarı"
                      value={[Math.min(allocation, sliderMax)]}
                      onValueChange={(v) => setAllocation(v[0] ?? 0)}
                      min={0}
                      max={sliderMax}
                      step={step}
                      className="mt-2 w-full py-0.5"
                      trackClassName="h-1 bg-muted"
                      rangeClassName="bg-primary"
                      thumbClassName="h-3.5 w-3.5 border-0 bg-primary shadow-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                    />

                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <div id="goal-eta" className="flex min-w-0 items-center gap-1.5" role="status">
                        <CalendarClock className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                        {months != null ? (
                          <p className="min-w-0 text-[11px] leading-snug text-foreground">
                            Tahmini tamamlanma: <b className="capitalize">{etaLabel(months)}</b>
                            <span className="text-muted-foreground"> · {months} ay</span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">Tarih için aylık bir tutar gir.</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {saveError ? <span className="text-[10px] text-destructive">{saveError}</span> : null}
                        {justSaved ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300">
                            <Check className="h-3 w-3" aria-hidden /> Kaydedildi
                          </span>
                        ) : null}
                        {dirty ? (
                          <Button size="sm" className="h-6 gap-1 px-2 text-[10px]" onClick={() => void saveAllocation()} disabled={saving}>
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
                            Planı kaydet
                          </Button>
                        ) : savedContribution != null && !justSaved ? (
                          <span className="text-[10px] text-muted-foreground">Kayıtlı plan</span>
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                      {monthlyDisposableCap > 0
                        ? `${disposableSource === 'records' ? 'Bu ayki gelir − giderin' : 'Tanıtımda verdiğin gelir − sabit gider farkın'}: ${fmtTry(monthlyDisposableCap)}.`
                        : disposableSource === 'records'
                          ? 'Bu ay kayıtlı giderlerin gelirini karşılıyor ya da aşıyor; ayırabileceğin tutarı gerçekçi seç.'
                          : 'Gelirini kaydedersen ne kadar ayırabileceğini de gösterebiliriz.'}
                      {overBudget ? <span className="text-amber-700 dark:text-amber-300"> Seçtiğin tutar bu farkın üzerinde.</span> : null}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </InsightCardShell>

      <GoalEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialName={goalName}
        initialAmount={profile?.savingsTargetAmount ?? targetAmount ?? null}
        onSaved={onProfileUpdated}
      />
    </>
  );
}

function Mini({
  label,
  value,
  strong = false,
  hint,
  large = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  hint?: string;
  large?: boolean;
}) {
  return (
    <div className={cn('min-w-0 rounded-md bg-muted/40', large ? 'px-3 py-2' : 'px-1.5 py-1')} title={hint}>
      <p className={cn('truncate text-muted-foreground', large ? 'text-[11px]' : 'text-[9px]')}>{label}</p>
      <p className={cn('truncate tabular-nums text-foreground', large ? 'text-base sm:text-lg' : 'text-xs', strong ? 'font-bold' : 'font-semibold')}>
        {value}
      </p>
    </div>
  );
}

function GoalEditDialog({
  open,
  onOpenChange,
  initialName,
  initialAmount,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialName: string;
  initialAmount: number | null;
  onSaved: (profile: UserFinancialProfilePayload | null) => void;
}) {
  const [name, setName] = useState(initialName);
  const [amount, setAmount] = useState(initialAmount ? String(Math.round(initialAmount)) : '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setAmount(initialAmount ? String(Math.round(initialAmount)) : '');
    setErr('');
  }, [open, initialName, initialAmount]);

  const amountNum = Number(amount.replace(/\D/g, ''));
  const valid = name.trim().length >= 2 && amountNum > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setErr('');
    try {
      const res = await api.post<OnboardingStateDto>('/Onboarding/update-profile', {
        mainGoal: name.trim(),
        savingsTargetAmount: amountNum,
      });
      onSaved(res.data?.profile ?? null);
      onOpenChange(false);
    } catch {
      setErr('Hedef kaydedilemedi. Lütfen tekrar dene.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialName ? 'Hedefi düzenle' : 'Yeni hedef'}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Hedefin, tanıtımda verdiğin bilgilerle aynı yerde saklanır; finans asistanı da bu hedefi bilir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3 px-4 py-4">
          <div className="space-y-1">
            <label htmlFor="goal-name" className="text-xs font-medium text-muted-foreground">
              Hedefin
            </label>
            <Input
              id="goal-name"
              value={name}
              maxLength={120}
              placeholder="Örn. Yaz tatili, acil durum fonu"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="goal-amount" className="text-xs font-medium text-muted-foreground">
              Hedef tutarı (₺)
            </label>
            <Input
              id="goal-amount"
              inputMode="numeric"
              value={amount ? Number(amount.replace(/\D/g, '')).toLocaleString('tr-TR') : ''}
              placeholder="Örn. 50.000"
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 11))}
            />
          </div>
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" size="sm" disabled={!valid || busy} className="gap-1">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
              Kaydet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
