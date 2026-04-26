import { Camera, ChevronRight, Coffee, Mic, ShoppingCart, Train, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardPanelClass } from '@/lib/dashboardStyles';
import { cn } from '@/lib/utils';
import type { CategorySlice } from '@/lib/groupExpenseByCategory';
import { formatExpenseCategoryLabel } from '@/lib/formatExpenseCategoryLabel';
import type { TransactionRow } from '@/types/dashboard';

function formatTry(n: number): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatTxDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

interface AiShortcutOrbsProps {
  topCategories: CategorySlice[];
  className?: string;
  /** Anasayfa tek ekran: daha sıkı padding ve küçük orb */
  compact?: boolean;
  /** Dönem işlem adedi (özet şeridi sol etiket) */
  monthTransactionCount?: number;
  /** Özet şeridinde sol sütun başlığı (örn. Bu ay işlem, Son 3 ay işlem) */
  periodTransactionLabel?: string;
  /** Tüm zamanlardaki en son işlem (özet şeridi) */
  lastTransaction?: TransactionRow | null;
}

function iconForCategory(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (/kahve|yemek|cafe|restoran|kebap/i.test(n)) return Coffee;
  if (/market|gıda|şok|migros/i.test(n)) return ShoppingCart;
  if (/ulaşım|taksi|metro|otobüs|benzin/i.test(n)) return Train;
  return ShoppingCart;
}

function openChat(message: string) {
  window.dispatchEvent(new CustomEvent('ruswallet-chat-open', { detail: { message } }));
}

function openReceipt() {
  window.dispatchEvent(new Event('ruswallet-open-receipt'));
}

function openVoiceTransaction() {
  window.dispatchEvent(new Event('ruswallet-open-voice'));
}

const btnGrid =
  'flex w-full min-h-[4.75rem] flex-col items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 py-2.5 text-center text-[11px] font-semibold shadow-elevation transition-all hover:bg-accent/60 hover:shadow-elevation-lg active:scale-[0.99] dark:shadow-sm dark:hover:shadow-md sm:min-h-[5.25rem] sm:text-xs';

const btnGridCompact =
  'flex w-full min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 py-2 text-center text-[10px] font-semibold leading-tight shadow-elevation transition-all hover:bg-accent/60 active:scale-[0.99] dark:shadow-sm sm:min-h-[4.75rem] sm:px-2.5 sm:py-2.5 sm:text-[11px]';

export function AiShortcutOrbs({
  topCategories,
  className,
  compact,
  monthTransactionCount,
  periodTransactionLabel = 'Bu ay işlem',
  lastTransaction,
}: AiShortcutOrbsProps) {
  const picks = topCategories.slice(0, 3);
  const btn = compact ? btnGridCompact : btnGrid;
  const showStats = typeof monthTransactionCount === 'number';

  return (
    <section
      className={cn(
        dashboardPanelClass,
        'box-border flex w-full min-w-0 max-w-full flex-col overflow-x-hidden backdrop-blur-sm max-lg:flex-none',
        'lg:flex-1 lg:min-h-0',
        compact ? 'p-3 sm:p-4 lg:h-full lg:p-5' : 'min-h-[280px] p-5',
        className
      )}
    >
      <h2
        className={cn(
          'text-center font-semibold uppercase tracking-wide text-muted-foreground',
          compact ? 'mb-1.5 text-[11px]' : 'mb-2 text-sm'
        )}
      >
        Hızlı AI kısayolları
      </h2>
      <p
        className={cn(
          'break-words text-center text-muted-foreground',
          compact
            ? 'mb-3 max-w-full text-xs leading-relaxed sm:mb-4 sm:mx-auto sm:max-w-2xl sm:text-[13px]'
            : 'mb-4 max-w-2xl text-sm leading-relaxed sm:mx-auto'
        )}
      >
        Fiş veya sesle hızlı işlem ekleyin; kategori kısayolları finans asistanını açarak ilgili konuşmayı başlatır.
      </p>

      {showStats ? (
        <div className="mb-2 grid min-w-0 grid-cols-2 items-start gap-1.5 rounded-lg border border-border/80 bg-muted/25 p-2 sm:mb-3 sm:gap-2 sm:p-2.5 dark:bg-muted/20">
          <div className="flex min-w-0 flex-col text-left">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">
              {periodTransactionLabel}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums leading-none text-foreground sm:text-2xl">
              {monthTransactionCount}
            </p>
          </div>
          <div className="min-w-0 border-l border-border/50 pl-2 text-left sm:pl-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">Son işlem</p>
            {lastTransaction ? (
              <>
                <p className="mt-1 line-clamp-2 break-words text-xs font-medium leading-tight text-foreground sm:text-[13px] sm:leading-snug">
                  {lastTransaction.description?.trim() || '—'}
                </p>
                <p className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[10px] tabular-nums sm:text-xs sm:gap-x-2">
                  <span
                    className={cn(
                      'shrink-0 font-semibold',
                      lastTransaction.isIncome
                        ? 'text-primary'
                        : 'text-primary/65 dark:text-primary/70'
                    )}
                  >
                    {lastTransaction.isIncome ? '+' : '−'}₺{formatTry(Math.abs(Number(lastTransaction.amount)))}
                  </span>
                  {lastTransaction.categoryName ? (
                    <span className="min-w-0 max-w-full truncate font-medium text-muted-foreground">{lastTransaction.categoryName}</span>
                  ) : null}
                  <span className="shrink-0 text-muted-foreground">{formatTxDate(lastTransaction.transactionDate)}</span>
                </p>
              </>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">Henüz kayıt yok</p>
            )}
          </div>
        </div>
      ) : null}

      {/* lg: flex-1; kanallar+kategoriler justify-center ile dikey ortada — footer lg:mt-auto ile altta sabit */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-0">
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 py-2 pr-0.5 sm:gap-5 sm:py-3 sm:pr-0">
          <div className="min-w-0 shrink-0 space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">Giriş kanalları</p>
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-2.5">
              <button type="button" onClick={openReceipt} className={cn(btn, 'text-primary')}>
                <Camera className={compact ? 'h-6 w-6 sm:h-6 sm:w-7' : 'h-7 w-7'} aria-hidden />
                Fiş tara
              </button>
              <button
                type="button"
                onClick={openVoiceTransaction}
                className={cn(btn, 'text-primary')}
              >
                <Mic className={compact ? 'h-6 w-6 sm:h-6 sm:w-7' : 'h-7 w-7'} aria-hidden />
                Sesle ekle
              </button>
            </div>
          </div>

          {picks.length > 0 ? (
            <div className="min-w-0 shrink-0 space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                Sık kullanılan kategoriler
              </p>
              <div
                className={cn(
                  'grid min-w-0 gap-2 sm:gap-2.5',
                  picks.length === 1 && 'grid-cols-1',
                  picks.length === 2 && 'grid-cols-2',
                  /* Dar ekranda 3 sütun taşar; sm üstü üçlü */
                  picks.length >= 3 && 'grid-cols-1 sm:grid-cols-3'
                )}
              >
                {picks.map((c) => {
                  const Icon = iconForCategory(c.name);
                  const label = formatExpenseCategoryLabel(c.name);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() =>
                        openChat(`Hızlı ekle: ${label} kategorisinde harcama kaydı oluşturmak istiyorum.`)
                      }
                      className={cn(btn, 'min-w-0 text-primary')}
                    >
                      <Icon className={cn('shrink-0', compact ? 'h-6 w-6 sm:h-6 sm:w-7' : 'h-6 w-6')} aria-hidden />
                      <span className="line-clamp-2 w-full max-w-full px-0.5 text-center leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="shrink-0 rounded-lg border border-dashed border-border/80 bg-muted/20 px-2 py-3 text-center text-[11px] leading-snug text-muted-foreground sm:px-3 sm:text-xs">
              Henüz üst kategori yok; işlem ekledikçe burada kısayol önerileri görünür.
            </p>
          )}
        </div>

        <div className="mt-2 shrink-0 border-t border-border pt-2 sm:mt-3 sm:pt-2.5 lg:mt-auto">
          <Link
            to="/transactions"
            className={cn(
              'group flex min-h-10 w-full items-center justify-center gap-1.5 rounded-md px-2 py-2',
              'text-sm font-medium text-primary no-underline outline-none',
              'transition-colors hover:bg-accent hover:text-primary',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
            )}
          >
            <span className="whitespace-nowrap">Tüm işlemleri gör</span>
            <ChevronRight
              className="h-4 w-4 shrink-0 opacity-80 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
