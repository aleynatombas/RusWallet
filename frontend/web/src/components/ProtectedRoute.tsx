import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Sadece JWT: yoksa login. İlk yüklemede onboarding eşlemesi için authHydrated beklenir. */
export function ProtectedRoute() {
  const { token, authHydrated } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!authHydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Oturum hazırlanıyor…
      </div>
    );
  }

  return <Outlet />;
}
