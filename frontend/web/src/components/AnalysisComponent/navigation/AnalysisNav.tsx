import type { ComponentType } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  LineChart,
  PieChart,
  PiggyBank,
  ScanSearch,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AnalysisNavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Genel Bakış kartlarında gösterilen kısa açıklama. */
  description: string;
}

/** Analizlerim URL'leri — tek kaynak (navigasyon, Genel Bakış kartları ve yönlendirmeler). */
export const ANALYSIS_ROUTES = {
  overview: '/analysis',
  ai: '/analysis/ai',
  forecast: '/analysis/ai/forecast',
  anomaly: '/analysis/ai/anomaly',
  savings: '/analysis/ai/savings',
  finance: '/analysis/finance',
  goals: '/analysis/finance/goals',
  spending: '/analysis/finance/spending',
  trends: '/analysis/finance/trends',
} as const;

export const AI_ITEMS: AnalysisNavItem[] = [
  { to: ANALYSIS_ROUTES.forecast, label: 'Gelecek Ay Tahmini', icon: LineChart, description: 'Gelecek ay ne kadar harcayacağın' },
  { to: ANALYSIS_ROUTES.anomaly, label: 'Anomali Tespiti', icon: ScanSearch, description: 'Alışılmışın dışındaki harcamalar' },
  { to: ANALYSIS_ROUTES.savings, label: 'Tasarruf Fırsatları', icon: PiggyBank, description: 'Kısabileceğin harcamalar' },
];

export const FINANCE_ITEMS: AnalysisNavItem[] = [
  { to: ANALYSIS_ROUTES.goals, label: 'Hedeflerim', icon: Target, description: 'Birikim hedefin ve ilerlemen' },
  { to: ANALYSIS_ROUTES.spending, label: 'Harcama Dağılımım', icon: PieChart, description: 'Bu ay paran nereye gitti' },
  { to: ANALYSIS_ROUTES.trends, label: 'Finansal Trend', icon: TrendingUp, description: 'Aylık gelir ve gider eğilimi' },
];

const SECTIONS = [
  { to: ANALYSIS_ROUTES.overview, label: 'Genel Bakış', icon: LayoutGrid, end: true },
  { to: ANALYSIS_ROUTES.ai, label: 'AI Analizleri', icon: Sparkles, end: false },
  { to: ANALYSIS_ROUTES.finance, label: 'Finansal Durum', icon: Wallet, end: false },
];

const SECTION_COPY: Record<string, { title: string; description: string }> = {
  overview: {
    title: 'Analiz Merkezi',
    description: 'İncelemek istediğin konuyu seç; ayrıntılar kendi ekranında, odaklı biçimde açılır.',
  },
  ai: {
    title: 'AI Analizleri',
    description: 'Harcama geçmişinden öğrenen tahmin, olağan dışı harcama ve tasarruf analizleri.',
  },
  finance: {
    title: 'Finansal Durum',
    description: 'Birikim hedefin, bu ayki harcama dağılımın ve aylık gelir–gider eğilimin.',
  },
};

export interface HeroStat {
  label: string;
  tone: 'ready' | 'attention' | 'collecting';
}

/**
 * Sayfa başlığı (hero) + bölüm seçici (segment kontrol). Ayrı bir ikinci navbar yerine içeriğin parçasıdır;
 * üst ana menü tek navigasyon çubuğu olarak kalır.
 */
export function AnalysisHero({ stats = [] }: { stats?: HeroStat[] }) {
  const { pathname } = useLocation();
  const key = pathname.startsWith(ANALYSIS_ROUTES.ai) ? 'ai' : pathname.startsWith(ANALYSIS_ROUTES.finance) ? 'finance' : 'overview';
  const copy = SECTION_COPY[key];

  return (
    <section
      className={cn(
        'relative shrink-0 overflow-hidden rounded-2xl border border-border/80 p-4 sm:px-6 sm:py-5',
        'bg-gradient-to-br from-primary/[0.09] via-card to-card shadow-elevation',
        'dark:from-primary/[0.14] dark:via-zinc-900/70 dark:to-zinc-900/40'
      )}
    >
      {/* dekoratif ışık */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl dark:bg-primary/20" aria-hidden />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {key !== 'overview' ? (
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              <Link to={ANALYSIS_ROUTES.overview} className="hover:text-foreground hover:underline">
                Analiz Merkezi
              </Link>
              <span className="mx-1.5" aria-hidden>
                /
              </span>
              <span className="text-foreground">{copy.title}</span>
            </p>
          ) : (
            <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              <Sparkles className="h-3 w-3" aria-hidden /> Kişisel finans analizlerin
            </span>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">{copy.title}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{copy.description}</p>
          {stats.length > 0 ? (
            <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Analiz durumları">
              {stats.map((s) => (
                <li
                  key={s.label}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                    s.tone === 'ready' && 'border-primary/25 bg-background/70 text-foreground',
                    s.tone === 'attention' && 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
                    s.tone === 'collecting' && 'border-border bg-background/60 text-muted-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      s.tone === 'ready' && 'bg-primary',
                      s.tone === 'attention' && 'bg-amber-500',
                      s.tone === 'collecting' && 'animate-pulse bg-muted-foreground/60'
                    )}
                    aria-hidden
                  />
                  {s.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <SectionSwitch />
      </div>
    </section>
  );
}

/** Segment kontrol: Genel Bakış · AI Analizleri · Finansal Durum (URL tabanlı; geri/ileri tuşları çalışır). */
function SectionSwitch() {
  return (
    <nav aria-label="Analiz bölümleri" className="w-full shrink-0 lg:w-auto">
      <ul className="grid grid-cols-3 gap-1 rounded-xl border border-border/80 bg-background/70 p-1 shadow-sm backdrop-blur dark:bg-zinc-950/50">
        {SECTIONS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium transition-all sm:px-4 sm:text-sm',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )
              }
            >
              <Icon className="hidden h-4 w-4 sm:block" aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Bölüm içindeki modül seçici: filtre chip'leri. */
export function ModuleChips({ items, label }: { items: AnalysisNavItem[]; label: string }) {
  return (
    <nav aria-label={label} className="shrink-0">
      <ul className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(({ to, label: l, icon: Icon }) => (
          <li key={to} className="shrink-0">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'border-primary/40 bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground dark:bg-zinc-900/40'
                )
              }
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {l}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
