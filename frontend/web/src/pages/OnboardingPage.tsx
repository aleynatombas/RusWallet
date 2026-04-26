import { OnboardingPanel } from '@/components/onboarding/OnboardingPanel';

const cardClassName =
  'ruswallet-scrollbar-none w-full max-w-lg max-h-[min(85vh,calc(100dvh-5rem))] overflow-y-auto rounded-2xl border border-border bg-background shadow-elevation-xl dark:shadow-2xl ring-1 ring-black/5 dark:ring-white/10';

/** Ortak kart — tam sayfa ve modal overlay’de kullanılır */
export function OnboardingPageCard() {
  return (
    <div className={cardClassName} role="region" aria-labelledby="onboarding-page-title">
      <OnboardingPanel variant="page" />
    </div>
  );
}

/** Doğrudan /onboarding (background yok): tam sayfa ortada kart */
export function OnboardingPage() {
  return (
    <div className="ruswallet-scrollbar-none flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4 sm:p-6">
      <OnboardingPageCard />
    </div>
  );
}
