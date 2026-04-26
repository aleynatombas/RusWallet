import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Camera, Mic, Send, X } from 'lucide-react';
import { AiAssistantMark, AiAssistantMarkShell } from '@/components/ai/AiAssistantMark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import type { ChatAskResponse, ChatMessage } from '@/types/chat';
import { cn } from '@/lib/utils';

const QUICK_REPLIES = [
  'Bu ay ne kadar harcadım?',
  'Tasarruf önerisi ver',
  'Bakiyem nedir?',
  'Harcama kategorileri neler?',
];

const WELCOME_TEXT =
  'Merhaba! Sesle veya fişle gelir/gider eklemek için üstteki «Sesle işlem» veya «Fiş yükle» düğmesine dokunun: önce ses dinlenir veya fiş taranır, sonra açılan onay penceresinde okunan tutar ve açıklamayı kontrol edip düzeltebilir, Onayla derseniz işlem kaydedilir. Aşağıdan yazarak da soru sorabilirsiniz.';

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function FloatingChatbot() {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: 'welcome', role: 'assistant', text: WELCOME_TEXT },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, open, scrollToBottom]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: ChatMessage = { id: newId(), role: 'user', text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post<ChatAskResponse>('/Chatbot/ask', { message: trimmed });
      const reply = data.response?.trim() || 'Yanıt alınamadı.';
      setMessages((m) => [...m, { id: newId(), role: 'assistant', text: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bir hata oluştu.';
      setMessages((m) => [...m, { id: newId(), role: 'assistant', text: msg }]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const sendMessageRef = useRef(sendMessage);
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  useEffect(() => {
    const onOpenFromPage = (e: Event) => {
      const ce = e as CustomEvent<{ message?: string; autoSubmit?: boolean }>;
      setOpen(true);
      const msg = ce.detail?.message?.trim();
      if (msg) {
        setInput(msg);
        if (ce.detail?.autoSubmit) {
          window.setTimeout(() => {
            void sendMessageRef.current(msg);
          }, 80);
        }
      }
    };
    window.addEventListener('ruswallet-chat-open', onOpenFromPage);
    return () => window.removeEventListener('ruswallet-chat-open', onOpenFromPage);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* backdrop */}
      <button
        type="button"
        aria-hidden={!open}
        className={cn(
          'fixed inset-0 z-[60] bg-black/25 transition-opacity duration-300',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setOpen(false)}
        tabIndex={open ? 0 : -1}
      />

      {/* panel — alttan açılan (mobilde tam genişlik, masaüstünde sağ alt) */}
      <div
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label="AI sohbet paneli"
        className={cn(
          'fixed z-[70] flex max-h-[min(85vh,calc(100vh-4rem))] flex-col overflow-hidden border border-border/90 bg-card text-card-foreground transition-all duration-300 ease-out',
          'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12),0_0_0_1px_hsl(var(--border)),0_20px_56px_-12px_hsl(var(--primary)/0.14),0_0_72px_-18px_hsl(var(--primary)/0.1)]',
          'dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55),0_0_0_1px_hsl(var(--border)),0_0_52px_-8px_rgba(34,211,238,0.22),0_0_88px_-20px_rgba(56,189,248,0.14)]',
          'left-3 right-3 max-w-lg sm:left-auto sm:right-6 sm:w-[min(400px,calc(100vw-3rem))]',
          'rounded-t-2xl sm:rounded-2xl',
          open
            ? 'bottom-20 translate-y-0 opacity-100'
            : 'pointer-events-none bottom-0 translate-y-full opacity-0 sm:bottom-20 sm:translate-y-[110%]'
        )}
      >
        <header className="flex shrink-0 flex-col gap-3 border-b bg-muted/40 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className={cn(
                  'shrink-0 rounded-full p-0 outline-none transition-[box-shadow,transform] active:scale-[0.97]',
                  'focus-visible:ring-2 focus-visible:ring-primary/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'dark:focus-visible:ring-cyan-400/55'
                )}
                aria-label="Mesaj alanına geç"
                title="Mesaj yaz"
                onClick={() => inputRef.current?.focus()}
              >
                <AiAssistantMark size="header" />
              </button>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">RusWallet Asistan</p>
                <p className="text-xs text-muted-foreground">Üst kısayollarla ses / fiş → onay → kayıt</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 border-transparent shadow-none hover:bg-accent focus-visible:ring-primary/45 dark:focus-visible:ring-primary/40"
              onClick={() => setOpen(false)}
              aria-label="Sohbeti kapat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'gap-1.5 rounded-full border-primary/40 bg-primary/10 text-sky-950 hover:bg-primary/15',
                'focus-visible:ring-primary/45 dark:text-sky-50 dark:hover:bg-primary/20'
              )}
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new Event('ruswallet-open-voice'));
              }}
            >
              <Mic className="h-3.5 w-3.5" aria-hidden />
              Sesle işlem
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'gap-1.5 rounded-full border-cyan-400/40 bg-cyan-500/10 text-cyan-950 hover:bg-cyan-500/15',
                'focus-visible:ring-cyan-400/45 dark:text-cyan-100 dark:hover:bg-cyan-500/20'
              )}
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new Event('ruswallet-open-receipt'));
              }}
            >
              <Camera className="h-3.5 w-3.5" aria-hidden />
              Fiş yükle
            </Button>
          </div>
        </header>

        <div
          ref={listRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex w-full',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-elevation dark:shadow-sm',
                  msg.role === 'user'
                    ? 'rounded-br-md bg-primary text-primary-foreground'
                    : 'rounded-bl-md bg-muted text-foreground'
                )}
              >
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading ? (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                Yazıyor…
              </div>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t bg-muted/20 px-3 pb-3 pt-2">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Hızlı sorular
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => void sendMessage(q)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-left text-xs text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mesajınızı yazın…"
              disabled={loading}
              className="min-w-0 flex-1 rounded-full border bg-background px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-primary/35"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={cn(
                'shrink-0 rounded-full border-0 bg-transparent p-0 outline-none transition-transform',
                'focus-visible:ring-2 focus-visible:ring-primary/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'dark:focus-visible:ring-cyan-400/55',
                'enabled:hover:scale-[1.06] enabled:active:scale-[0.96]',
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100'
              )}
              aria-label="Gönder"
            >
              <AiAssistantMarkShell size="header">
                <Send className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              </AiAssistantMarkShell>
            </button>
          </form>
        </div>
      </div>

      {/* FAB + hover’da balon + ikon büyümesi */}
      <div className="group fixed bottom-6 right-4 z-[65] sm:right-6">
        {!open ? (
          <div
            role="tooltip"
            className={cn(
              'pointer-events-none absolute bottom-[calc(100%+0.5rem)] right-0 z-10 w-max max-w-[min(18rem,calc(100vw-2rem))]',
              'origin-bottom-right translate-y-1 scale-95 opacity-0 transition-all duration-200 ease-out',
              'group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100',
              'motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100'
            )}
          >
            <div
              className={cn(
                'relative rounded-2xl rounded-br-md border border-border/80 bg-card px-3.5 py-2.5 text-left text-sm leading-snug text-foreground',
                'shadow-md dark:shadow-[0_6px_28px_rgba(0,0,0,0.35)]'
              )}
            >
              Hadi gel, finansal profilin hakkında sohbet edelim!
            </div>
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            'h-16 w-16 rounded-full border-0 bg-transparent p-0',
            'shadow-[0_6px_20px_rgba(0,0,0,0.12),0_0_36px_-4px_rgba(34,211,238,0.2),0_0_56px_-8px_rgba(56,189,248,0.14)]',
            'dark:shadow-[0_10px_36px_rgba(0,0,0,0.5),0_0_44px_-4px_rgba(34,211,238,0.28),0_0_72px_-12px_rgba(56,189,248,0.18)]',
            'hover:bg-transparent focus-visible:border-0 focus-visible:bg-transparent',
            'focus-visible:ring-2 focus-visible:ring-primary/48 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'dark:focus-visible:ring-cyan-400/50',
            'enabled:active:scale-[0.97]',
            'overflow-visible'
          )}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? 'Sohbeti kapat' : 'Finans asistanını aç'}
        >
          {open ? (
            <span
              className={cn(
                'pointer-events-none flex items-center justify-center transition-transform duration-200 ease-out',
                'group-hover:scale-110'
              )}
            >
              <AiAssistantMarkShell size="fab">
                <X className="h-7 w-7" strokeWidth={2} aria-hidden />
              </AiAssistantMarkShell>
            </span>
          ) : (
            <span
              className={cn(
                'pointer-events-none flex items-center justify-center transition-transform duration-200 ease-out',
                'group-hover:scale-[1.12]'
              )}
            >
              <AiAssistantMark size="fab" />
            </span>
          )}
        </Button>
      </div>
    </>
  );
}
