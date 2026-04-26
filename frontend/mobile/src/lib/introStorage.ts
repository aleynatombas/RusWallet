import AsyncStorage from '@react-native-async-storage/async-storage';

/** İlk açılış kahraman (scroll) tamamlandı → bir daha logo/hero gösterme */
export const INTRO_STORY_COMPLETE_KEY = 'ruswallet-intro-story-complete';

export async function isIntroStoryComplete(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(INTRO_STORY_COMPLETE_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function setIntroStoryComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(INTRO_STORY_COMPLETE_KEY, '1');
  } catch {
    /* ignore */
  }
}
