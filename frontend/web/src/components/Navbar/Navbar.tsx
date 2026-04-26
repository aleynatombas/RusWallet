/**
 * Global navbar — logo, modül sekmeleri, tema, profil (shadcn Button + DropdownMenu).
 */
import { Link, NavLink, useLocation, type NavLinkRenderProps } from 'react-router-dom';
import { User, Moon, Sun, Sparkles, Menu, KeyRound } from 'lucide-react';
import { RusWalletLogoMark } from '@/components/brand/RusWalletLogoMark';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatFullName } from '@/lib/formatDisplayName';

function initials(first?: string | null, last?: string | null, email?: string | null) {
  const a = first?.trim().charAt(0);
  const b = last?.trim().charAt(0);
  if (a && b) return (a + b).toLocaleUpperCase('tr-TR');
  if (a) return a.toLocaleUpperCase('tr-TR');
  const fromEmail = email?.trim().charAt(0);
  return (fromEmail ?? '?').toLocaleUpperCase('tr-TR');
}

const navClass = ({ isActive }: NavLinkRenderProps) =>
  cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary/12 text-primary shadow-sm'
      : 'text-muted-foreground hover:bg-primary/8 hover:text-foreground',
  );

/** Mobil: tam etiketler (Anasayfa vb.); dar ekranda bir tık küçük punto */
const mobileNavClass = (props: NavLinkRenderProps) =>
  cn(
    navClass(props),
    'flex min-h-10 min-w-0 flex-1 basis-0 items-center justify-center px-1 text-center text-xs font-medium leading-tight',
  );

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const loc = useLocation();
  const onboardingActive = loc.pathname === '/onboarding';

  const accountMenuContentClass =
    'z-50 min-w-[16rem] overflow-hidden rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-elevation-lg dark:border-2 dark:border-muted-foreground/40 dark:shadow-xl';

  /** Aydınlık: açık zemin, hafif ayırıcı; koyu: önceki lacivert blok */
  const accountMenuHeaderClass =
    'border-b border-border/40 bg-background px-4 py-4 text-foreground dark:border-border/40 dark:bg-background';

  const accountMenuAvatarClass =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-bold tracking-tight text-primary shadow-sm ring-1 ring-primary/10 dark:bg-transparent dark:text-white dark:shadow-none dark:ring-0 dark:ring-offset-0 border-0 border-transparent dark:border-2 dark:border-white/85';

  const accountMenuLogoutClass =
    'mt-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 dark:supports-[backdrop-filter]:bg-background/90">
      <div className="mx-auto flex min-h-14 w-full max-w-screen-2xl items-center gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8 md:h-14">
        {/* Sol: logo */}
        <NavLink to="/" className="lg:flex hidden shrink-0 items-center gap-2 text-foreground transition-opacity hover:opacity-90">
          <RusWalletLogoMark variant="navbar" />
          <span className="hidden font-semibold tracking-tight sm:inline">RusWallet</span>
        </NavLink>

        {/* Orta: modüller */}
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Ana menü">
          <NavLink to="/" end className={navClass}>
            Anasayfa
          </NavLink>
          <NavLink to="/transactions" className={navClass}>
            İşlemlerim
          </NavLink>
          <NavLink to="/analysis" className={navClass}>
            Analizlerim
          </NavLink>
        </nav>

        {/* Mobil: masaüstüyle aynı başlıklar; eşit genişlikte yayılır */}
        <nav
          className="flex min-w-0 flex-1 items-stretch gap-0.5 pr-0.5 md:hidden"
          aria-label="Ana menü mobil"
        >
          <NavLink to="/" end className={mobileNavClass}>
            Anasayfa
          </NavLink>
          <NavLink to="/transactions" className={mobileNavClass}>
            İşlemlerim
          </NavLink>
          <NavLink to="/analysis" className={mobileNavClass}>
            Analizlerim
          </NavLink>
        </nav>

        {/* Sağ: mobilde tek DropdownMenu; md+ ayrı ikonlar */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-2 md:hidden">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 border-0 shadow-none hover:bg-accent"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Açık moda geç' : 'Koyu moda geç'}
              aria-label={theme === 'dark' ? 'Açık tema' : 'Koyu tema'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-0 shadow-none hover:bg-accent"
                  aria-label="Hesap menüsü"
                >
                  <Menu className="h-5 w-5" strokeWidth={2} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className={cn(accountMenuContentClass, 'w-[min(calc(100vw-2rem),20rem)] sm:min-w-[18rem]')}
              >
                <div className={accountMenuHeaderClass}>
                  <div className="flex items-start gap-3">
                    <div className={accountMenuAvatarClass} aria-hidden>
                      {initials(user?.firstName, user?.lastName, user?.email)}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-[15px] font-semibold leading-snug text-foreground">
                        {formatFullName(user?.firstName, user?.lastName)}
                      </p>
                      <button type="button" className={accountMenuLogoutClass} onClick={() => logout()}>
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-border bg-background">
                  <DropdownMenuItem asChild className="cursor-pointer rounded-none px-4 py-3.5 focus:bg-muted">
                    <Link to="/settings?tab=profile" className="flex items-center gap-3 text-foreground">
                      <User className="h-[18px] w-[18px] shrink-0 stroke-[1.75]" aria-hidden />
                      Kişisel Bilgilerim
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-none px-4 py-3.5 focus:bg-muted">
                    <Link to="/settings?tab=security" className="flex items-center gap-3 text-foreground">
                      <KeyRound className="h-[18px] w-[18px] shrink-0 stroke-[1.75]" aria-hidden />
                      Şifre Güncelle
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-none px-4 py-3.5 focus:bg-muted">
                    <NavLink
                      to="/onboarding"
                      state={{ background: loc }}
                      className="flex items-center gap-3 text-foreground"
                    >
                      <Sparkles className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
                      Akıllı tanıtım
                    </NavLink>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden items-center gap-1 sm:gap-2 md:flex">
            <Button
              variant="outline"
              size="icon"
              asChild
              className={cn(
                'relative border-0 shadow-none text-foreground hover:bg-accent hover:text-foreground',
                onboardingActive && 'bg-primary/12'
              )}
              title="Seni tanıyalım — profilini güncelle"
            >
              <NavLink to="/onboarding" state={{ background: loc }} aria-label="Akıllı tanıtım — bilgilerini güncelle">
                <Sparkles className="h-5 w-5" strokeWidth={2} />
              </NavLink>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-0 shadow-none hover:bg-accent" aria-label="Hesap — ad, e-posta ve çıkış">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className={cn(accountMenuContentClass, 'min-w-[18rem]')}>
                <div className={accountMenuHeaderClass}>
                  <div className="flex items-start gap-3">
                    <div className={accountMenuAvatarClass} aria-hidden>
                      {initials(user?.firstName, user?.lastName, user?.email)}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-[15px] font-semibold leading-snug text-foreground">
                        {formatFullName(user?.firstName, user?.lastName)}
                      </p>
                      <button type="button" className={accountMenuLogoutClass} onClick={() => logout()}>
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-border bg-background">
                  <DropdownMenuItem asChild className="cursor-pointer rounded-none px-4 py-3.5 focus:bg-muted">
                    <Link to="/settings?tab=profile" className="flex items-center gap-3 text-foreground">
                      <User className="h-[18px] w-[18px] shrink-0 stroke-[1.75]" aria-hidden />
                      Kişisel Bilgilerim
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-none px-4 py-3.5 focus:bg-muted">
                    <Link to="/settings?tab=security" className="flex items-center gap-3 text-foreground">
                      <KeyRound className="h-[18px] w-[18px] shrink-0 stroke-[1.75]" aria-hidden />
                      Şifre Güncelle
                    </Link>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 border-0 shadow-none hover:bg-accent"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Açık moda geç' : 'Koyu moda geç'}
              aria-label={theme === 'dark' ? 'Açık tema' : 'Koyu tema'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
