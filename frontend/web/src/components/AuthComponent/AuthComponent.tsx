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
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type Mode = 'login' | 'register';

interface AuthComponentProps {
  mode: Mode;
  onSuccess?: () => void;
}

export function AuthComponent({ mode, onSuccess }: AuthComponentProps) {
  const { login, register, isLoading } = useAuth();
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login({ email, password } as LoginRequest);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız.');
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await register({ firstName, lastName, phoneNumber, email, password } as RegisterRequest);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız.');
    }
  }

  if (mode === 'login') {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>RusWallet – Giriş</CardTitle>
          <CardDescription>Hesabınıza giriş yapın</CardDescription>
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
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş yap'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/register" className="text-primary underline-offset-4 hover:underline">Kayıt ol</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>RusWallet – Kayıt</CardTitle>
        <CardDescription>Yeni hesap oluşturun</CardDescription>
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
            <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input id="reg-email" type="email" placeholder="ornek@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Şifre</Label>
            <Input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Kaydediliyor...' : 'Kayıt ol'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">Zaten hesabım var – Giriş yap</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
