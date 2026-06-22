import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthComponent } from '../components/AuthComponent';
import { AuthShell } from '@/components/auth/AuthShell';
import { EmailPasswordUpdatePanel } from '@/components/account/EmailPasswordUpdatePanel';

const PASSWORD_HELP_QUERY = 'yardim';
const PASSWORD_HELP_VALUE = 'sifre';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [passwordHelpOpen, setPasswordHelpOpen] = useState(
    () => searchParams.get(PASSWORD_HELP_QUERY) === PASSWORD_HELP_VALUE,
  );

  useEffect(() => {
    if (searchParams.get(PASSWORD_HELP_QUERY) === PASSWORD_HELP_VALUE) {
      setPasswordHelpOpen(true);
    }
  }, [searchParams]);

  const openPasswordHelp = useCallback(() => {
    setPasswordHelpOpen(true);
  }, []);

  const closePasswordHelp = useCallback(() => {
    setPasswordHelpOpen(false);
    if (searchParams.get(PASSWORD_HELP_QUERY) === PASSWORD_HELP_VALUE) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (passwordHelpOpen) {
    return (
      <AuthShell activeTab="login">
        <div className="w-full space-y-8">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Şifremi unuttum
            </h2>
          </div>
          <EmailPasswordUpdatePanel idPrefix="login-email-pwd" appearance="authSplit" className="mt-0" onBack={closePasswordHelp} />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell activeTab="login">
      <AuthComponent mode="login" variant="split" onSuccess={() => navigate('/', { replace: true })} onPasswordHelpClick={openPasswordHelp} />
    </AuthShell>
  );
}
