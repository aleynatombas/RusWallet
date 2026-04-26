/**
 * AuthComponent – Login/Register UI (diyagram: React Web UI Components)
 * shadcn/ui: Input, Button, Card, Label. API: login/register.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { LoginRequest, RegisterRequest } from '../../types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ACTIVE_LOGIN,
  ACTIVE_REGISTER,
  LOGIN_SETS,
  REGISTER_SETS,
} from '@/config/authCopy';
import { isValidEmailFormat, PASSWORD_RULES_HINT, validatePassword } from '@/lib/authValidation';
import { cn } from '@/lib/utils';
import { PAGE_TITLE_CLASS, formatPageTitleDisplay } from '@/lib/pageTitle';
import { RusWalletLogoMark } from '@/components/brand/RusWalletLogoMark';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

type Mode = 'login' | 'register';

interface AuthComponentProps {
  mode: Mode;
  onSuccess?: () => void;
  /** Şifremi unuttum — tıklanınca şifre güncelle yardım paneli (ör. LoginPage) */
  onPasswordHelpClick?: () => void;
  /** `split`: iki sütunlu giriş sayfası (sol marka); `card`: klasik kart */
  variant?: 'card' | 'split';
}

/** Giriş/kayıt split: aynı çerçeve, yükseklik, tipografi */
const fieldShell =
  'h-11 w-full rounded-lg border border-input bg-background/80 px-3 py-2 text-sm shadow-sm transition-[border-color,box-shadow] focus-visible:outline-none focus-within:border-primary/45 focus-within:ring-2 focus-within:ring-ring/35 focus-within:ring-offset-0 dark:focus-within:border-primary/40 dark:focus-within:ring-ring/25';

const phoneFieldShell = cn(
  fieldShell,
  'flex items-center gap-2 py-0',
  '[&_.ruswallet-phone-input]:min-h-0 [&_.ruswallet-phone-input]:w-full [&_.ruswallet-phone-input]:flex-1'
);

const primaryCta =
  'h-11 w-full rounded-lg bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-500 font-semibold text-white shadow-md transition-[filter,transform] hover:brightness-105 active:scale-[0.99] disabled:opacity-60 dark:from-sky-500 dark:via-cyan-500 dark:to-sky-400';

export function AuthComponent({
  mode,
  onSuccess,
  onPasswordHelpClick,
  variant = 'card',
}: AuthComponentProps) {
  const { login, register, isLoading } = useAuth();
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneE164, setPhoneE164] = useState<string | undefined>(undefined);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isValidEmailFormat(email)) {
      setError('Geçerli bir e-posta adresi girin (örn. ad@alan.com).');
      return;
    }
    try {
      await login({ email: email.trim(), password } as LoginRequest);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız.');
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isValidEmailFormat(email)) {
      setError('Geçerli bir e-posta adresi girin (örn. ad@alan.com).');
      return;
    }
    if (!phoneE164) {
      setError('Telefon numarası gerekli.');
      return;
    }
    if (!isValidPhoneNumber(phoneE164)) {
      setError('Telefon numarası geçersiz.');
      return;
    }

    const pwd = validatePassword(password);
    if (!pwd.ok) {
      setError(pwd.message);
      return;
    }
    try {
      await register({
        firstName,
        lastName,
        phoneNumber: phoneE164,
        email: email.trim(),
        password,
      } as RegisterRequest);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız.');
    }
  }

  const loginCopy = LOGIN_SETS[ACTIVE_LOGIN];
  const registerCopy = REGISTER_SETS[ACTIVE_REGISTER];
  const split = variant === 'split';

  if (mode === 'login') {
    if (split) {
      return (
        <div className="w-full space-y-8">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Hoş geldin
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{loginCopy.description}</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                E-posta
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldShell}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Şifre
              </Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className={fieldShell}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className={primaryCta} disabled={isLoading}>
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş yap'}
            </Button>
            {onPasswordHelpClick ? (
              <p className="text-center text-sm">
                <button
                  type="button"
                  onClick={onPasswordHelpClick}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Şifremi unuttum
                </button>
              </p>
            ) : null}
            <p className="text-center text-sm text-muted-foreground">
              Hesabın yok mu?{' '}
              <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
                Kayıt ol
              </Link>
            </p>
          </form>
        </div>
      );
    }

    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className={cn(PAGE_TITLE_CLASS, 'flex items-center gap-3')}>
            <RusWalletLogoMark variant="auth" />
            <span>{formatPageTitleDisplay(loginCopy.title)}</span>
          </CardTitle>
          <CardDescription>{loginCopy.description}</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş yap'}
            </Button>
            {onPasswordHelpClick ? (
              <p className="text-center text-sm">
                <button
                  type="button"
                  onClick={onPasswordHelpClick}
                  className="text-muted-foreground underline-offset-4 hover:underline"
                >
                  Şifremi unuttum
                </button>
              </p>
            ) : null}
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/register" className="text-primary underline-offset-4 hover:underline">
                Kayıt ol
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    );
  }

  if (split) {
    return (
      <div className="w-full space-y-4 lg:space-y-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            RusWallet&apos;a Katıl
          </h2>
          <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm sm:leading-relaxed">
            {registerCopy.description}
          </p>
        </div>
        <form onSubmit={handleRegister} className="space-y-3 sm:space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ad
              </Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={fieldShell} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Soyad
              </Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className={fieldShell} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Telefon
            </Label>
            <div className={phoneFieldShell}>
              <PhoneInput
                id="phoneNumber"
                international
                defaultCountry="TR"
                value={phoneE164}
                onChange={setPhoneE164}
                className="ruswallet-phone-input flex-1"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-email" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              E-posta
            </Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldShell}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Şifre
            </Label>
            <PasswordInput
              id="reg-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldShell}
              required
              minLength={8}
            />
            <p className="text-[11px] leading-snug text-muted-foreground">{PASSWORD_RULES_HINT}</p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className={primaryCta} disabled={isLoading}>
            {isLoading ? 'Kaydediliyor...' : 'Kayıt ol'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Zaten hesabın var mı?{' '}
            <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Giriş yap
            </Link>
          </p>
          {onPasswordHelpClick ? (
            <p className="text-center text-sm">
              <button
                type="button"
                onClick={onPasswordHelpClick}
                className="text-primary underline-offset-4 hover:underline"
              >
                Şifremi unuttum
              </button>
            </p>
          ) : null}
        </form>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className={cn(PAGE_TITLE_CLASS, 'flex items-center gap-3')}>
          <RusWalletLogoMark variant="auth" />
          <span>{formatPageTitleDisplay(registerCopy.title)}</span>
        </CardTitle>
        <CardDescription>{registerCopy.description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleRegister}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Ad</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Soyad</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Telefon</Label>
            <div className="rounded-md border border-input bg-background px-3 py-2">
              <PhoneInput
                id="phoneNumber"
                international
                defaultCountry="TR"
                value={phoneE164}
                onChange={setPhoneE164}
                className="ruswallet-phone-input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input id="reg-email" type="email" placeholder="ornek@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Şifre</Label>
            <PasswordInput
              id="reg-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">{PASSWORD_RULES_HINT}</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Kaydediliyor...' : 'Kayıt ol'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              Zaten hesabım var – Giriş yap
            </Link>
          </p>
          {onPasswordHelpClick ? (
            <p className="text-center text-sm">
              <button
                type="button"
                onClick={onPasswordHelpClick}
                className="text-muted-foreground underline-offset-4 hover:underline"
              >
                Şifremi unuttum
              </button>
            </p>
          ) : null}
        </CardFooter>
      </form>
    </Card>
  );
}
