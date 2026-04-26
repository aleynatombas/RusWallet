/**
 * Onboarding finans profili — yapılandırılmış kartlar; tutarlar sunucuda bu aya işlem olarak da yazılır.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Sparkles, Target, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { OnboardingStateDto } from '../../types/onboarding';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function formatTry(n: number): string {
  return `${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`;
}

function ProfileStat({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm',
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-base font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function DashboardProfileSummaryCard() {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingStateDto | null>(null);

  useEffect(() => {
    if (!user?.onboardingCompleted) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<OnboardingStateDto>('/Onboarding/state');
        if (cancelled) return;
        setState(data);
      } catch {
        if (!cancelled) setState(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.onboardingCompleted, user?.userId]);

  if (!user?.onboardingCompleted || !state?.completed) return null;

  const p = state.profile;
  const inc = p?.monthlyIncomeNet != null && p.monthlyIncomeNet > 0 ? Number(p.monthlyIncomeNet) : null;
  const fix = p?.monthlyFixedCostsApprox != null && p.monthlyFixedCostsApprox > 0 ? Number(p.monthlyFixedCostsApprox) : null;
  const goal = p?.mainGoal?.trim();

  if (inc == null && fix == null && !goal) return null;

  return (
    <Card
      className={cn(
        'overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.07] via-background to-primary/[0.04]',
        'shadow-sm dark:border-primary/25 dark:from-primary/15 dark:to-primary/5'
      )}
    >
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle className="text-lg font-semibold tracking-tight">Sohbetle kaydettiğin profil</CardTitle>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Net gelir ve sabit gider değerlerin bu ay için otomatik işlem satırı olarak da eklenir; gerçek
          hareketlerin geldikçe listeyi güncelleyebilirsin.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {(inc != null || fix != null) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {inc != null ? (
              <ProfileStat icon={Wallet} label="Net gelir" value={formatTry(inc)} />
            ) : null}
            {fix != null ? (
              <ProfileStat
                icon={Receipt}
                label="Sabit giderler (ay)"
                value={formatTry(fix)}
                className="border-primary/15 bg-primary/[0.04]"
              />
            ) : null}
          </div>
        )}

        {goal ? (
          <Link
            to="/analysis#finans-hedef"
            className={cn(
              'flex gap-3 rounded-xl border border-primary/20 bg-primary/[0.05] px-4 py-3 outline-none transition-colors dark:bg-primary/10',
              'hover:border-primary/40 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:hover:bg-primary/[0.14]'
            )}
          >
            <Target className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-primary/85 dark:text-primary/80">
                Hedef
                <span className="ml-1.5 font-normal normal-case text-muted-foreground">· Analizlerde aç</span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{goal}</p>
            </div>
          </Link>
        ) : null}

      </CardContent>
    </Card>
  );
}
