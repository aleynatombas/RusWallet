import { Modal, Pressable, StyleSheet, View, type LayoutRectangle } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type Props = {
  visible: boolean;
  anchorLayout: LayoutRectangle | null;
  onDismiss: () => void;
  onStart: () => void;
};

export function OnboardingIntroCoachmark({ visible, anchorLayout, onDismiss, onStart }: Props) {
  const theme = useTheme();

  const bubbleTop =
    anchorLayout != null ? anchorLayout.y + anchorLayout.height + 10 : 72;
  const bubbleRight = 16;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        {anchorLayout ? (
          <View
            pointerEvents="none"
            style={[
              styles.highlight,
              {
                top: anchorLayout.y - 4,
                left: anchorLayout.x - 4,
                width: anchorLayout.width + 8,
                height: anchorLayout.height + 8,
                borderColor: theme.colors.primary,
              },
            ]}
          />
        ) : null}
        <Pressable
          style={[styles.bubble, { top: bubbleTop, right: bubbleRight, backgroundColor: theme.colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.titleRow}>
            <MaterialCommunityIcons name="star-four-points" size={20} color={theme.colors.primary} />
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
              Seni tanıyalım
            </Text>
          </View>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, lineHeight: 22 }}>
            Daha iyi analizler ve kişisel öneriler için birkaç kısa soruya yanıt ver — yaklaşık 2 dakika sürer.
          </Text>
          <View style={styles.actions}>
            <Button mode="contained" onPress={onStart} compact>
              Başla
            </Button>
            <Button mode="text" onPress={onDismiss} compact>
              Şimdi değil
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  highlight: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 2,
  },
  bubble: {
    position: 'absolute',
    maxWidth: 320,
    width: '88%',
    alignSelf: 'flex-end',
    marginRight: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 16, justifyContent: 'flex-end' },
});
