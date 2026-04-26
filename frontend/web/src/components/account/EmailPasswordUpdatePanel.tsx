import type { FormEvent } from 'react';
import { useState } from 'react';
import axios from 'axios';
import { api } from '@/services/api';
import type { ResetPasswordByEmailRequest } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { isValidEmailFormat } from '@/lib/authValidation';
import { SETTINGS_UNDERLINE_INPUT_CLASS } from '@/components/account/ChangePasswordPanel';

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
}

export function EmailPasswordUpdatePanel({
  idPrefix = 'email-pwd',
  className,
}: EmailPasswordUpdatePanelProps) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    const em = email.trim();
    if (!isValidEmailFormat(em)) {
      setError('Geçerli bir e-posta adresi girin (örn. ad@alan.com).');
      return;
    }
    if (newPassword !== newPassword2) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    try {
      const body: ResetPasswordByEmailRequest = { email: em, newPassword };
      const { data } = await api.post<{ message?: string }>('/auth/reset-password-by-email', body);
      setMessage(data?.message ?? 'Şifreniz güncellendi. Giriş yapabilirsiniz.');
      setNewPassword('');
      setNewPassword2('');
    } catch (err) {
      setError(fieldError(err));
    } finally {
      setLoading(false);
    }
  }

  const emailId = `${idPrefix}-email`;
  const newId = `${idPrefix}-new`;
  const new2Id = `${idPrefix}-new2`;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className={cn('space-y-8', className)}>
      <div className="space-y-2">
        <Label htmlFor={emailId} className="text-xs font-medium text-foreground">
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
          className={cn(SETTINGS_UNDERLINE_INPUT_CLASS, 'pr-2')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={newId} className="text-xs font-medium text-foreground">
          Yeni şifre
        </Label>
        <PasswordInput
          id={newId}
          value={newPassword}
          onChange={(ev) => setNewPassword(ev.target.value)}
          autoComplete="new-password"
          disabled={loading}
          className={cn(SETTINGS_UNDERLINE_INPUT_CLASS, 'pr-10')}
        />
        <p className="text-[11px] text-muted-foreground">
          En az 8 karakter; büyük, küçük harf, rakam ve özel karakter (!@#$% vb.).
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={new2Id} className="text-xs font-medium text-foreground">
          Yeni şifre (tekrar)
        </Label>
        <PasswordInput
          id={new2Id}
          value={newPassword2}
          onChange={(ev) => setNewPassword2(ev.target.value)}
          autoComplete="new-password"
          disabled={loading}
          className={cn(SETTINGS_UNDERLINE_INPUT_CLASS, 'pr-10')}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-green-600 dark:text-green-500" role="status">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="default" size="lg" disabled={loading} className="min-w-[8rem] rounded-md px-8">
          {loading ? 'Güncelleniyor…' : 'Güncelle'}
        </Button>
      </div>
    </form>
  );
}
