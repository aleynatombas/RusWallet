import { cn } from '@/lib/utils';

const LOGO_SRC = '/ruswallet-rw-logo.png';

/** Auth — yumuşak cyan + teal (soğuk mavi uç yok; PNG ile daha doğal) */
const auraBlobStrong =
  'bg-gradient-to-br from-cyan-400/40 via-teal-400/26 to-cyan-300/20 dark:from-cyan-500/34 dark:via-teal-500/22 dark:to-cyan-400/16';

/** Navbar — çok hafif buğu; cyan–teal, düşük doygunluk */
const auraBlobNavbar =
  'bg-gradient-to-br from-cyan-400/28 via-teal-400/14 to-sky-300/12 dark:from-cyan-500/22 dark:via-teal-500/12 dark:to-cyan-600/10';

const sizes = {
  navbar: {
    img: 'h-8 w-auto max-w-[5.25rem] object-contain object-left sm:h-9 sm:max-w-[5.75rem]',
    blob: 'h-9 w-[4.5rem] sm:h-10 sm:w-[5rem] -translate-x-[15%] translate-y-[28%]',
    blobBlur: 'blur-lg sm:blur-xl',
    blobOpacity: 'opacity-[0.74]',
    aura: auraBlobNavbar,
    imgGlow:
      'drop-shadow-[0_0_20px_rgba(45,212,191,0.14)] dark:drop-shadow-[0_0_24px_rgba(34,211,238,0.12)]',
  },
  auth: {
    img: 'h-[3.35rem] w-auto max-w-[10.5rem] object-contain object-left sm:h-16 sm:max-w-[12rem]',
    blob: 'h-14 w-[8.5rem] sm:h-16 sm:w-[9.5rem] -translate-x-[12%] translate-y-[30%]',
    blobBlur: 'blur-2xl sm:blur-3xl',
    blobOpacity: 'opacity-[0.88]',
    aura: auraBlobStrong,
    imgGlow:
      'drop-shadow-[0_0_22px_rgba(45,212,191,0.2)] dark:drop-shadow-[0_0_26px_rgba(34,211,238,0.18)]',
  },
} as const;

type Variant = keyof typeof sizes;

/**
 * 3B RW monogram (şeffaflık işlenmiş PNG). Aura: cyan–teal buğu, sert mavi halka yok.
 */
export function RusWalletLogoMark({
  variant,
  className,
  title = 'RusWallet',
}: {
  variant: Variant;
  className?: string;
  title?: string;
}) {
  const d = sizes[variant];

  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-visible', className)}
      role="img"
      aria-label={title}
    >
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <span
          className={cn(
            'absolute rounded-[999px]',
            d.blobOpacity,
            d.aura,
            d.blobBlur,
            d.blob,
            'rotate-[-6deg] skew-x-[-4deg]'
          )}
        />
      </span>

      <img
        src={LOGO_SRC}
        alt=""
        width={256}
        height={148}
        decoding="async"
        draggable={false}
        className={cn('relative z-[1] select-none', d.img, d.imgGlow)}
      />
    </span>
  );
}
