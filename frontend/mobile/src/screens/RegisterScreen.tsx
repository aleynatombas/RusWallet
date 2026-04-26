import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { MobileAuthLayout } from '../components/auth/MobileAuthLayout';
import { MobileRegisterForm } from '../components/auth/MobileRegisterForm';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  return (
    <MobileAuthLayout navigation={navigation} activeTab="register">
      <MobileRegisterForm navigation={navigation} />
    </MobileAuthLayout>
  );
}
