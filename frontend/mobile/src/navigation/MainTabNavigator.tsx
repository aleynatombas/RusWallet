import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';
import { MainTabCustomBar } from '../components/MainTabCustomBar';
import { MobileFloatingChatbot } from '../components/MobileFloatingChatbot';
import { HomeScreen } from '../screens/HomeScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { AnalysisScreen } from '../screens/AnalysisScreen';
import { ProfilePlaceholderScreen } from '../screens/ProfilePlaceholderScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
    <Tab.Navigator
      tabBar={(props) => <MainTabCustomBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.dark ? '#818cf8' : theme.colors.primary,
        tabBarInactiveTintColor: theme.dark ? '#94a3b8' : theme.colors.onSurfaceVariant,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Anasayfa',
          tabBarLabel: 'Anasayfa',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          title: 'İşlemlerim',
          tabBarLabel: 'İşlemlerim',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="swap-vertical" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{
          title: 'Analizlerim',
          tabBarLabel: 'Analizlerim',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="chart-line" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfilePlaceholderScreen}
        options={{
          title: 'Hesabım',
          tabBarLabel: 'Hesabım',
        }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
          },
        })}
      />
    </Tab.Navigator>
    <MobileFloatingChatbot fabPlacement="tab-bar-center" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
});
