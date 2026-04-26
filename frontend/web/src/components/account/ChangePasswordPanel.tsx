import type { FormEvent } from 'react';
import { useState } from 'react';
import axios from 'axios';
import { api } from '@/services/api';
import type { ChangePasswordRequest } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const SETTINGS_UNDERLINE_INPUT_CLASS =
  'h-11 rounded-none border-0 border-b border-border bg-transparent px-0 shadow-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 dark:border-border';

function fieldError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { message?: string } | undefined;
    if (d?.message && typeof d.message === 'string') return d.message;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Bir hata oluştu.';
}

export interface ChangePasswordPanelProps {
  /** false iken alanlar kapalı, API çağrısı yok */
  enabled?: boolean;
  /** enabled false iken gösterilen kısa yönlendirme */
  disabledHint?: string;
  /** Input className (ayarlarda alt çizgili stil) */
  inputClassName?: string;
  /** Birden fazla panel aynı sayfada olursa id çakışmasın */
  idPrefix?: string;
  /** Form dış sarmalayıcı */
  className?: string;
}

export function ChangePasswordPanel({
  enabled = true,
  disabledHint = 'Şifreni güncellemek için önce giriş yapmalısın. Girişten sonra Ayarlar → Şifre güncelle bölümünü kullanabilirsin.',
  inputClassName = SETTINGS_UNDERLINE_INPUT_CLASS,
  idPrefix = 'pwd',
  className,
}: ChangePasswordPanelProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (!enabled) return;
    setPasswordError('');
    setPasswordMessage('');
    if (newPassword !== newPassword2) {
      setPasswordError('Yeni şifreler eşleşmiyor.');
      return;
    }
    setPasswordLoading(true);
    try {
      const body: ChangePasswordRequest = {
        currentPassword,
        newPassword,
      };
      const { data } = await api.post<{ message?: string }>('/auth/change-password', body);
      setPasswordMessage(data?.message ?? 'Şifreniz güncellendi.');
      setCurrentPassword('');
      setNewPassword('');
      setNewPassword2('');
    } catch (err) {
      setPasswordError(fieldError(err));
    } finally {
      setPasswordLoading(false);
    }
  }

  const curId = `${idPrefix}-current-password`;
  const newId = `${idPrefix}-new-password`;
  const new2Id = `${idPrefix}-new-password2`;

  return (
    <form onSubmit={(e) => void handlePasswordSubmit(e)} className={cn('space-y-8', className)}>
      {!enabled ? (
        <p className="text-sm text-muted-foreground">{disabledHint}</p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={curId} className="text-xs font-medium text-foreground">
          Mevcut şifre
        </Label>
        <PasswordInput
          id={curId}
          value={currentPassword}
          onChange={(ev) => setCurrentPassword(ev.target.value)}
          autoComplete="current-password"
          disabled={passwordLoading || !enabled}
          className={cn(inputClassName, 'pr-10')}
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
          disabled={passwordLoading || !enabled}
          className={cn(inputClassName, 'pr-10')}
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
          disabled={passwordLoading || !enabled}
          className={cn(inputClassName, 'pr-10')}
        />
      </div>

      {passwordError ? (
        <p className="text-sm text-destructive" role="alert">
          {passwordError}
        </p>
      ) : null}
      {passwordMessage ? (
        <p className="text-sm text-green-600 dark:text-green-500" role="status">
          {passwordMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        {enabled ? (
          <Button type="submit" variant="default" size="lg" disabled={passwordLoading} className="min-w-[8rem] rounded-md px-8">
            {passwordLoading ? 'Güncelleniyor…' : 'Güncelle'}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
