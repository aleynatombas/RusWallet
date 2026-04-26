import { ScrollView, Text, StyleSheet } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { CARD_SHADOW_BLEED, getCardShadow } from '../theme/cardShadow';

/** Web BudgetPage ile aynı içerik (placeholder). */
export function MobileBudgetComponent() {
  const theme = useTheme();
  const cardShadow = getCardShadow(theme.dark);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    >
      <Text style={[styles.h1, { color: theme.colors.onSurface }]}>Bütçem</Text>
      <Text style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>Limitler, uyarılar ve öneriler (yakında).</Text>

      <Card style={[styles.card, cardShadow, { backgroundColor: theme.colors.surface }]} mode="elevated">
        <Card.Title title="Bütçe planı" subtitle="Kategori bazlı limitler ve bütçe aşımı bildirimleri bu alanda görüntülenecek." />
        <Card.Content>
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 14 }}>
            Henüz yapılandırılmış bütçe yok. API hazır olduğunda burada listelenecek.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingTop: 16, paddingHorizontal: 16 + CARD_SHADOW_BLEED, paddingBottom: 40 },
  h1: { fontSize: 22, fontWeight: '600', marginBottom: 4 },
  sub: { fontSize: 14, marginBottom: 16 },
  card: { marginBottom: 16 },
});
