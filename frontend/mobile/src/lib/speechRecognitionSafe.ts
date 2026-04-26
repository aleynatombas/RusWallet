import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

type SpeechPkg = typeof import('expo-speech-recognition');

let cached: SpeechPkg | null | undefined;

/**
 * expo-speech-recognition native modülü yoksa (Expo Go, web, eksik derleme) require() hata verir.
 * Özellikle Expo Go'da `require('expo-speech-recognition')` yüklenirken requireNativeModule eşzamanlı
 * hata fırlatır; bu yüzden StoreClient'ta paketi hiç yüklemeden null dönüyoruz.
 */
export function getSpeechRecognitionPackage(): SpeechPkg | null {
  if (cached !== undefined) return cached;
  if (Platform.OS === 'web') {
    cached = null;
    return null;
  }
  /** Expo Go — özel yerel modüller (expo-speech-recognition) yüklü değil */
  const inExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === 'expo';
  if (inExpoGo) {
    cached = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-speech-recognition') as SpeechPkg;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export function isSpeechRecognitionNativeAvailable(): boolean {
  return getSpeechRecognitionPackage() !== null;
}
