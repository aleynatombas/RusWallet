import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'ruswallet_onboarding_coach_dismissed_';

function key(userId: number): string {
  return `${PREFIX}${userId}`;
}

export async function isOnboardingCoachDismissed(userId: number): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key(userId))) === '1';
  } catch {
    return false;
  }
}

export async function dismissOnboardingCoach(userId: number): Promise<void> {
  try {
    await AsyncStorage.setItem(key(userId), '1');
  } catch {
    /* ignore */
  }
}
