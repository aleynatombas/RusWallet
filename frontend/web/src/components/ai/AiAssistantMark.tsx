import * as React from 'react';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

type MarkSize = 'header' | 'fab';

/* Dış kutu (outer) − 2×inset = orta halka iç çapı; inner çapı buna eşit veya küçük olmalı (taşma yok). */
const shellDims: Record<
  MarkSize,
  { outer: string; inner: string; blur: string; midInset: string }
> = {
  header: {
    outer: 'h-10 w-10',
    inner: 'h-8 w-8',
    blur: 'h-12 w-12 blur-lg',
    midInset: 'inset-1',
  },
  fab: {
    outer: 'h-16 w-16',
    inner: 'h-11 w-11',
    blur: 'h-[4.5rem] w-[4.5rem] blur-xl',
    midInset: 'inset-2',
  },
};

const aura = {
  blob: 'from-sky-400/52 via-cyan-400/40 to-transparent dark:from-sky-500/44 dark:via-cyan-500/34',
  glow: 'shadow-[0_0_28px_rgba(56,189,248,0.28),0_0_56px_rgba(34,211,238,0.22)] dark:shadow-[0_0_32px_rgba(34,211,238,0.32),0_0_72px_rgba(56,189,248,0.2)]',
  ring: 'border-sky-400/45 dark:border-cyan-400/38',
};

/**
 * Logo ile aynı dil: dış aura, çift halka, koyu merkez — içerik `children` (ikon vb.).
 */
export function AiAssistantMarkShell({
  size,
  className,
  children,
}: {
  size: MarkSize;
  className?: string;
  children: React.ReactNode;
}) {
  const d = shellDims[size];

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-visible rounded-full',
        d.outer,
        aura.glow,
        className
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className={cn('rounded-full bg-gradient-to-br opacity-[0.96]', d.blur, aura.blob)} />
      </div>
      <div
        className={cn(
          'relative box-border flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-full',
          d.outer
        )}
      >
        {/* Opak taban: şeffaf gradient üst kenarda arka planı göstermesin (üstteki beyaz çizgi) */}
        <div className="absolute inset-0 rounded-full bg-slate-950 dark:bg-slate-950" aria-hidden />
        <div
          className={cn(
            'absolute inset-0 box-border rounded-full border-2 bg-gradient-to-b from-indigo-950 to-slate-950 dark:from-indigo-950 dark:to-slate-900',
            aura.ring
          )}
        />
        <div
          className={cn(
            'absolute box-border rounded-full border border-white/10 bg-slate-900 dark:bg-slate-800',
            d.midInset
          )}
        />
        <div
          className={cn(
            'relative z-10 flex shrink-0 items-center justify-center rounded-full border border-white/15 bg-gradient-to-b from-slate-800 to-slate-950 text-sky-300 shadow-inner dark:from-slate-800 dark:to-slate-950 dark:text-cyan-200',
            d.inner,
            'aspect-square'
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Asistan robotu — Zeka Portalı / FAB kapalı görseli.
 */
export function AiAssistantMark({ size, className }: { size: MarkSize; className?: string }) {
  const isFab = size === 'fab';
  const icon = isFab ? 'h-7 w-7' : 'h-5 w-5';
  return (
    <AiAssistantMarkShell size={size} className={className}>
      <Bot className={icon} strokeWidth={1.1} />
    </AiAssistantMarkShell>
  );
}
