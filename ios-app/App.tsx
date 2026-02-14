import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MyIdeasScreen from './src/screens/MyIdeasScreen';
import CreateIdeaScreen from './src/screens/CreateIdeaScreen';
import IdeaDetailScreen from './src/screens/IdeaDetailScreen';
import PaperTossScreen from './src/screens/PaperTossScreen';
import SavedIdeasScreen from './src/screens/SavedIdeasScreen';
import WalletScreen from './src/screens/WalletScreen';
import IdeaEquityScreen from './src/screens/IdeaEquityScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Founder Tabs
function FounderTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerShown: false,
      }}>
      <Tab.Screen 
        name="MyIdeas" 
        component={MyIdeasScreen}
        options={{ 
          tabBarLabel: 'My Ideas',
          title: 'My Ideas'
        }}
      />
    </Tab.Navigator>
  );
}

// Investor Tabs
function InvestorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerShown: false,
      }}>
      <Tab.Screen 
        name="Review" 
        component={PaperTossScreen}
        options={{ 
          tabBarLabel: 'Review',
          title: 'Review Ideas'
        }}
      />
      <Tab.Screen 
        name="Saved" 
        component={SavedIdeasScreen}
        options={{ 
          tabBarLabel: 'Saved',
          title: 'Saved Ideas'
        }}
      />
      <Tab.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{ 
          tabBarLabel: 'Wallet',
          title: 'My Wallet'
        }}
      />
    </Tab.Navigator>
  );
}

// Main Stack
function MainStack({ userRole }: { userRole: string | null }) {
  return (
    <Stack.Navigator>
      {userRole === 'FOUNDER' ? (
        <>
          <Stack.Screen 
            name="FounderHome" 
            component={FounderTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="CreateIdea" 
            component={CreateIdeaScreen}
            options={{ title: 'New Idea' }}
          />
          <Stack.Screen 
            name="IdeaDetail" 
            component={IdeaDetailScreen}
            options={{ title: 'Idea Details' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen 
            name="InvestorHome" 
            component={InvestorTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="IdeaEquity" 
            component={IdeaEquityScreen}
            options={{ title: 'Equity Breakdown' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// Auth Stack
function AuthStack({ onLogin }: { onLogin: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {(props) => <RegisterScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    checkAuth();
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        {isAuthenticated ? (
          <MainStack userRole={userRole} />
        ) : (
          <AuthStack onLogin={handleLogin} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
