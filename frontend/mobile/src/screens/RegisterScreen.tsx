import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { MobileAuthComponent } from '../components/MobileAuthComponent';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  return (
    <MobileAuthComponent
      mode="register"
      onNavigateToLogin={() => navigation.navigate('Login')}
    />
  );
}
