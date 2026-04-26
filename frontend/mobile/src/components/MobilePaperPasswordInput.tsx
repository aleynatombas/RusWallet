import { useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native-paper';

type Props = Omit<TextInputProps, 'secureTextEntry' | 'right'>;

/**
 * Şifre alanı; sağda göz ikonu (react-native pattern, web PasswordInput ile aynı davranış).
 */
export function MobilePaperPasswordInput({ ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <TextInput
      {...props}
      secureTextEntry={!visible}
      right={
        <TextInput.Icon
          icon={visible ? 'eye-off' : 'eye'}
          onPress={() => setVisible((v) => !v)}
          accessibilityLabel={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}
          forceTextInputFocus={false}
        />
      }
    />
  );
}
