export const ONBOARDING_GOAL_STEP_INDEX = 4;

export type OnboardingInputKind = 'amount' | 'goalText';

export function getOnboardingInputKind(stepIndex: number): OnboardingInputKind {
  return stepIndex === ONBOARDING_GOAL_STEP_INDEX ? 'goalText' : 'amount';
}

export function sanitizeOnboardingAmountInput(value: string): string {
  return value.replace(/[^\d\s.,₺]/g, '');
}

export function filterGoalTextInput(prev: string, next: string): string {
  const check = next.replace(/\s*(tl|try|₺|lira)\s*/gi, '').trim();
  if (check.length > 0 && /^[\d\s.,₺]+$/i.test(check)) {
    return prev;
  }
  return next;
}

export function isValidGoalTextInput(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  const noCurrency = t.replace(/\s*(tl|try|₺|lira)\s*/gi, '').trim();
  if (/^[\d\s.,₺]+$/i.test(noCurrency)) return false;
  try {
    return /\p{L}/u.test(noCurrency);
  } catch {
    return /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(noCurrency);
  }
}
