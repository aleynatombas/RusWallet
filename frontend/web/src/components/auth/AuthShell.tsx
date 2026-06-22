import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { AuthBrandingPanel } from '@/components/auth/AuthBrandingPanel';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

type AuthTab = 'login' | 'register';

interface AuthShellProps {
  activeTab: AuthTab;
  children: React.ReactNode;
}

export function AuthShell({ activeTab, children }: AuthShellProps) {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const isRegister = pathname === '/register';

  const tabClass = (tab: AuthTab) =>
    cn(
      'relative pb-3 text-sm font-medium transition-colors',
      activeTab === tab
        ? cn(
          'text-foreground',
          'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-gradient-to-r',
          'after:from-sky-600/90 after:to-cyan-600/85',
          'dark:after:from-primary/35 dark:after:to-primary/20'
        )
        : 'text-muted-foreground hover:text-foreground/90',
    );

  return (
    <div className="relative flex min-h-screen flex-col bg-background lg:flex-row">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          'fixed right-4 top-4 z-[100] h-10 w-10 rounded-full border border-slate-300/80 bg-white/90 text-foreground shadow-md backdrop-blur-md',
          'hover:bg-slate-50 dark:border-border/60 dark:bg-background/85 dark:hover:bg-accent'
        )}
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Açık moda geç' : 'Koyu moda geç'}
        aria-label={theme === 'dark' ? 'Açık tema' : 'Koyu tema'}
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <AuthBrandingPanel
        className={cn('lg:w-[min(54vw,680px)] lg:shrink-0', isRegister && 'lg:h-dvh lg:max-h-dvh lg:min-h-0')}
      />

      <div
        className={cn(
          'relative flex flex-1 flex-col bg-background font-display lg:min-w-0',
          isRegister && 'lg:min-h-0 lg:overflow-hidden'
        )}
      >
        <div
          className={cn(
            'relative flex flex-1 flex-col justify-center px-5 py-10 sm:px-8 lg:bg-gradient-to-b lg:from-background lg:via-background lg:to-sky-50/25 lg:px-14 lg:py-16 dark:lg:from-background dark:lg:via-background dark:lg:to-background',
            isRegister && 'lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:py-8 lg:px-10'
          )}
        >
          <div className="mx-auto w-full max-w-[420px]">
            <div
              className={cn(
                'mb-8 flex gap-10 border-b border-border/70 dark:border-border/60',
                isRegister && 'mb-4'
              )}
            >
              <Link to="/login" className={tabClass('login')}>
                Giriş yap
              </Link>
              <Link to="/register" className={tabClass('register')}>
                Kayıt ol
              </Link>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
