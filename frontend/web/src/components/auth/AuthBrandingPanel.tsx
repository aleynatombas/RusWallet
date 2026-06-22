import { RusWalletLogoMark } from '@/components/brand/RusWalletLogoMark';
import { cn } from '@/lib/utils';

/**
 * Giriş/kayıt sol panel — açık zemin + mavimsi cyan / gök mavisi vurgular.
 */
export function AuthBrandingPanel({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex min-h-[42vh] flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50/45 font-display dark:from-slate-950 dark:via-[#06111f] dark:to-[#0b1628] lg:min-h-screen lg:min-w-0',
        className
      )}
    >
      {/* Yumuşak renk yıkaması */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-100/35 via-transparent to-cyan-100/25 dark:from-[#020617] dark:via-[#08101c]/80 dark:to-[#101b2d]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_60%_at_18%_12%,rgba(14,165,233,0.13),transparent_58%)] dark:bg-[radial-gradient(ellipse_82%_56%_at_20%_14%,rgba(59,130,246,0.08),transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_72%_52%_at_88%_78%,rgba(6,182,212,0.1),transparent_52%)] dark:bg-[radial-gradient(ellipse_68%_48%_at_84%_74%,rgba(14,165,233,0.06),transparent_52%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-[12%] h-60 w-60 rounded-full bg-cyan-200/25 blur-3xl dark:bg-slate-900/16"
        aria-hidden
      />

      {/* Soyut grafik çizgisi */}
      <svg
        className="pointer-events-none absolute bottom-[12%] left-[-5%] h-[42%] w-[110%] text-sky-600/25 dark:text-sky-300/14"
        viewBox="0 0 800 200"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden
      >
        <path
          d="M0 160 Q120 40 220 100 T440 80 T620 120 T800 60"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M0 175 Q200 130 360 150 T640 100 T800 140"
          stroke="currentColor"
          strokeWidth="1"
          opacity={0.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <svg
        className="pointer-events-none absolute bottom-[10%] left-[-2%] h-[46%] w-[106%] text-cyan-500/16 dark:text-cyan-300/8"
        viewBox="0 0 800 220"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden
      >
        <path
          d="M0 148 Q140 98 250 128 T465 116 T650 134 T800 96"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Izgara — aydınlıkta daha soluk */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(15,118,110,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(15,118,110,0.28)_1px,transparent_1px)] [background-size:48px_48px] dark:opacity-[0.045] dark:[background-image:linear-gradient(rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.18)_1px,transparent_1px)]"
        aria-hidden
      />

      <div className="relative z-[1] flex flex-1 flex-col justify-between gap-10 p-8 sm:p-10 lg:p-12">
        <header className="flex items-center gap-3">
          <RusWalletLogoMark variant="navbar" className="scale-110 sm:scale-125" />
          <span className="font-display text-lg font-semibold tracking-tight text-slate-800 dark:text-white/95 sm:text-xl">
            RusWallet
          </span>
        </header>

        <div className="max-w-md space-y-4 lg:py-4">
          <h1 className="font-display text-3xl font-semibold leading-[1.15] tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-[2.35rem] lg:leading-tight">
            Gelirini ve harcamanı{' '}
            <span className="bg-gradient-to-r from-sky-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent dark:from-sky-200 dark:via-blue-200 dark:to-slate-100">
              tek ekranda
            </span>{' '}
            net gör.
          </h1>
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-[1.05rem]">
            Kişisel finans uygulaman: bütçeni planla, işlemlerini takip et, fiş veya sesle hızlı kayıt ekle; yapay
            zeka asistanın sorularına anında yanıt versin.
          </p>
        </div>

        <footer className="flex items-center gap-2 pb-1" aria-hidden>
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500/60 dark:bg-sky-400/65" />
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500/35 dark:bg-sky-400/35" />
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/25 dark:bg-cyan-400/22" />
        </footer>
      </div>
    </div>
  );
}
