import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import type { AuthStackParamList, AppStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthScreens() {
  const theme = useTheme();
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppScreens() {
  const theme = useTheme();
  const { user, voluntaryProfileUpdate } = useAuth();
  /** Gönüllü güncelleme turunda ana sekmelerde kal; tam zorunlu ilk onboarding’de Onboarding ile başla. */
  const initialRouteName =
    user?.onboardingCompleted || voluntaryProfileUpdate ? 'MainTabs' : 'Onboarding';

  return (
    <AppStack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <AppStack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={({ route }) => {
          const revisit = route.params?.mode === 'revisit';
          return {
            headerShown: false,
            title: 'Seni tanıyalım',
            gestureEnabled: revisit,
            /** Gönüllü güncelleme: şeffaf tam ekran; içerik ortada kutu olarak çizilir */
            presentation: revisit ? 'transparentModal' : 'card',
            animation: revisit ? 'fade' : 'default',
            contentStyle: revisit ? { backgroundColor: 'transparent' } : { backgroundColor: theme.colors.background },
          };
        }}
      />
      <AppStack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{
          headerShown: false,
          /** Ayarlar’a geçince iOS geri yazısı route adı `MainTabs` olmasın */
          title: '',
          headerBackTitle: '',
        }}
      />
      <AppStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
    </AppStack.Navigator>
  );
}

export function RootNavigator() {
  const { token, user, isLoading } = useAuth();
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!token) {
    return <AuthScreens key="auth" />;
  }

  if (!user) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <AppScreens key="app" />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
