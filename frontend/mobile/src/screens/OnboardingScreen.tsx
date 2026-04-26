import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, Text, TextInput, useTheme, ActivityIndicator, IconButton } from 'react-native-paper';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { api, getApiErrorMessage } from '../services/api';
import type { AppStackParamList } from '../navigation/types';
import type { OnboardingAnswerResponseDto, OnboardingStateDto } from '../types/onboarding';
import {
  filterGoalTextInput,
  getOnboardingInputKind,
  isValidGoalTextInput,
  sanitizeOnboardingAmountInput,
} from '../lib/onboardingInput';

type Line = { role: 'assistant' | 'user'; text: string };

type Nav = NativeStackNavigationProp<AppStackParamList, 'Onboarding'>;
type R = RouteProp<AppStackParamList, 'Onboarding'>;

function splitSummaryLine(line: string): { label: string; value: string } {
  const idx = line.indexOf(':');
  if (idx === -1) return { label: '', value: line.trim() };
  return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
}

/** Web `formatInlineBold` — **metin** */
function BoldChatLine({ text, color }: { text: string; color: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <Text style={{ color, lineHeight: 22, fontSize: 14 }}>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={{ fontWeight: '600', color }}>
            {p}
          </Text>
        ) : (
          <Text key={`t-${i}`}>{p}</Text>
        )
      )}
    </Text>
  );
}

function BoldSummaryPiece({ text, style }: { text: string; style: TextStyle }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <Text style={style}>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={[style, { fontWeight: '600' }]}>
            {p}
          </Text>
        ) : (
          <Text key={i}>{p}</Text>
        )
      )}
    </Text>
  );
}

function stripBold(s: string) {
  return s.replace(/\*\*(.+?)\*\*/g, '$1');
}

export function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { user, setOnboardingCompletedLocal, voluntaryProfileUpdate, setVoluntaryProfileUpdate } = useAuth();
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [hubMode, setHubMode] = useState(false);
  const [allowSkip, setAllowSkip] = useState(false);
  const [reopenBusy, setReopenBusy] = useState(false);
  const [summaryLines, setSummaryLines] = useState<string[] | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [stateReady, setStateReady] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const isRevisitEntry = route.params?.mode === 'revisit';
  const first = user?.firstName?.trim() || 'Merhaba';

  const pushA = useCallback((t: string) => setLines((p) => [...p, { role: 'assistant', text: t }]), []);
  const pushU = useCallback((t: string) => setLines((p) => [...p, { role: 'user', text: t }]), []);

  const goMainTabs = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }, [navigation]);

  const bootstrapChat = useCallback(
    (data: OnboardingStateDto, variant: 'welcome' | 'resume' | 'update') => {
      const intro =
        variant === 'welcome'
          ? `Merhaba, ${first}! **Akıllı tanıtım** ile birkaç soruda profilini oluşturalım.`
          : variant === 'resume'
            ? `${first}, **Akıllı tanıtım**a kaldığın yerden devam edelim.`
            : `${first}, **Akıllı tanıtım** ile bilgilerini güncelleyelim.`;
      setLines([
        { role: 'assistant', text: intro },
        { role: 'assistant', text: data.assistantMessage },
      ]);
      setHubMode(false);
    },
    [first]
  );

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [lines, hubMode]);

  const leaveOnboarding = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else goMainTabs();
  }, [navigation, goMainTabs]);

  const dismissSeniTaniyalim = useCallback(async () => {
    if (voluntaryProfileUpdate) {
      try {
        await api.post('/Onboarding/abort-reopen');
        setVoluntaryProfileUpdate(false);
        setOnboardingCompletedLocal(true);
        const { data } = await api.get<OnboardingStateDto>('/Onboarding/state');
        setSummaryLines(data.summaryLines ?? null);
        setStepIndex(data.stepIndex);
        setHubMode(true);
        setLines([]);
        setAllowSkip(false);
        setLoadError('');
        setInput('');
        setBusy(false);
      } catch {
        leaveOnboarding();
      }
    } else {
      leaveOnboarding();
    }
  }, [
    voluntaryProfileUpdate,
    setVoluntaryProfileUpdate,
    setOnboardingCompletedLocal,
    leaveOnboarding,
  ]);

  useEffect(() => {
    let cancelled = false;
    setStateReady(false);
    (async () => {
      try {
        setLoadError('');
        const { data } = await api.get<OnboardingStateDto>('/Onboarding/state');
        if (cancelled) return;
        if (data.completed) {
          if (!isRevisitEntry) {
            setOnboardingCompletedLocal(true);
            navigation.replace('MainTabs');
            setStateReady(true);
            return;
          }
          setOnboardingCompletedLocal(true);
          setSummaryLines(data.summaryLines ?? null);
          setHubMode(true);
          setAllowSkip(false);
          setLines([]);
          setStateReady(true);
          return;
        }
        setStepIndex(data.stepIndex);
        setOnboardingCompletedLocal(false);
        setAllowSkip(!voluntaryProfileUpdate);
        const variant =
          voluntaryProfileUpdate && data.stepIndex === 0
            ? 'update'
            : data.stepIndex > 0
              ? 'resume'
              : 'welcome';
        bootstrapChat(data, variant);
        setStateReady(true);
      } catch (e) {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(e, 'Bağlantı hatası.'));
          setStateReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    /* voluntaryProfileUpdate bilinçli olarak dışarıda: web OnboardingPanel ile aynı — yeniden fetch sohbeti silmesin. */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sadece giriş / route için
  }, [first, bootstrapChat, setOnboardingCompletedLocal, navigation, isRevisitEntry]);

  const onReopen = useCallback(async () => {
    setReopenBusy(true);
    setActionError('');
    try {
      await api.post('/Onboarding/reopen');
      setOnboardingCompletedLocal(false);
      setVoluntaryProfileUpdate(true);
      const { data } = await api.get<OnboardingStateDto>('/Onboarding/state');
      if (data.completed) {
        setVoluntaryProfileUpdate(false);
        setActionError('Yeniden açılamadı. Sayfayı yenileyip tekrar dene.');
        return;
      }
      setStepIndex(data.stepIndex);
      bootstrapChat(data, 'update');
    } catch (e) {
      setVoluntaryProfileUpdate(false);
      setActionError(getApiErrorMessage(e, 'Bağlantı hatası.'));
    } finally {
      setReopenBusy(false);
    }
  }, [bootstrapChat, setOnboardingCompletedLocal, setVoluntaryProfileUpdate]);

  const onSend = useCallback(async () => {
    const msg = input.trim();
    if (!msg || busy || lines.length === 0) return;
    if (getOnboardingInputKind(stepIndex) === 'goalText' && !isValidGoalTextInput(msg)) {
      pushA(
        'Finansal hedefin ne? Sadece yazılı anlat; rakam veya tutar yazma. Bu hedef için TL tutarını bir sonraki adımda soracağım.'
      );
      return;
    }
    setInput('');
    pushU(msg);
    setBusy(true);
    try {
      const { data } = await api.post<OnboardingAnswerResponseDto>('/Onboarding/answer', { message: msg });
      setStepIndex(data.nextStepIndex);
      pushA(data.assistantReply);
      if (data.assistantMessageFollowUp) pushA(data.assistantMessageFollowUp);
      if (data.completed) {
        setVoluntaryProfileUpdate(false);
        setOnboardingCompletedLocal(true);
        if (data.summaryLines?.length) {
          pushA('Özet:\n' + data.summaryLines.map((l) => `• ${stripBold(l)}`).join('\n'));
        }
        setTimeout(() => goMainTabs(), 800);
      }
    } catch (e) {
      pushA(getApiErrorMessage(e, 'Gönderilemedi. Tekrar dene.'));
    } finally {
      setBusy(false);
    }
  }, [input, busy, lines.length, stepIndex, pushU, pushA, setOnboardingCompletedLocal, goMainTabs, setVoluntaryProfileUpdate]);

  const onSkip = useCallback(async () => {
    try {
      await api.post('/Onboarding/skip');
      setVoluntaryProfileUpdate(false);
      setOnboardingCompletedLocal(true);
      goMainTabs();
    } catch {
      pushA('Şimdilik atlanamadı. İnternet bağlantını kontrol et.');
    }
  }, [setOnboardingCompletedLocal, goMainTabs, pushA, setVoluntaryProfileUpdate]);

  const inputKind = getOnboardingInputKind(stepIndex);
  const placeholder = useMemo(
    () => (inputKind === 'amount' ? 'Tutarı yaz' : 'Kısaca yaz'),
    [inputKind]
  );

  /** Tam ekran onboarding (revisit değil). Revisit’te KAV ayrı — aşağıdaki `revisitKeyboardOffset`. */
  const keyboardAvoidingBehavior = Platform.OS === 'ios' ? 'padding' : 'height';
  const keyboardVerticalOffset = 0;

  /** iOS: güvenli alan + küçük düzeltme; fazla offset kartı gereksiz yukarı iter */
  const revisitKeyboardOffset = Platform.OS === 'ios' ? insets.top + 4 : 0;

  const isDark = theme.dark;
  /** Gönüllü güncelleme (modal): Paper arka planı; ilk kurulumda hafif açık ton + gradient */
  const bg = isRevisitEntry ? theme.colors.background : isDark ? theme.colors.background : '#f8fafc';

  /** Web `OnboardingPage` / `OnboardingOverlay`: max-w-lg, max-h min(85vh, 100dvh-5rem); sohbet alanı min(56vh, 520px) */
  const { width: winW, height: winH } = Dimensions.get('window');
  const revisitCardMaxW = Math.min(winW - 32, 512);
  const revisitCardMaxH = Math.min(winH * 0.85, winH - 56);
  const revisitChatScrollMaxH = Math.min(winH * 0.56, 520);

  const closeRevisit = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (loadError) {
    if (isRevisitEntry) {
      return (
        <View style={styles.revisitRoot}>
          <Pressable style={styles.revisitBackdrop} onPress={closeRevisit} accessibilityRole="button" accessibilityLabel="Kapat" />
          <View
            style={[
              styles.revisitCenter,
              { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
            ]}
            pointerEvents="box-none"
          >
            <View
              style={[
                styles.revisitCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                  maxWidth: revisitCardMaxW,
                  maxHeight: revisitCardMaxH,
                  padding: 20,
                },
              ]}
            >
              <Text style={{ color: theme.colors.error }}>{loadError}</Text>
              <Button mode="contained" style={{ marginTop: 16 }} onPress={closeRevisit}>
                Kapat
              </Button>
            </View>
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <Text style={{ color: theme.colors.error }}>{loadError}</Text>
      </View>
    );
  }

  if (!stateReady) {
    if (isRevisitEntry) {
      return (
        <View style={styles.revisitRoot}>
          <Pressable style={styles.revisitBackdrop} onPress={closeRevisit} accessibilityRole="button" accessibilityLabel="Kapat" />
          <View
            style={[
              styles.revisitCenter,
              { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
            ]}
            pointerEvents="box-none"
          >
            <View
              style={[
                styles.revisitCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                  maxWidth: revisitCardMaxW,
                  maxHeight: revisitCardMaxH,
                  paddingVertical: 28,
                  paddingHorizontal: 24,
                },
              ]}
            >
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={{ marginTop: 12, textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
                Yükleniyor…
              </Text>
            </View>
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>Yükleniyor…</Text>
      </View>
    );
  }

  const onboardingBody = (
    <>
      {!isRevisitEntry ? (
        <LinearGradient
          colors={
            isDark
              ? ['rgba(129, 140, 248, 0.12)', 'rgba(45, 212, 191, 0.06)', bg]
              : ['rgba(129, 140, 248, 0.18)', 'rgba(45, 212, 191, 0.08)', bg]
          }
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      ) : null}

      {!hubMode ? (
        <View style={[styles.topBar, isRevisitEntry && styles.topBarRevisitInCard]}>
          {allowSkip ? (
            <Button mode="text" compact onPress={() => void onSkip()} textColor={theme.colors.onSurfaceVariant} style={styles.topBarSkip}>
              Şimdilik atla
            </Button>
          ) : (
            <View style={styles.topBarSpacer} />
          )}
          <IconButton icon="close" size={22} onPress={() => void dismissSeniTaniyalim()} accessibilityLabel="Kapat" />
        </View>
      ) : null}

      {hubMode ? (
        <ScrollView
          contentContainerStyle={[
            styles.hubScroll,
            isRevisitEntry && styles.hubScrollRevisit,
            isRevisitEntry && { paddingBottom: 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <Text
            style={[
              styles.hubLead,
              { color: theme.colors.onSurfaceVariant },
              isRevisitEntry && styles.hubLeadRevisit,
            ]}
          >
            Gelir, gider ve hedefinizi buradan ileterek kişisel finansal portföyünüzü anında oluşturun.
          </Text>
          {summaryLines?.length ? (
            <View
              style={[
                styles.summaryLinesBox,
                {
                  borderColor: theme.colors.outlineVariant,
                  backgroundColor: theme.dark ? 'rgba(255,255,255,0.04)' : theme.colors.surfaceVariant,
                },
              ]}
            >
              <View style={[styles.summaryHeaderRow, { borderBottomColor: theme.colors.outlineVariant }]}>
                <Text style={[styles.summaryHeaderTitle, { color: theme.colors.onSurfaceVariant }]}>Profil özeti</Text>
              </View>
              {summaryLines.map((l, i) => {
                const { label, value } = splitSummaryLine(l);
                const showPair = Boolean(label && value);
                return (
                  <View
                    key={`${i}-${l.slice(0, 20)}`}
                    style={[
                      styles.summaryLineRow,
                      i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant },
                    ]}
                  >
                    {showPair ? (
                      <View style={styles.summaryPair}>
                        <View style={styles.summaryLabelCol}>
                          <BoldSummaryPiece text={label} style={{ color: theme.colors.onSurfaceVariant, fontSize: 13, lineHeight: 20 }} />
                        </View>
                        <View style={styles.summaryValueCol}>
                          <BoldSummaryPiece
                            text={value}
                            style={{
                              color: theme.colors.onSurface,
                              fontSize: 14,
                              fontWeight: '600',
                              textAlign: 'right',
                              lineHeight: 20,
                            }}
                          />
                        </View>
                      </View>
                    ) : (
                      <BoldSummaryPiece text={l} style={{ color: theme.colors.onSurface, fontSize: 14, lineHeight: 22 }} />
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View
              style={[
                styles.summaryLinesBox,
                { borderColor: theme.colors.outlineVariant, backgroundColor: theme.dark ? 'rgba(255,255,255,0.04)' : theme.colors.surfaceVariant },
              ]}
            >
              <View style={[styles.summaryHeaderRow, { borderBottomColor: theme.colors.outlineVariant }]}>
                <Text style={[styles.summaryHeaderTitle, { color: theme.colors.onSurfaceVariant }]}>Profil özeti</Text>
              </View>
              <Text style={[styles.emptySummary, { color: theme.colors.onSurfaceVariant }]}>Henüz özet bilgisi yok.</Text>
            </View>
          )}
          {actionError ? <Text style={{ color: theme.colors.error, marginTop: 8 }}>{actionError}</Text> : null}
          <View style={styles.hubActions}>
            <Button mode="contained" onPress={() => void onReopen()} loading={reopenBusy} disabled={reopenBusy}>
              {reopenBusy ? 'Açılıyor…' : 'Sohbetle güncelle'}
            </Button>
            <Button mode="outlined" onPress={() => (isRevisitEntry ? closeRevisit() : leaveOnboarding())}>
              Kapat
            </Button>
          </View>
        </ScrollView>
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            style={
              isRevisitEntry
                ? [styles.scrollRevisitChat, { maxHeight: revisitChatScrollMaxH }]
                : styles.scroll
            }
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            {lines.map((line, i) => (
              <View
                key={`${i}-${line.text.slice(0, 16)}`}
                style={[
                  styles.bubble,
                  line.role === 'assistant'
                    ? {
                        alignSelf: 'stretch',
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.12)',
                        backgroundColor: theme.dark ? 'rgba(255,255,255,0.06)' : theme.colors.surfaceVariant,
                        borderTopLeftRadius: 4,
                      }
                    : {
                        alignSelf: 'flex-end',
                        maxWidth: '88%',
                        backgroundColor: theme.colors.primaryContainer,
                        borderTopRightRadius: 4,
                      },
                ]}
              >
                {line.role === 'assistant' ? (
                  <BoldChatLine
                    text={line.text}
                    color={theme.colors.onSurface}
                  />
                ) : (
                  <Text style={{ color: theme.colors.onPrimaryContainer, lineHeight: 22, fontSize: 14 }}>{line.text}</Text>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}>
            <TextInput
              mode="outlined"
              dense
              value={input}
              onChangeText={(t) =>
                setInput((prev) =>
                  inputKind === 'amount' ? sanitizeOnboardingAmountInput(t) : filterGoalTextInput(prev, t)
                )
              }
              placeholder={placeholder}
              disabled={busy || lines.length === 0}
              style={styles.input}
              onSubmitEditing={() => void onSend()}
              keyboardType={inputKind === 'amount' ? 'decimal-pad' : 'default'}
            />
            <Button mode="contained" onPress={() => void onSend()} disabled={busy || !input.trim() || lines.length === 0}>
              Gönder
            </Button>
          </View>
        </>
      )}
    </>
  );

  if (isRevisitEntry) {
    return (
      <View style={styles.revisitRoot}>
        <Pressable style={styles.revisitBackdrop} onPress={closeRevisit} accessibilityRole="button" accessibilityLabel="Kapat" />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={revisitKeyboardOffset}
        >
          <View
            style={[
              styles.revisitCenter,
              { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 },
            ]}
            pointerEvents="box-none"
          >
            <View
              style={[
                styles.revisitCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                  maxWidth: revisitCardMaxW,
                  maxHeight: revisitCardMaxH,
                },
                hubMode ? styles.revisitCardHub : styles.revisitCardChat,
              ]}
              accessibilityLabel={hubMode ? 'Seni tanıyalım, profil özeti' : 'Akıllı tanıtım sohbeti'}
            >
              {hubMode ? (
                <View style={styles.revisitHubCloseRow}>
                  <View style={{ flex: 1 }} />
                  <IconButton icon="close" size={22} onPress={closeRevisit} accessibilityLabel="Kapat" />
                </View>
              ) : null}
              {onboardingBody}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: bg }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={keyboardAvoidingBehavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {onboardingBody}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  revisitRoot: { flex: 1 },
  revisitBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  revisitCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  revisitCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 20,
      },
      android: { elevation: 14 },
    }),
  },
  /** Web OnboardingPageCard: kart içeriğe göre; tam ekranı kaplamaz */
  revisitCardHub: {
    alignSelf: 'center',
  },
  revisitCardChat: {
    alignSelf: 'center',
  },
  revisitHubCloseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 2,
    paddingTop: 4,
    paddingBottom: 2,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
  },
  /** Web `OnboardingPanel` dialog içi: üst boşluk az */
  topBarRevisitInCard: {
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  topBarSkip: { marginRight: 'auto' },
  topBarSpacer: { flex: 1 },
  hubLead: { fontSize: 14, lineHeight: 22, marginBottom: 12, paddingHorizontal: 16 },
  hubLeadRevisit: { paddingHorizontal: 0 },
  scroll: { flex: 1 },
  /** Web: sohbet alanı max-h min(56vh, 520px) — tam ekran şişmesin */
  scrollRevisitChat: {
    width: '100%',
  },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 24 },
  hubScroll: { padding: 16, paddingBottom: 32 },
  /** Web `OnboardingPanel` page: px-4, space-y-3 */
  hubScrollRevisit: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  summaryLinesBox: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  summaryHeaderRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  summaryHeaderTitle: { fontSize: 13, fontWeight: '500', lineHeight: 20 },
  summaryLineRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  summaryPair: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  summaryLabelCol: { flex: 1, minWidth: 0 },
  summaryValueCol: { flexShrink: 0, maxWidth: '58%', alignItems: 'flex-end' },
  emptySummary: { textAlign: 'center', paddingVertical: 24, fontSize: 14 },
  hubActions: { marginTop: 16, gap: 8, paddingHorizontal: 4 },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, maxHeight: 100 },
});
