import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useLocation, type Location } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import type { OnboardingAnswerResponseDto, OnboardingStateDto } from '@/types/onboarding';
import {
  filterGoalTextInput,
  getOnboardingInputKind,
  isValidGoalTextInput,
  sanitizeOnboardingAmountInput,
} from '@/lib/onboardingInput';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ChatLine = { role: 'assistant' | 'user'; text: string };

function formatInlineBold(text: string): ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {p}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

/** "Etiket: değer" satırlarını ayırır (ilk iki nokta üst üste) */
function splitSummaryLine(line: string): { label: string; value: string } {
  const idx = line.indexOf(':');
  if (idx === -1) return { label: '', value: line.trim() };
  return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
}

export type OnboardingDialogPhase = 'hub' | 'onboarding';

export type OnboardingPanelProps = {
  /** Tam sayfa (/onboarding) veya navbar dialog */
  variant?: 'page' | 'dialog';
  onClose?: () => void;
  /** Diyalog başlığı: özet mi yoksa tanıtım sohbeti mi (Navbar ile senkron). */
  onDialogPhaseChange?: (phase: OnboardingDialogPhase) => void;
};

export function OnboardingPanel({ variant = 'page', onClose, onDialogPhaseChange }: OnboardingPanelProps) {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { user, setOnboardingCompletedLocal, voluntaryProfileUpdate, setVoluntaryProfileUpdate } = useAuth();
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [hubMode, setHubMode] = useState(false);
  const [allowSkip, setAllowSkip] = useState(false);
  const [reopenBusy, setReopenBusy] = useState(false);
  const [summaryLines, setSummaryLines] = useState<string[] | null>(null);
  /** Sunucudaki soru adımı; tutar vs hedef metni giriş modu için. */
  const [stepIndex, setStepIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const isDialog = variant === 'dialog';
  /** /Onboarding/state (ve gerekirse abort-reopen) bitene kadar içerik gösterme — “Seni tanıyalım” bir karelik flaşını önler. */
  const [dialogStateReady, setDialogStateReady] = useState(false);

  const name = user?.firstName?.trim() || 'Merhaba';

  const pushAssistant = useCallback((text: string) => {
    setLines((prev) => [...prev, { role: 'assistant', text }]);
  }, []);

  const pushUser = useCallback((text: string) => {
    setLines((prev) => [...prev, { role: 'user', text }]);
  }, []);

  const bootstrapChat = useCallback(
    (data: OnboardingStateDto, mode: 'welcome' | 'resume' | 'update') => {
      const intro =
        mode === 'welcome'
          ? `Merhaba, ${name}! **Akıllı tanıtım** ile birkaç soruda profilini oluşturalım.`
          : mode === 'resume'
            ? `${name}, **Akıllı tanıtım**a kaldığın yerden devam edelim.`
            : `${name}, **Akıllı tanıtım** ile bilgilerini güncelleyelim.`;
      setLines([
        { role: 'assistant', text: intro },
        { role: 'assistant', text: data.assistantMessage },
      ]);
      setHubMode(false);
    },
    [name]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, hubMode]);

  useEffect(() => {
    if (!isDialog || !onDialogPhaseChange) return;
    onDialogPhaseChange(hubMode ? 'hub' : 'onboarding');
  }, [isDialog, hubMode, onDialogPhaseChange]);

  /* voluntaryProfileUpdate bağımlı değil: “Sohbetle güncelle” ile true olunca efekt yeniden koşmasın; yoksa abort-reopen sohbeti siler. */
  useEffect(() => {
    let cancelled = false;
    setDialogStateReady(false);
    const fromSparkleOverlay = Boolean(
      (routerLocation.state as { background?: Location } | null)?.background
    );

    (async () => {
      try {
        setLoadError('');
        let { data } = await api.get<OnboardingStateDto>('/Onboarding/state');
        if (cancelled) return;
        if (data.completed) {
          setOnboardingCompletedLocal(true);
          setSummaryLines(data.summaryLines ?? null);
          setHubMode(true);
          setAllowSkip(false);
          setLines([]);
          setDialogStateReady(true);
          return;
        }

        /* Sadece bu route’a yeni gelinirken: pırıltı overlay + oturumda yarım güncelleme varsa iptal → özet.
           voluntaryProfileUpdate bağımlılıkta olmadığı için “Sohbetle güncelle” tıklanınca efekt yeniden koşmaz, sohbet silinmez. */
        if (fromSparkleOverlay && voluntaryProfileUpdate) {
          try {
            await api.post('/Onboarding/abort-reopen');
            if (cancelled) return;
            setVoluntaryProfileUpdate(false);
            setOnboardingCompletedLocal(true);
            const res = await api.get<OnboardingStateDto>('/Onboarding/state');
            if (cancelled) return;
            data = res.data;
            if (data.completed) {
              setSummaryLines(data.summaryLines ?? null);
              setHubMode(true);
              setAllowSkip(false);
              setLines([]);
              setDialogStateReady(true);
              return;
            }
          } catch {
            /* aşağıda normal sohbet akışı */
          }
        }

        setStepIndex(data.stepIndex);
        setOnboardingCompletedLocal(false);
        /* İlk kayıt turunda atla; "Sohbetle güncelle" sonrası gönüllü turda gösterme */
        setAllowSkip(!voluntaryProfileUpdate);
        const chatMode =
          voluntaryProfileUpdate && data.stepIndex === 0
            ? 'update'
            : data.stepIndex > 0
              ? 'resume'
              : 'welcome';
        bootstrapChat(data, chatMode);
        setDialogStateReady(true);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Bağlantı hatası.');
          setDialogStateReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [name, bootstrapChat, setOnboardingCompletedLocal, routerLocation.key, routerLocation.state]);

  const onReopen = useCallback(async () => {
    setReopenBusy(true);
    setActionError('');
    try {
      await api.post('/Onboarding/reopen');
      setOnboardingCompletedLocal(false);
      setVoluntaryProfileUpdate(true);
      const { data } = await api.get<OnboardingStateDto>('/Onboarding/state');
      if (data.completed) {
        setVoluntaryProfileUpdate(false);
        setActionError('Yeniden açılamadı. Sayfayı yenileyip tekrar dene.');
        return;
      }
      setStepIndex(data.stepIndex);
      bootstrapChat(data, 'update');
    } catch (e) {
      setVoluntaryProfileUpdate(false);
      setActionError(e instanceof Error ? e.message : 'Bağlantı hatası.');
    } finally {
      setReopenBusy(false);
    }
  }, [bootstrapChat, setOnboardingCompletedLocal, setVoluntaryProfileUpdate]);

  const leaveOnboardingPage = useCallback(() => {
    const bg = (routerLocation.state as { background?: Location } | null)?.background;
    if (bg) navigate(-1);
    else navigate('/', { replace: true });
  }, [navigate, routerLocation.state]);

  /** “Seni tanıyalım” sohbetinden çık: gönüllü güncellemede iptal → özet hub’u; aksi halde sayfayı kapat. */
  const dismissSeniTaniyalim = useCallback(async () => {
    if (voluntaryProfileUpdate) {
      try {
        await api.post('/Onboarding/abort-reopen');
        setVoluntaryProfileUpdate(false);
        setOnboardingCompletedLocal(true);
        const { data } = await api.get<OnboardingStateDto>('/Onboarding/state');
        setSummaryLines(data.summaryLines ?? null);
        setStepIndex(data.stepIndex);
        setHubMode(true);
        setLines([]);
        setAllowSkip(false);
        setLoadError('');
        setInput('');
        setSending(false);
      } catch {
        if (isDialog) onClose?.();
        else leaveOnboardingPage();
      }
    } else {
      if (isDialog) onClose?.();
      else leaveOnboardingPage();
    }
  }, [
    voluntaryProfileUpdate,
    setVoluntaryProfileUpdate,
    setOnboardingCompletedLocal,
    isDialog,
    onClose,
    leaveOnboardingPage,
  ]);

  const finishAndGoHome = useCallback(() => {
    onClose?.();
    const bg = (routerLocation.state as { background?: Location } | null)?.background;
    if (bg) navigate(-1);
    else navigate('/', { replace: true });
  }, [navigate, onClose, routerLocation.state]);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const msg = input.trim();
      if (!msg || sending) return;
      if (getOnboardingInputKind(stepIndex) === 'goalText' && !isValidGoalTextInput(msg)) {
        pushAssistant(
          'Finansal hedefin ne? Sadece yazılı anlat; rakam veya tutar yazma. Bu hedef için TL tutarını bir sonraki adımda soracağım.'
        );
        return;
      }
      setInput('');
      pushUser(msg);
      setSending(true);
      try {
        const { data } = await api.post<OnboardingAnswerResponseDto>('/Onboarding/answer', {
          message: msg,
        });
        setStepIndex(data.nextStepIndex);
        pushAssistant(data.assistantReply);
        if (data.assistantMessageFollowUp) {
          pushAssistant(data.assistantMessageFollowUp);
        }
        if (data.completed) {
          setVoluntaryProfileUpdate(false);
          setOnboardingCompletedLocal(true);
          if (data.summaryLines?.length) {
            pushAssistant('Özet:\n' + data.summaryLines.map((l) => `• ${l.replace(/\*\*/g, '')}`).join('\n'));
          }
          setTimeout(() => finishAndGoHome(), 800);
        }
      } catch (err) {
        pushAssistant(err instanceof Error ? err.message : 'Gönderilemedi. Tekrar dene.');
      } finally {
        setSending(false);
      }
    },
    [input, sending, stepIndex, pushUser, pushAssistant, setOnboardingCompletedLocal, finishAndGoHome, setVoluntaryProfileUpdate]
  );

  const onSkip = useCallback(async () => {
    try {
      await api.post('/Onboarding/skip');
      setVoluntaryProfileUpdate(false);
      setOnboardingCompletedLocal(true);
      finishAndGoHome();
    } catch {
      pushAssistant('Şimdilik atlanamadı. İnternet bağlantını kontrol et.');
    }
  }, [setOnboardingCompletedLocal, finishAndGoHome, pushAssistant, setVoluntaryProfileUpdate]);

  const inputKind = getOnboardingInputKind(stepIndex);
  const placeholder = useMemo(
    () =>
      inputKind === 'amount' ? 'Tutarı yaz' : 'Kısaca yaz',
    [inputKind]
  );

  const chatMaxH = isDialog ? 'max-h-[min(42vh,380px)]' : 'max-h-[min(56vh,520px)]';

  if (loadError) {
    return (
      <div
        className={
          isDialog
            ? 'px-4 py-6 text-center text-sm text-destructive'
            : 'px-4 py-12 text-center text-sm text-destructive'
        }
      >
        {loadError}
      </div>
    );
  }

  if (!dialogStateReady) {
    return (
      <div className="flex min-h-[min(40vh,280px)] flex-col items-center justify-center gap-3 px-4 py-10">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-hidden
        />
        <span className="sr-only">Yükleniyor</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        isDialog && 'flex min-h-0 w-full flex-1 flex-col overflow-hidden px-4 pb-4 pt-2',
        !isDialog &&
          (hubMode
            ? 'relative w-full px-4 py-4 sm:py-6'
            : 'relative w-full px-4 pb-4 pt-1.5 sm:pb-6 sm:pt-2'),
      )}
    >
      {!isDialog ? (
        <div
          className="pointer-events-none fixed inset-0 -z-10 opacity-80 dark:opacity-60"
          style={{
            background: `
            radial-gradient(ellipse 90% 50% at 50% -10%, rgba(129, 140, 248, 0.25), transparent 55%),
            radial-gradient(ellipse 60% 40% at 100% 40%, rgba(45, 212, 191, 0.12), transparent 50%)
          `,
          }}
        />
      ) : null}

      {isDialog ? (
        allowSkip ? (
          <div className="mb-3 flex min-h-[2.5rem] items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-auto shrink-0 border-transparent px-2 py-1 text-muted-foreground shadow-none hover:bg-accent"
              onClick={() => void onSkip()}
            >
              Şimdilik atla
            </Button>
          </div>
        ) : null
      ) : hubMode ? null : (
        <div className="mb-1.5">
          <h1 id="onboarding-page-title" className="sr-only">
            Akıllı tanıtım sohbeti
          </h1>
          <div className="flex items-center justify-end gap-1">
            {allowSkip ? (
              <Button
                type="button"
                variant="outline"
                className="h-auto shrink-0 border-transparent px-2 py-1 text-muted-foreground shadow-none hover:bg-accent"
                onClick={() => void onSkip()}
              >
                Şimdilik atla
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 border-transparent text-muted-foreground shadow-none hover:bg-accent hover:text-foreground"
              aria-label="Kapat"
              title="Kapat"
              onClick={() => void dismissSeniTaniyalim()}
            >
              <X className="h-5 w-5" strokeWidth={2} aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {hubMode ? (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Gelir, gider ve hedefinizi buradan ileterek kişisel finansal portföyünüzü anında oluşturun.
          </p>
          {summaryLines?.length ? (
            <div className="overflow-hidden rounded-xl border border-border bg-muted/30 shadow-elevation dark:border-white/10 dark:bg-muted/20 dark:shadow-sm">
              <div className="divide-y divide-border/60 px-4 py-2">
                <div className="py-3">
                  <h1
                    id="onboarding-page-title"
                    className="text-[13px] font-medium leading-snug text-muted-foreground"
                  >
                    Profil özeti
                  </h1>
                </div>
                {summaryLines.map((l, i) => {
                  const { label, value } = splitSummaryLine(l);
                  const showPair = Boolean(label && value);
                  return (
                    <div
                      key={`${i}-${l.slice(0, 20)}`}
                      className="py-3 last:pb-2"
                    >
                      {showPair ? (
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                          <span className="min-w-0 shrink-0 text-[13px] font-medium leading-snug text-muted-foreground">
                            {formatInlineBold(label)}
                          </span>
                          <span className="min-w-0 text-right text-sm font-semibold tabular-nums text-foreground sm:max-w-[60%]">
                            {formatInlineBold(value)}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed text-foreground">{formatInlineBold(l)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-muted/30 shadow-elevation dark:border-white/10 dark:bg-muted/20 dark:shadow-sm">
              <div className="divide-y divide-border/60 px-4 py-2">
                <div className="py-3">
                  <h1
                    id="onboarding-page-title"
                    className="text-[13px] font-medium leading-snug text-muted-foreground"
                  >
                    Profil özeti
                  </h1>
                </div>
                <p className="py-6 text-center text-sm text-muted-foreground">Henüz özet bilgisi yok.</p>
              </div>
            </div>
          )}
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" onClick={() => void onReopen()} disabled={reopenBusy}>
              {reopenBusy ? 'Açılıyor…' : 'Sohbetle güncelle'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => (isDialog ? onClose?.() : leaveOnboardingPage())}
            >
              Kapat
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Tek çerçeve: dıştaki dialog; burada border yok — çift kutu olmasın */}
          <div
            className={cn(
              'flex flex-col gap-2 overflow-y-auto px-0 pt-0 pb-0 ruswallet-scrollbar-none',
              chatMaxH
            )}
          >
            {lines.map((line, idx) => (
              <div
                key={`${idx}-${line.text.slice(0, 24)}`}
                className={
                  line.role === 'assistant'
                    ? 'rounded-2xl rounded-tl-sm border border-border/60 bg-muted/30 px-4 py-3 text-sm leading-relaxed text-foreground dark:border-white/10 dark:bg-background/70'
                    : 'ml-8 rounded-2xl rounded-tr-sm bg-primary/15 px-4 py-3 text-sm text-foreground'
                }
              >
                <p className="whitespace-pre-wrap">{formatInlineBold(line.text)}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={(e) => void onSubmit(e)} className="mt-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) =>
                setInput((prev) =>
                  inputKind === 'amount'
                    ? sanitizeOnboardingAmountInput(e.target.value)
                    : filterGoalTextInput(prev, e.target.value)
                )
              }
              placeholder={placeholder}
              disabled={sending || lines.length === 0}
              className="flex-1"
              autoComplete="off"
              inputMode={inputKind === 'amount' ? 'decimal' : 'text'}
            />
            <Button type="submit" variant="default" disabled={sending || !input.trim() || lines.length === 0}>
              Gönder
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
