import { useMemo } from 'react';
import { Flag, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserFinancialProfilePayload } from '@/types/onboarding';
import { parseSavingsTargetFromGoalText } from '@/lib/parseSavingsTargetFromGoalText';
import { cn } from '@/lib/utils';
import { SavingsGoalRingPlanner } from './SavingsGoalRingPlanner';

function fmtTry(n: number): string {
  return `${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`;
}

interface AnalysisFinancialGoalSectionProps {
  mainGoal: string;
  profile: UserFinancialProfilePayload;
  balance: number;
}

export function AnalysisFinancialGoalSection({ mainGoal, profile, balance }: AnalysisFinancialGoalSectionProps) {

  const trimmed = mainGoal.trim();
  const parsedFromText = useMemo(() => parseSavingsTargetFromGoalText(trimmed), [trimmed]);
  const storedTarget =
    profile.savingsTargetAmount != null && profile.savingsTargetAmount > 0
      ? Number(profile.savingsTargetAmount)
      : null;
  const effectiveTarget = storedTarget ?? parsedFromText;



  const income =
    profile.monthlyIncomeNet != null && profile.monthlyIncomeNet > 0 ? Number(profile.monthlyIncomeNet) : null;
  const fixedCosts =
    profile.monthlyFixedCostsApprox != null && profile.monthlyFixedCostsApprox > 0
      ? Number(profile.monthlyFixedCostsApprox)
      : null;

  const surplus =
    income != null && fixedCosts != null ? Math.max(0, income - fixedCosts) : null;

  const suggestedMonthly =
    surplus != null && surplus > 0
      ? Math.min(30_000, Math.max(5_000, Math.round(surplus / 2 / 500) * 500))
      : 5_000;

  if (!trimmed) return null;

  return (
    <section id="finans-hedef" className="scroll-mt-24" aria-labelledby="analysis-goal-heading">
      <Card
        className={cn(
          'overflow-hidden border-border/60 ',
          'shadow-elevation shadow-amber-500/10 dark:shadow-lg dark:shadow-amber-500/5 '
        )}
      >
        <CardHeader className="space-y-2 pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/25 to-amber-600/10 text-amber-800 shadow-inner dark:text-amber-300">
                <Flag className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <CardTitle id="analysis-goal-heading" className="text-lg font-semibold tracking-tight">
                  Hedeflerim
                </CardTitle>
                <CardDescription className="max-w-xl text-xs sm:text-sm">
                  Metin ve tutarlar{' '}
                  <strong className="font-medium text-foreground/90">Finans tanıtımı</strong>ndan gelir; güncellemek
                  için aşağıdaki bağlantıyı kullan.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          

          <div className="flex items-center rounded-xl border border-border/50 bg-card/90 px-4 py-4 text-base leading-relaxed shadow-elevation backdrop-blur-sm dark:shadow-sm">
            <Sparkles className="h-4 w-4 text-amber-600/80 dark:text-amber-400/90" aria-hidden />
            <p className="text-foreground capitalize ml-2">{trimmed}</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Birikim hedefi</p>
            {effectiveTarget != null && effectiveTarget > 0 ? (
              <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                {fmtTry(effectiveTarget)}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Tanıtım hedef metninde tutar net değil. İstersen tanıtımda net bir TL hedefi yaz.
              </p>
            )}
            {parsedFromText != null && storedTarget == null && parsedFromText === effectiveTarget ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Metinde geçen <strong className="font-medium text-foreground">{fmtTry(parsedFromText)}</strong>{' '}
                okunuyor; kalıcı kayıt için tanıtımda netleştir.
              </p>
            ) : null}
          </div>

          {effectiveTarget != null && effectiveTarget > 0 ? (
            <SavingsGoalRingPlanner
              targetAmount={effectiveTarget}
              currentBalance={balance}
              monthlyIncomeNet={income}
              monthlyFixedCosts={fixedCosts}
              defaultMonthlySaving={suggestedMonthly}
            />
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
