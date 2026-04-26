import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, type TextInputProps, type ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { useTheme } from 'react-native-paper';
import { mobileAuthVisual, FIELD_HEIGHT, FIELD_RADIUS } from './mobileAuthVisualTokens';

export function MobileAuthFieldLabel({ children, isDark }: { children: string; isDark: boolean }) {
  const v = isDark ? mobileAuthVisual.dark : mobileAuthVisual.light;
  return (
    <Text style={[styles.label, { color: v.muted }]} accessibilityRole="text">
      {children.toUpperCase()}
    </Text>
  );
}

export function MobileAuthTextInput({
  isDark,
  style,
  ...props
}: TextInputProps & { isDark: boolean }) {
  const v = isDark ? mobileAuthVisual.dark : mobileAuthVisual.light;
  return (
    <TextInput
      placeholderTextColor={v.muted}
      style={[
        styles.input,
        {
          height: FIELD_HEIGHT,
          borderColor: v.border,
          backgroundColor: v.inputBg,
          color: v.text,
          borderRadius: FIELD_RADIUS,
        },
        style,
      ]}
      {...props}
    />
  );
}

export function MobileAuthPasswordInput({
  isDark,
  value,
  onChangeText,
  placeholder = '••••••••',
  autoComplete,
}: {
  isDark: boolean;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  autoComplete?: 'new-password' | 'password';
}) {
  const [visible, setVisible] = useState(false);
  const v = isDark ? mobileAuthVisual.dark : mobileAuthVisual.light;
  return (
    <View
      style={[
        styles.inputRow,
        {
          height: FIELD_HEIGHT,
          borderColor: v.border,
          backgroundColor: v.inputBg,
          borderRadius: FIELD_RADIUS,
        },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        placeholder={placeholder}
        placeholderTextColor={v.muted}
        style={[styles.inputFlex, { color: v.text }]}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={autoComplete}
        textContentType={autoComplete === 'new-password' ? 'newPassword' : 'password'}
      />
      <Pressable
        onPress={() => setVisible((x) => !x)}
        style={styles.eyeHit}
        accessibilityLabel={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}
      >
        <MaterialCommunityIcons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color={v.muted}
        />
      </Pressable>
    </View>
  );
}

export function MobileAuthPrimaryButton({
  isDark,
  label,
  loading,
  onPress,
  disabled,
}: {
  isDark: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const v = isDark ? mobileAuthVisual.dark : mobileAuthVisual.light;
  const colors = (isDark ? v.gradientBtnDark : v.gradientBtn) as unknown as readonly [ColorValue, ColorValue, ColorValue];
  const onBtn = theme.colors.onPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [{ opacity: disabled || loading ? 0.55 : pressed ? 0.92 : 1 }]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradBtn}
      >
        {loading ? (
          <ActivityIndicator color={onBtn} />
        ) : (
          <Text style={[styles.gradBtnText, { color: onBtn }]}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 6,
    textAlign: 'left',
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingRight: 4,
  },
  inputFlex: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    height: FIELD_HEIGHT - 2,
  },
  eyeHit: {
    padding: 8,
  },
  gradBtn: {
    height: FIELD_HEIGHT,
    borderRadius: FIELD_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
