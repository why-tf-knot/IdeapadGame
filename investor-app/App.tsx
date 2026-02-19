import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from './src/theme';
import ErrorBoundary from './src/components/ErrorBoundary';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import PaperTossScreen from './src/screens/PaperTossScreen';
import SavedIdeasScreen from './src/screens/SavedIdeasScreen';
import WalletScreen from './src/screens/WalletScreen';
import IdeaEquityScreen from './src/screens/IdeaEquityScreen';
import ThreadsListScreen from './src/screens/ThreadsListScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Investor Tabs ─────────────────────────────────────

function InvestorTabs({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.cardBg,
          borderTopColor: COLORS.border,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Review"
        options={{
          tabBarLabel: 'Review',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📄</Text>,
        }}
      >
        {() => (
          <ErrorBoundary screenName="PaperToss">
            <PaperTossScreen />
          </ErrorBoundary>
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Saved"
        options={{
          tabBarLabel: 'Saved',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⭐</Text>,
        }}
      >
        {(props: any) => (
          <ErrorBoundary screenName="SavedIdeas">
            <SavedIdeasScreen {...props} />
          </ErrorBoundary>
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Messages"
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💬</Text>,
        }}
      >
        {(props: any) => (
          <ErrorBoundary screenName="ThreadsList">
            <ThreadsListScreen {...props} />
          </ErrorBoundary>
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Wallet"
        options={{
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💰</Text>,
        }}
      >
        {(props: any) => (
          <ErrorBoundary screenName="Wallet">
            <WalletScreen {...props} />
          </ErrorBoundary>
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
        }}
      >
        {() => (
          <ErrorBoundary screenName="Profile">
            <ProfileScreen onLogout={onLogout} />
          </ErrorBoundary>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ─── Main Stack ────────────────────────────────────────

function MainStack({ onLogout }: { onLogout: () => void }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.cardBg },
        headerTintColor: COLORS.text,
      }}
    >
      <Stack.Screen
        name="InvestorHome"
        options={{ headerShown: false }}
      >
        {() => <InvestorTabs onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen
        name="IdeaEquity"
        component={IdeaEquityScreen}
        options={{ title: 'Equity Breakdown' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
}

// ─── Auth Stack ────────────────────────────────────────

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

// ─── Root App ──────────────────────────────────────────

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
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

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['authToken', 'user']);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return null;
  }

  return (
    <ErrorBoundary screenName="App">
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <NavigationContainer>
          {isAuthenticated ? (
            <MainStack onLogout={handleLogout} />
          ) : (
            <AuthStack onLogin={handleLogin} />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
