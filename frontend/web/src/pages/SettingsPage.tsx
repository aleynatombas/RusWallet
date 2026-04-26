import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import type { LucideIcon } from 'lucide-react';
import { KeyRound, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatFullName } from '@/lib/formatDisplayName';
import { PAGE_TITLE_CLASS, formatPageTitleDisplay } from '@/lib/pageTitle';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import type { AuthResponse, UpdateProfileRequest } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ChangePasswordPanel,
  SETTINGS_UNDERLINE_INPUT_CLASS,
} from '@/components/account/ChangePasswordPanel';

type Panel = 'profile' | 'security';

function SidebarNavItem({
  active,
  icon: Icon,
  children,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 border-l-4 py-3 pl-4 pr-3 text-left text-[15px] font-medium transition-colors',
        active
          ? 'border-primary bg-primary/10 text-foreground dark:bg-primary/[0.12]'
          : 'border-transparent text-muted-foreground hover:bg-primary/5 hover:text-foreground'
      )}
    >
      <Icon
        className={cn('h-[18px] w-[18px] shrink-0 stroke-[1.75]', active ? 'text-primary' : 'opacity-90')}
        aria-hidden
      />
      {children}
    </button>
  );
}

function fieldError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { message?: string } | undefined;
    if (d?.message && typeof d.message === 'string') return d.message;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Bir hata oluştu.';
}

export function SettingsPage() {
  const { user, applyAuthResponse, logout } = useAuth();
  const displayName = formatFullName(user?.firstName, user?.lastName) || 'Hesap';
  const [searchParams, setSearchParams] = useSearchParams();

  const [panel, setPanel] = useState<Panel>('profile');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setEmail(user.email ?? '');
  }, [user]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'profile' || tab === 'security') {
      setPanel(tab);
    } else {
      setPanel('profile');
      setSearchParams({ tab: 'profile' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  function goToTab(next: Panel) {
    setPanel(next);
    setSearchParams({ tab: next });
  }

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileError('');
    setProfileMessage('');
    setProfileLoading(true);
    try {
      const body: UpdateProfileRequest = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      };
      const { data } = await api.put<AuthResponse>('/auth/profile', body);
      applyAuthResponse(data);
      setProfileMessage('Bilgileriniz güncellendi.');
    } catch (err) {
      setProfileError(fieldError(err));
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError('');
    setDeleteMessage('');
    if (deleteLoading) return;

    const ok = window.confirm(
      'Hesabın kalıcı olarak silinecek. İşlemler, kategoriler ve diğer veriler geri getirilemez.\n\nDevam etmek istiyor musun?'
    );
    if (!ok) return;

    setDeleteLoading(true);
    try {
      await api.delete('/auth/me');
      setDeleteMessage('Hesabınız silindi. Çıkış yapılıyor…');
      logout();
    } catch (err) {
      setDeleteError(fieldError(err));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-screen-2xl flex-1 flex-col overflow-hidden bg-background px-3 sm:px-6 lg:px-8 md:flex-row">
      {/* Navbar iç kabuğu ile aynı max-w + yatay padding — sol sütun logo hizasına oturur */}
      <aside className="w-full shrink-0 border-b border-border bg-background md:h-full md:w-[min(100%,280px)] md:border-b-0 md:border-r md:border-border/80">
        <div className="border-b border-border/50 px-3 py-4">
          <p className="text-sm font-medium text-foreground">{displayName}</p>
          <button
            type="button"
            onClick={() => logout()}
            className="mt-3 text-xs font-medium text-destructive underline-offset-2 transition-colors hover:underline hover:opacity-80"
          >
            Çıkış Yap
          </button>
        </div>
        <nav className="flex flex-col pb-4 pt-4" aria-label="Hesap menüsü">
          <SidebarNavItem active={panel === 'profile'} icon={User} onClick={() => goToTab('profile')}>
            Kişisel Bilgilerim
          </SidebarNavItem>
          <SidebarNavItem active={panel === 'security'} icon={KeyRound} onClick={() => goToTab('security')}>
            Şifre Güncelle
          </SidebarNavItem>
        </nav>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto py-8 md:pl-8 md:pr-0 lg:pl-10">
        {panel === 'profile' ? (
          <div className="mx-auto max-w-3xl">
            <h1 className={PAGE_TITLE_CLASS}>{formatPageTitleDisplay('Kişisel Bilgilerim')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Ad ve e-posta bilgilerinizi güncelleyebilirsiniz.</p>

            <form onSubmit={handleProfileSubmit} className="mt-8 space-y-8">
              <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="settings-firstName" className="text-xs font-medium text-foreground">
                    Ad <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="settings-firstName"
                    value={firstName}
                    onChange={(ev) => setFirstName(ev.target.value)}
                    autoComplete="given-name"
                    disabled={profileLoading}
                    className={SETTINGS_UNDERLINE_INPUT_CLASS}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-lastName" className="text-xs font-medium text-foreground">
                    Soyad <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="settings-lastName"
                    value={lastName}
                    onChange={(ev) => setLastName(ev.target.value)}
                    autoComplete="family-name"
                    disabled={profileLoading}
                    className={SETTINGS_UNDERLINE_INPUT_CLASS}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="settings-email" className="text-xs font-medium text-foreground">
                    E-posta <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="settings-email"
                    type="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    autoComplete="email"
                    disabled={profileLoading}
                    className={SETTINGS_UNDERLINE_INPUT_CLASS}
                  />
                </div>
              </div>

              {profileError ? (
                <p className="text-sm text-destructive" role="alert">
                  {profileError}
                </p>
              ) : null}
              {profileMessage ? (
                <p className="text-sm text-primary" role="status">
                  {profileMessage}
                </p>
              ) : null}

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" variant="default" size="lg" disabled={profileLoading} className="min-w-[8rem] rounded-md px-8">
                    {profileLoading ? 'Kaydediliyor…' : 'Güncelle'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    disabled={deleteLoading}
                    onClick={() => void handleDeleteAccount()}
                  >
                    {deleteLoading ? 'Siliniyor…' : 'Hesabımı sil'}
                  </Button>
                </div>
                {deleteError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {deleteError}
                  </p>
                ) : null}
                {deleteMessage ? (
                  <p className="text-sm text-primary" role="status">
                    {deleteMessage}
                  </p>
                ) : null}
              </div>
            </form>
          </div>
        ) : null}

        {panel === 'security' ? (
          <div className="mx-auto max-w-3xl">
            <h1 className={PAGE_TITLE_CLASS}>{formatPageTitleDisplay('Şifre Güncelle')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Oturum şifrenizi güncelleyin.</p>

            <ChangePasswordPanel idPrefix="settings-security" enabled className="mt-8 max-w-xl" />
          </div>
        ) : null}
      </main>
    </div>
  );
}
