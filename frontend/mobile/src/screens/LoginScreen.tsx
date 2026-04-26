import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { MobileAuthLayout } from '../components/auth/MobileAuthLayout';
import { MobileLoginForm } from '../components/auth/MobileLoginForm';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  return (
    <MobileAuthLayout navigation={navigation} activeTab="login">
      <MobileLoginForm navigation={navigation} />
    </MobileAuthLayout>
  );
}
