import { useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line } from 'react-native-svg';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { RusWalletLogoMark } from './brand/RusWalletLogoMark';
import { useAppTheme } from '../context/ThemeContext';
import { mobileAuthVisual } from './auth/mobileAuthVisualTokens';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const HERO_SUB =
  'Kişisel finans uygulaman: bütçeni planla, işlemlerini takip et, fiş veya sesle hızlı kayıt ekle; yapay zeka asistanın sorularına anında yanıt versin.';

/**
 * Logo animasyonundan sonra: ortada RW; metinler sola yaslı, dar sütun ekranda ortada; kaydır / dokun → giriş.
 */
export function MobileHeroIntroScreen({ onContinue }: { onContinue: () => void }) {
  const insets = useSafeAreaInsets();
  const paper = useTheme();
  const { mode, toggleTheme } = useAppTheme();
  const isDark = mode === 'dark';
  const v = isDark ? mobileAuthVisual.dark : mobileAuthVisual.light;
  const done = useRef(false);

  const go = useCallback(() => {
    if (done.current) return;
    done.current = true;
    onContinue();
  }, [onContinue]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (e.nativeEvent.contentOffset.y > 28) go();
    },
    [go]
  );

  const gridColor = isDark ? 'rgba(148,163,184,0.35)' : 'rgba(15,118,110,0.35)';
  const gridStep = 48;
  const lineCount = Math.ceil(SCREEN_H / gridStep) + 4;
  const colCount = Math.ceil(SCREEN_W / gridStep) + 2;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={
          isDark
            ? ['#020617', '#0f172a', '#0c1424']
            : ['#f8fafc', '#ffffff', 'rgba(240,249,255,0.92)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={
          isDark
            ? ['rgba(15,23,42,0.9)', 'transparent', 'rgba(30,58,138,0.2)']
            : ['rgba(224,242,254,0.55)', 'transparent', 'rgba(207,250,254,0.45)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(14,165,233,0.12)', 'transparent', 'transparent']}
        start={{ x: 0.15, y: 0.05 }}
        end={{ x: 0.9, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(6,182,212,0.1)']}
        start={{ x: 0.2, y: 0.3 }}
        end={{ x: 0.95, y: 0.95 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: lineCount }).map((_, i) => (
          <Line
            key={`h-${i}`}
            x1={0}
            y1={i * gridStep}
            x2={SCREEN_W}
            y2={i * gridStep}
            stroke={gridColor}
            strokeWidth={1}
            opacity={isDark ? 0.07 : 0.045}
          />
        ))}
        {Array.from({ length: colCount }).map((_, i) => (
          <Line
            key={`v-${i}`}
            x1={i * gridStep}
            y1={0}
            x2={i * gridStep}
            y2={SCREEN_H}
            stroke={gridColor}
            strokeWidth={1}
            opacity={isDark ? 0.07 : 0.045}
          />
        ))}
      </Svg>

      <Svg
        width={SCREEN_W * 1.1}
        height={SCREEN_H * 0.42}
        viewBox="0 0 800 200"
        preserveAspectRatio="none"
        style={[styles.waves, { bottom: SCREEN_H * 0.1 }]}
        pointerEvents="none"
      >
        <Path
          d="M0 160 Q120 40 220 100 T440 80 T620 120 T800 60"
          stroke={isDark ? 'rgba(56,189,248,0.22)' : 'rgba(2,132,199,0.25)'}
          strokeWidth={1.5}
          fill="none"
        />
        <Path
          d="M0 175 Q200 130 360 150 T640 100 T800 140"
          stroke={isDark ? 'rgba(56,189,248,0.14)' : 'rgba(2,132,199,0.16)'}
          strokeWidth={1}
          fill="none"
          opacity={0.5}
        />
      </Svg>

      <ScrollView
        scrollEventThrottle={16}
        onScroll={onScroll}
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={{
          flexGrow: 1,
          minHeight: SCREEN_H + 120,
          justifyContent: 'center',
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 28,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={go}
          style={styles.pressArea}
          accessibilityRole="button"
          accessibilityLabel="Giriş veya kayıt ekranına geç"
        >
          <SafeAreaView edges={['left', 'right']} style={styles.safeContent}>
            <View style={styles.centerColumn}>
              <View style={styles.logoColumn}>
                <RusWalletLogoMark variant="auth" style={{ alignSelf: 'center' }} />
              </View>

              <View style={styles.copyBlock}>
                <Text style={[styles.headline, { color: paper.colors.onSurface }]}>
                  Gelirini ve harcamanı{' '}
                  <Text style={[styles.accent, { color: paper.colors.primary }]}>tek ekranda</Text>{' '}
                  net gör.
                </Text>
                <Text style={[styles.sub, { color: paper.colors.onSurfaceVariant }]}>{HERO_SUB}</Text>
              </View>

              <View style={styles.footerDots} accessibilityElementsHidden={true}>
                <View style={[styles.dot, { backgroundColor: paper.colors.primary, opacity: 0.95 }]} />
                <View style={[styles.dot, { backgroundColor: paper.colors.primary, opacity: 0.45 }]} />
                <View style={[styles.dot, { backgroundColor: paper.colors.primary, opacity: 0.28 }]} />
              </View>

              <View style={styles.hintWrap}>
                <Text style={[styles.hint, { color: v.muted }]}>
                  Devam etmek için dokunun veya aşağı kaydırın
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </Pressable>
      </ScrollView>

      <Pressable
        onPress={toggleTheme}
        style={({ pressed }) => [
          styles.themeBtn,
          {
            top: insets.top + 8,
            borderColor: v.border,
            backgroundColor: isDark ? 'rgba(30, 41, 51, 0.92)' : 'rgba(255,255,255,0.92)',
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        hitSlop={10}
        accessibilityLabel={isDark ? 'Açık tema' : 'Koyu tema'}
      >
        <MaterialCommunityIcons
          name={isDark ? 'white-balance-sunny' : 'weather-night'}
          size={22}
          color={v.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  waves: {
    position: 'absolute',
    left: -SCREEN_W * 0.05,
    opacity: 0.95,
  },
  themeBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressArea: {
    width: '100%',
    paddingHorizontal: 22,
    minHeight: SCREEN_H - 24,
    justifyContent: 'center',
  },
  safeContent: {
    width: '100%',
    alignItems: 'stretch',
  },
  centerColumn: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  logoColumn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  copyBlock: {
    width: '100%',
    gap: 16,
    marginBottom: 28,
    alignSelf: 'stretch',
  },
  headline: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
    letterSpacing: -0.55,
    textAlign: 'left',
  },
  accent: {
    fontWeight: '700',
  },
  sub: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'left',
  },
  footerDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 20,
    justifyContent: 'flex-start',
    width: '100%',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hintWrap: {
    marginTop: 20,
    paddingBottom: 8,
    width: '100%',
  },
  hint: {
    fontSize: 13,
    textAlign: 'left',
  },
});
