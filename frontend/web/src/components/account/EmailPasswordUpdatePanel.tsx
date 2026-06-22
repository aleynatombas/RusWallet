import type { FormEvent } from 'react';
import { useState } from 'react';
import axios from 'axios';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { isValidEmailFormat } from '@/lib/authValidation';
import { SETTINGS_UNDERLINE_INPUT_CLASS } from '@/components/account/ChangePasswordPanel';
import { authSplitFieldShell, authSplitPrimaryCta } from '@/components/auth/authSplitFieldClasses';
import { PASSWORD_RULES_HINT } from '@/lib/authValidation';

function fieldError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { message?: string } | undefined;
    if (d?.message && typeof d.message === 'string') return d.message;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Bir hata oluştu.';
}

export interface EmailPasswordUpdatePanelProps {
  idPrefix?: string;
  className?: string;
  /** `authSplit`: giriş/kayıt sayfasıyla aynı alan ve CTA stili */
  appearance?: 'settings' | 'authSplit';
  /** Adım 1'deki "Girişe dön" tıklandığında çağrılır */
  onBack?: () => void;
}

const labelAuth = 'text-xs font-medium uppercase tracking-wide text-muted-foreground';

export function EmailPasswordUpdatePanel({
  idPrefix = 'email-pwd',
  className,
  appearance = 'settings',
  onBack,
}: EmailPasswordUpdatePanelProps) {
  // Adım 1: e-posta → kod gönder
  // Adım 2: kod + yeni şifre → sıfırla
  const [step, setStep] = useState<1 | 2>(1);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ── Adım 1: Kod gönder ─────────────────────────────────────────────────
  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    const em = email.trim();
    if (!isValidEmailFormat(em)) {
      setError('Geçerli bir e-posta adresi girin (örn. ad@alan.com).');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<{ message?: string }>('/auth/forgot-password', { email: em });
      setMessage(data?.message ?? 'Doğrulama kodu e-postanıza gönderildi.');
      setStep(2);
    } catch (err) {
      setError(fieldError(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Adım 2: Kodu + yeni şifreyi gönder ────────────────────────────────
  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== newPassword2) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<{ message?: string }>('/auth/reset-password', {
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
      setMessage(data?.message ?? 'Şifreniz güncellendi. Giriş yapabilirsiniz.');
      setStep(1);
      setCode('');
      setNewPassword('');
      setNewPassword2('');
    } catch (err) {
      setError(fieldError(err));
    } finally {
      setLoading(false);
    }
  }

  const emailId = `${idPrefix}-email`;
  const codeId = `${idPrefix}-code`;
  const newId = `${idPrefix}-new`;
  const new2Id = `${idPrefix}-new2`;

  const isAuthSplit = appearance === 'authSplit';
  const emailInputClass = isAuthSplit ? authSplitFieldShell : cn(SETTINGS_UNDERLINE_INPUT_CLASS, 'pr-2');
  const pwdInputClass = isAuthSplit ? authSplitFieldShell : cn(SETTINGS_UNDERLINE_INPUT_CLASS, 'pr-10');
  const labelClass = isAuthSplit ? labelAuth : 'text-xs font-medium text-foreground';
  const formGap = isAuthSplit ? 'space-y-5' : 'space-y-8';

  // ── Adım 1: E-posta gir ────────────────────────────────────────────────
  if (step === 1) {
    return (
      <form onSubmit={(e) => void handleSendCode(e)} className={cn(formGap, className)}>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Hesabına kayıtlı e-posta adresini gir, sana 6 haneli bir doğrulama kodu gönderelim.
        </p>
        <div className="space-y-2">
          <Label htmlFor={emailId} className={labelClass}>
            E-posta
          </Label>
          <Input
            id={emailId}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            disabled={loading}
            placeholder="ornek@email.com"
            className={emailInputClass}
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        ) : null}
        {message ? (
          <p className="text-sm text-green-600 dark:text-green-500" role="status">{message}</p>
        ) : null}

        {isAuthSplit ? (
          <Button type="submit" disabled={loading} className={authSplitPrimaryCta}>
            {loading ? 'Gönderiliyor…' : 'Doğrulama kodu gönder'}
          </Button>
        ) : (
          <Button type="submit" variant="default" size="lg" disabled={loading} className="min-w-[8rem] rounded-md px-8">
            {loading ? 'Gönderiliyor…' : 'Kod gönder'}
          </Button>
        )}

        {onBack ? (
          <p className="text-center text-sm text-muted-foreground">
            <button
              type="button"
              onClick={onBack}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Girişe dön
            </button>
          </p>
        ) : null}
      </form>
    );
  }

  // ── Adım 2: Kodu + yeni şifreyi gir ───────────────────────────────────
  return (
    <form onSubmit={(e) => void handleResetPassword(e)} className={cn(formGap, className)}>
      <p className={cn('text-sm text-muted-foreground')}>
        <span className="font-medium text-foreground">{email}</span> adresine gönderilen 6 haneli kodu girin.
      </p>

      <div className="space-y-2">
        <Label htmlFor={codeId} className={labelClass}>
          Doğrulama kodu
        </Label>
        <Input
          id={codeId}
          type="text"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          value={code}
          onChange={(ev) => setCode(ev.target.value.replace(/\D/g, ''))}
          disabled={loading}
          placeholder="123456"
          className={emailInputClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={newId} className={labelClass}>
          Yeni şifre
        </Label>
        <PasswordInput
          id={newId}
          value={newPassword}
          onChange={(ev) => setNewPassword(ev.target.value)}
          autoComplete="new-password"
          disabled={loading}
          className={pwdInputClass}
        />
        <p className={cn('text-muted-foreground', isAuthSplit ? 'text-[11px] leading-snug' : 'text-[11px]')}>
          {isAuthSplit ? PASSWORD_RULES_HINT : 'En az 8 karakter; büyük, küçük harf, rakam ve özel karakter (!@#$% vb.).'}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={new2Id} className={labelClass}>
          Yeni şifre (tekrar)
        </Label>
        <PasswordInput
          id={new2Id}
          value={newPassword2}
          onChange={(ev) => setNewPassword2(ev.target.value)}
          autoComplete="new-password"
          disabled={loading}
          className={pwdInputClass}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm text-green-600 dark:text-green-500" role="status">{message}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {isAuthSplit ? (
          <Button type="submit" disabled={loading} className={authSplitPrimaryCta}>
            {loading ? 'Güncelleniyor…' : 'Şifremi sıfırla'}
          </Button>
        ) : (
          <Button type="submit" variant="default" size="lg" disabled={loading} className="min-w-[8rem] rounded-md px-8">
            {loading ? 'Güncelleniyor…' : 'Şifremi sıfırla'}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={() => { setStep(1); setError(''); setMessage(''); }}
        >
          Geri
        </Button>
      </div>
    </form>
  );
}
