import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

/** Profil sekmesi yalnızca menü tetikleyicisi; bu ekrana geçiş yapılmaz. */
export function ProfilePlaceholderScreen() {
  const theme = useTheme();
  return <View style={[styles.fill, { backgroundColor: theme.colors.background }]} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
