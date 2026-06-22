/**
 * Web `FloatingChatbot` ile aynı metinler, AI işareti (AiAssistantMark), başlık, kısayollar ve gönder düğmesi.
 * POST /Chatbot/ask — JWT ile kişiselleştirilmiş yanıtlar.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  DeviceEventEmitter,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';
import { api, getApiErrorMessage } from '../services/api';
import type { ChatAskResponse, ChatMessage } from '../types/chat';
import { MobileAiAssistantMark, MobileAiAssistantMarkShell } from './ai/MobileAiAssistantMark';

const QUICK_REPLIES = [
  'Bu ay ne kadar harcadım?',
  'Tasarruf önerisi ver',
  'Bakiyem nedir?',
  'Harcama kategorileri neler?',
];

const WELCOME_TEXT =
  'Merhaba! Sesle veya fişle gelir/gider eklemek için üstteki «Sesle işlem» veya «Fiş yükle» düğmesine dokunun: önce ses dinlenir veya fiş taranır, sonra açılan onay penceresinde okunan tutar ve açıklamayı kontrol edip düzeltebilir, Onayla derseniz işlem kaydedilir. Aşağıdan yazarak da soru sorabilirsiniz.';

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Alt sekme çubuğu için yaklaşık yükseklik (web `bottom-20`) */
const TAB_BAR_APPROX = 52;
const FAB_SIZE = 64;
const FAB_RIGHT = 16;
const PANEL_RIGHT = 12;
const PANEL_MAX_W = 400;

export type MobileFloatingChatbotProps = {
  /** `withTabs`: alt sekme üstü. `stack`: Ayarlar vb. (web `bottom-6`). */
  fabVariant?: 'withTabs' | 'stack';
  /**
   * `tab-bar-center`: sağdaki yüzen FAB gizlenir; asistan logosu alt sekmede ortada
   * (`MainTabCustomBar`) — `ruswallet-chat-toggle` ile açılır.
   */
  fabPlacement?: 'floating-right' | 'tab-bar-center';
};

export function MobileFloatingChatbot({
  fabVariant = 'withTabs',
  fabPlacement = 'floating-right',
}: MobileFloatingChatbotProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: 'welcome', role: 'assistant', text: WELCOME_TEXT },
  ]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const listRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput | null>(null);

  const tabBarCenter = fabPlacement === 'tab-bar-center';
  const fabBottom =
    fabVariant === 'stack' ? insets.bottom + 24 : insets.bottom + TAB_BAR_APPROX + 8;
  /** Orta sekme + çentik; yüzen FAB yok — panel alt çubuğun hemen üstü (çubuk kısaldıkça güncellenir) */
  const panelBottomBase = tabBarCenter ? insets.bottom + 96 : fabBottom + FAB_SIZE + 12;
  /** Klavye üstünde kalsın diye paneli yukarı kaydır */
  const panelBottom = panelBottomBase + keyboardHeight;
  const panelMaxH = Math.min(
    560,
    Math.max(280, windowHeight - panelBottomBase - keyboardHeight - insets.top - 16)
  );
  const panelW = Math.min(PANEL_MAX_W, windowWidth - PANEL_RIGHT * 2);
  const panelLeft = tabBarCenter ? Math.max(12, (windowWidth - panelW) / 2) : PANEL_RIGHT;
  const showFloatingFab = fabPlacement === 'floating-right';

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, open, loading, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      const userMsg: ChatMessage = { id: newId(), role: 'user', text: trimmed };
      setMessages((m) => [...m, userMsg]);
      setInput('');
      setLoading(true);
      try {
        const { data } = await api.post<ChatAskResponse>('/Chatbot/ask', { message: trimmed });
        const reply = data.response?.trim() || 'Yanıt alınamadı.';
        setMessages((m) => [...m, { id: newId(), role: 'assistant', text: reply }]);
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Bir hata oluştu.');
        setMessages((m) => [...m, { id: newId(), role: 'assistant', text: msg }]);
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  const sendMessageRef = useRef(sendMessage);
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      'ruswallet-chat-open',
      (detail?: { message?: string; autoSubmit?: boolean }) => {
        setOpen(true);
        const m = detail?.message?.trim();
        if (m) {
          setInput(m);
          if (detail?.autoSubmit) {
            setTimeout(() => {
              void sendMessageRef.current(m);
            }, 80);
          }
        }
      }
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('ruswallet-chat-toggle', () => {
      setOpen((o) => !o);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  /** Uygulama temasına uygun sohbet paleti */
  const c = theme.colors;
  const card = c.surface;
  const border = c.outline;
  const muted = c.surfaceVariant;
  const mutedFg = c.onSurfaceVariant;
  const fg = c.onSurface;
  const primary = c.primary;
  const onPrimary = c.onPrimary;
  const inputBg = c.background;
  const headerBg = theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
  const footerBg = theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const shortcutBorder = 'rgba(125, 211, 252, 0.35)';
  const shortcutBgA = 'rgba(36, 173, 219, 0.12)';
  const shortcutBgB = 'rgba(36, 173, 219, 0.08)';
  const shortcutBorderB = 'rgba(125, 211, 252, 0.28)';

  return (
    <>
      {open ? (
        <View style={[styles.overlay, { zIndex: 60 }]} pointerEvents="box-none">
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.25)' }]}
            onPress={() => setOpen(false)}
            accessibilityLabel="Arka plan — kapat"
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 12}
            style={[
              styles.panelOuter,
              {
                bottom: panelBottom,
                ...(tabBarCenter ? { left: panelLeft, right: undefined } : { right: PANEL_RIGHT }),
                width: panelW,
                height: panelMaxH,
                zIndex: 70,
              },
            ]}
          >
            <View
              style={[
                styles.panel,
                {
                  backgroundColor: card,
                  borderColor: border,
                  height: panelMaxH,
                },
              ]}
            >
              <View style={[styles.header, { borderBottomColor: border, backgroundColor: headerBg }]}>
                <View style={styles.headerTopRow}>
                  <View style={styles.headerLeft}>
                    <Pressable
                      onPress={() => inputRef.current?.focus()}
                      accessibilityLabel="Mesaj alanına geç"
                      hitSlop={8}
                      style={styles.markHit}
                    >
                      <MobileAiAssistantMark size="header" />
                    </Pressable>
                    <View style={styles.headerTitles}>
                      <Text style={[styles.headerTitle, { color: fg }]}>RusWallet Asistan</Text>
                      <Text style={[styles.headerSub, { color: mutedFg }]}>
                        Üst kısayollarla ses / fiş → onay → kayıt
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => setOpen(false)}
                    style={[styles.iconBtn, { borderColor: border }]}
                    hitSlop={12}
                    accessibilityLabel="Sohbeti kapat"
                  >
                    <MaterialCommunityIcons name="close" size={18} color={fg} />
                  </Pressable>
                </View>
                <View style={styles.shortcutRow}>
                  <Pressable
                    onPress={() => {
                      setOpen(false);
                      DeviceEventEmitter.emit('ruswallet-open-voice');
                    }}
                    style={({ pressed }) => [
                      styles.shortcutBase,
                      {
                        borderColor: shortcutBorder,
                        backgroundColor: shortcutBgA,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons name="microphone" size={16} color={primary} />
                    <Text style={[styles.shortcutLabel, { color: primary }]}>Sesle işlem</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setOpen(false);
                      DeviceEventEmitter.emit('ruswallet-open-receipt');
                    }}
                    style={({ pressed }) => [
                      styles.shortcutBase,
                      {
                        borderColor: shortcutBorderB,
                        backgroundColor: shortcutBgB,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons name="camera-outline" size={16} color={primary} />
                    <Text style={[styles.shortcutLabel, { color: primary }]}>Fiş yükle</Text>
                  </Pressable>
                </View>
              </View>

              <ScrollView
                ref={listRef}
                style={styles.msgScroll}
                contentContainerStyle={styles.msgScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
              >
                {messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[styles.msgRow, msg.role === 'user' ? styles.msgRowUser : styles.msgRowBot]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        msg.role === 'user'
                          ? { backgroundColor: primary, borderBottomRightRadius: 8 }
                          : { backgroundColor: muted, borderBottomLeftRadius: 8 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.bubbleText,
                          { color: msg.role === 'user' ? onPrimary : fg },
                        ]}
                      >
                        {msg.text}
                      </Text>
                    </View>
                  </View>
                ))}
                {loading ? (
                  <View style={styles.msgRowBot}>
                    <View style={[styles.bubble, styles.bubbleBotLoading, { backgroundColor: muted }]}>
                      <Text style={[styles.bubbleText, { color: mutedFg }]}>Yazıyor…</Text>
                    </View>
                  </View>
                ) : null}
              </ScrollView>

              <View style={[styles.footer, { borderTopColor: border, backgroundColor: footerBg }]}>
                <Text style={[styles.quickLabel, { color: mutedFg }]}>Hızlı sorular</Text>
                <View style={styles.quickRow}>
                  {QUICK_REPLIES.map((q) => (
                    <Pressable
                      key={q}
                      disabled={loading}
                      onPress={() => void sendMessage(q)}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          borderColor: border,
                          backgroundColor: card,
                          opacity: loading ? 0.5 : pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: fg }]} numberOfLines={2}>
                        {q}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    ref={inputRef}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Mesajınızı yazın…"
                    placeholderTextColor={mutedFg}
                    editable={!loading}
                    style={[
                      styles.input,
                      {
                        borderColor: border,
                        backgroundColor: inputBg,
                        color: fg,
                      },
                    ]}
                    returnKeyType="send"
                    onSubmitEditing={() => void sendMessage(input)}
                    blurOnSubmit={false}
                  />
                  <Pressable
                    onPress={() => void sendMessage(input)}
                    disabled={loading || !input.trim()}
                    style={({ pressed }) => [
                      styles.sendWrap,
                      {
                        opacity: loading || !input.trim() ? 0.4 : pressed ? 0.92 : 1,
                      },
                    ]}
                    accessibilityLabel="Gönder"
                  >
                    <MobileAiAssistantMarkShell size="header">
                      <MaterialCommunityIcons name="send" size={16} color={primary} />
                    </MobileAiAssistantMarkShell>
                  </Pressable>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      ) : null}

      {showFloatingFab ? (
        <Pressable
          onPress={() => setOpen((o) => !o)}
          style={({ pressed }) => [
            styles.fab,
            {
              bottom: fabBottom,
              right: FAB_RIGHT,
              zIndex: 65,
              opacity: pressed ? 0.95 : 1,
            },
          ]}
          accessibilityLabel={open ? 'Sohbeti kapat' : 'Finans asistanını aç'}
          accessibilityState={{ expanded: open }}
        >
          {open ? (
            <MobileAiAssistantMarkShell size="fab">
              <MaterialCommunityIcons name="close" size={24} color={fg} />
            </MobileAiAssistantMarkShell>
          ) : (
            <MobileAiAssistantMark size="fab" />
          )}
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  panelOuter: {
    position: 'absolute',
  },
  panel: {
    flex: 1,
    flexDirection: 'column',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  markHit: { alignSelf: 'flex-start' },
  headerTitles: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
  headerSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shortcutBase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  shortcutLabel: { fontSize: 13, fontWeight: '500' },
  msgScroll: { flex: 1, minHeight: 0 },
  msgScrollContent: { paddingHorizontal: 12, paddingVertical: 16, flexGrow: 1, gap: 12 },
  msgRow: { width: '100%', flexDirection: 'row' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '88%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleBotLoading: { borderBottomLeftRadius: 8 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  chipText: { fontSize: 12, lineHeight: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  sendWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
});
