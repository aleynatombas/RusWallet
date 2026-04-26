import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { MobileAuthLayout } from '../components/auth/MobileAuthLayout';
import { MobileForgotPasswordForm } from '../components/auth/MobileForgotPasswordForm';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  return (
    <MobileAuthLayout navigation={navigation} activeTab="login" forgotMode>
      <MobileForgotPasswordForm navigation={navigation} />
    </MobileAuthLayout>
  );
}
