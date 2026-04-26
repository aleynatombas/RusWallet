import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { MobileGlobalVoiceReceiptEntry } from './src/components/MobileGlobalVoiceReceiptEntry';
import { MobileLogoIntroSplash } from './src/components/MobileLogoIntroSplash';
import { MobileHeroIntroScreen } from './src/components/MobileHeroIntroScreen';
import { setIntroStoryComplete } from './src/lib/introStorage';

function ThemedStatusBar() {
  const { mode } = useAppTheme();
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

function AppInner() {
  return (
    <>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <MobileGlobalVoiceReceiptEntry />
      </AuthProvider>
      <ThemedStatusBar />
    </>
  );
}

type IntroPhase = 'logo' | 'hero' | 'app';

function AppWithIntro() {
  const { paperTheme } = useAppTheme();
  const [introPhase, setIntroPhase] = useState<IntroPhase>('logo');
  const rootBg = paperTheme.colors.background;

  const onLogoDone = useCallback(() => {
    setIntroPhase('hero');
  }, []);
  const onHeroDone = useCallback(() => {
    void (async () => {
      await setIntroStoryComplete();
      setIntroPhase('app');
    })();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: rootBg }]}>
      {introPhase === 'logo' ? <MobileLogoIntroSplash onComplete={onLogoDone} /> : null}
      {introPhase === 'hero' ? <MobileHeroIntroScreen onContinue={onHeroDone} /> : null}
      {introPhase === 'app' ? <AppInner /> : null}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppWithIntro />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
