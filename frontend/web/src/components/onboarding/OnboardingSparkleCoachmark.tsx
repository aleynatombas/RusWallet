import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onDismiss: () => void;
  onStart: () => void;
};

export function OnboardingSparkleCoachmark({ anchorEl, open, onDismiss, onStart }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }
    let frame = 0;
    const update = () => {
      if (anchorEl) setRect(anchorEl.getBoundingClientRect());
    };
    frame = window.requestAnimationFrame(update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchorEl]);

  if (!open || !rect) return null;

  const pad = 6;
  const highlight = {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };

  const bubbleWidth = Math.min(320, window.innerWidth - 32);
  const bubbleLeft = Math.min(
    Math.max(16, rect.right - bubbleWidth),
    window.innerWidth - bubbleWidth - 16,
  );
  const bubbleTop = highlight.top + highlight.height + 12;
  const showBelow = bubbleTop + 160 < window.innerHeight;
  const top = showBelow ? bubbleTop : Math.max(16, highlight.top - 168);

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Kapat"
        onClick={onDismiss}
      />
      <div
        className="pointer-events-none absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background"
        style={highlight}
      />
      <div
        className={cn(
          'absolute z-[101] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-elevation-lg',
          'animate-in fade-in zoom-in-95 duration-200',
        )}
        style={{ top, left: bubbleLeft, width: bubbleWidth }}
        role="dialog"
        aria-labelledby="onboarding-coach-title"
      >
        <div className="mb-2 flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5 shrink-0" aria-hidden />
          <p id="onboarding-coach-title" className="text-sm font-semibold leading-snug">
            Seni tanıyalım
          </p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Daha iyi analizler ve kişisel öneriler için birkaç kısa soruya yanıt ver — yaklaşık 2 dakika sürer.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" className="flex-1 sm:flex-none" onClick={onStart}>
            Başla
          </Button>
          <Button type="button" size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={onDismiss}>
            Şimdi değil
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
