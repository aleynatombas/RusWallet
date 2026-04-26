import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { FloatingChatbot } from '@/components/FloatingChatbot';
import { GlobalVoiceReceiptEntry } from '@/components/GlobalVoiceReceiptEntry';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const { pathname } = useLocation();
  const fullWidthSettings = pathname === '/settings';
  const analysisRoute = pathname === '/analysis';

  return (
    <div
      className={cn(
        'flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden',
        fullWidthSettings
          ? 'bg-background'
            : 'bg-gradient-to-b from-background via-background to-sky-50/30 dark:from-background dark:via-background dark:to-primary/[0.07]'
      )}
    >
      <Navbar />
      <main
        className={cn(
          'flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch]',
          analysisRoute ? 'overflow-y-auto' : 'overflow-y-auto lg:overflow-hidden',
          fullWidthSettings
            ? 'max-w-none px-0 py-0'
            : 'mx-auto max-w-screen-2xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8'
        )}
      >
        <Outlet />
      </main>
      <GlobalVoiceReceiptEntry />
      <FloatingChatbot />
    </div>
  );
}
