import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthComponent } from '../components/AuthComponent';
import { AuthShell } from '@/components/auth/AuthShell';
import { EmailPasswordUpdatePanel } from '@/components/account/EmailPasswordUpdatePanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PAGE_TITLE_CLASS, formatPageTitleDisplay } from '@/lib/pageTitle';
import { cn } from '@/lib/utils';

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
        <Card className="border-border/80 bg-card/95 shadow-elevation-lg backdrop-blur-sm dark:border-border/60">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className={cn(PAGE_TITLE_CLASS, 'text-2xl')}>{formatPageTitleDisplay('Şifre güncelle')}</CardTitle>
            <CardDescription>Hesabına kayıtlı e-postayı ve yeni şifreni gir.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmailPasswordUpdatePanel idPrefix="login-email-pwd" className="mt-0 max-w-xl space-y-6" />
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t border-border/60 pt-4">
            <Button type="button" variant="outline" className="w-full" onClick={closePasswordHelp}>
              Girişe dön
            </Button>
          </CardFooter>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell activeTab="login">
      <AuthComponent mode="login" variant="split" onSuccess={() => navigate('/', { replace: true })} onPasswordHelpClick={openPasswordHelp} />
    </AuthShell>
  );
}
