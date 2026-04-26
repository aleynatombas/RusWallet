import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RusWalletLogoMark } from './brand/RusWalletLogoMark';
import { useAppTheme } from '../context/ThemeContext';
import { mobileAuthVisual } from './auth/mobileAuthVisualTokens';

const LOGO_DURATION = 880;
const POST_INTRO_MS = 640;
const EXIT_FADE_MS = 380;

const CLIP_W = 320;
const CLIP_H = 148;

/**
 * Açılış: tema uyumlu arka plan + ortada büyük logo; giriş ve çıkışta hafif animasyon → kahraman.
 */
export function MobileLogoIntroSplash({ onComplete }: { onComplete: () => void }) {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const v = isDark ? mobileAuthVisual.dark : mobileAuthVisual.light;

  const rootOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.86)).current;
  const exitAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let cancelled = false;
    const intro = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: LOGO_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 78,
        useNativeDriver: true,
      }),
    ]);

    const runExit = () => {
      if (cancelled) return;
      const exitSeq = Animated.sequence([
        Animated.delay(POST_INTRO_MS),
        Animated.parallel([
          Animated.timing(rootOpacity, {
            toValue: 0,
            duration: EXIT_FADE_MS,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1.04,
            duration: EXIT_FADE_MS,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]);
      exitAnimRef.current = exitSeq;
      exitSeq.start(({ finished }) => {
        exitAnimRef.current = null;
        if (finished && !cancelled) onComplete();
      });
    };

    intro.start(({ finished }) => {
      if (finished && !cancelled) runExit();
    });

    return () => {
      cancelled = true;
      intro.stop();
      exitAnimRef.current?.stop();
      exitAnimRef.current = null;
    };
  }, [onComplete, rootOpacity, logoOpacity, logoScale]);

  return (
    <Animated.View style={[styles.fill, { opacity: rootOpacity }]} pointerEvents="auto">
      <LinearGradient colors={[...v.pageGradient]} style={StyleSheet.absoluteFill} />
      <View style={styles.center}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <View style={[styles.logoStage, { width: CLIP_W, height: CLIP_H }]}>
            <RusWalletLogoMark variant="splash" style={{ alignSelf: 'center' }} />
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  logoStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
