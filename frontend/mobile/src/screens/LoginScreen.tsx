import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { MobileAuthComponent } from '../components/MobileAuthComponent';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  return (
    <MobileAuthComponent mode="login" onNavigateToRegister={() => navigation.navigate('Register')} />
  );
}
