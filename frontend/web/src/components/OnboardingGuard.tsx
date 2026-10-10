import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

/** Gönüllü güncelleme: /onboarding dışına çıkınca sunucuda iptal + bayrak temizliği */
function VoluntaryOnboardingLeaveSync() {
  const loc = useLocation();
  const { voluntaryProfileUpdate, setVoluntaryProfileUpdate, setOnboardingCompletedLocal } = useAuth();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = loc.pathname;
    if (!voluntaryProfileUpdate) return;
    if (prev === '/onboarding' && loc.pathname !== '/onboarding') {
      void (async () => {
        try {
          await api.post('/Onboarding/abort-reopen');
          setOnboardingCompletedLocal(true);
        } catch {
          setOnboardingCompletedLocal(true);
        } finally {
          setVoluntaryProfileUpdate(false);
        }
      })();
    }
  }, [loc.pathname, voluntaryProfileUpdate, setVoluntaryProfileUpdate, setOnboardingCompletedLocal]);

  return null;
}

/** Onboarding artık zorunlu değil; ana uygulama her zaman erişilebilir. */
export function OnboardingGuard() {
  return (
    <>
      <VoluntaryOnboardingLeaveSync />
      <Outlet />
    </>
  );
}
