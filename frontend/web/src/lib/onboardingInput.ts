/** Backend OnboardingService: adım 4 = hedef metni (sözel), diğerleri tutar. */
export const ONBOARDING_GOAL_STEP_INDEX = 4;

export type OnboardingInputKind = 'amount' | 'goalText';

export function getOnboardingInputKind(stepIndex: number): OnboardingInputKind {
  return stepIndex === ONBOARDING_GOAL_STEP_INDEX ? 'goalText' : 'amount';
}

/** Gelir / kira / fatura / abonelik / hedef tutarı: yalnızca tutar karakterleri. */
export function sanitizeOnboardingAmountInput(value: string): string {
  return value.replace(/[^\d\s.,₺]/g, '');
}

/** Yalnızca rakam/ayraç yazılmasını engeller; en az bir harf gelene kadar güncelleme reddedilir. */
export function filterGoalTextInput(prev: string, next: string): string {
  const check = next.replace(/\s*(tl|try|₺|lira)\s*/gi, '').trim();
  if (check.length > 0 && /^[\d\s.,₺]+$/i.test(check)) {
    return prev;
  }
  return next;
}

/** Hedef açıklaması: en az bir harf; sadece rakam/ayraç değil. */
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
