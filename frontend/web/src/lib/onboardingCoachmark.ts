const PREFIX = 'ruswallet_onboarding_coach_dismissed_';

export function onboardingCoachDismissKey(userId: number): string {
  return `${PREFIX}${userId}`;
}

export function isOnboardingCoachDismissed(userId: number): boolean {
  try {
    return localStorage.getItem(onboardingCoachDismissKey(userId)) === '1';
  } catch {
    return false;
  }
}

export function dismissOnboardingCoach(userId: number): void {
  try {
    localStorage.setItem(onboardingCoachDismissKey(userId), '1');
  } catch {
    /* ignore */
  }
}
