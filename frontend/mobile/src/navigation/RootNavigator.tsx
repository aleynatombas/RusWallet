import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import type { AuthStackParamList } from './types';
import type { AppStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthScreens() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: true }}>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: 'Giriş' }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Kayıt' }} />
    </AuthStack.Navigator>
  );
}

function AppScreens() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: true }}>
      <AppStack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'RusWallet' }} />
    </AppStack.Navigator>
  );
}

export function RootNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) return null;

  // Token değişince yeni navigator temiz mount olsun (beyaz ekran önlemi)
  return !token ? <AuthScreens key="auth" /> : <AppScreens key="app" />;
}
