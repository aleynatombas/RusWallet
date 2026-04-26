import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingPageCard } from '@/pages/OnboardingPage';

/**
 * React Router modal rotası: arkada önceki sayfa (location.state.background) görünür,
 * üzerinde hafif karartma + pencere.
 */
export function OnboardingOverlay() {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity dark:bg-black/55"
        aria-label="Kapat"
        onClick={() => navigate(-1)}
      />
      <div className="relative z-[81] w-full max-w-lg">
        <OnboardingPageCard />
      </div>
    </div>
  );
}
