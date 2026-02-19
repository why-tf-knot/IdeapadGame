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
import MyIdeasScreen from './src/screens/MyIdeasScreen';
import CreateIdeaScreen from './src/screens/CreateIdeaScreen';
import IdeaDetailScreen from './src/screens/IdeaDetailScreen';
import IdeaWizardScreen from './src/screens/IdeaWizardScreen';
import PitchGeneratingScreen from './src/screens/PitchGeneratingScreen';
import PitchSummaryScreen from './src/screens/PitchSummaryScreen';
import ThreadsListScreen from './src/screens/ThreadsListScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Founder Tabs ──────────────────────────────────────

function FounderTabs({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.cardBg,
          borderTopColor: COLORS.border,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="MyIdeas"
        options={{
          tabBarLabel: 'My Ideas',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💡</Text>,
        }}
      >
        {(props: any) => (
          <ErrorBoundary screenName="MyIdeas">
            <MyIdeasScreen {...props} />
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
        name="FounderHome"
        options={{ headerShown: false }}
      >
        {() => <FounderTabs onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen
        name="CreateIdea"
        component={IdeaWizardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PitchGenerating"
        component={PitchGeneratingScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="PitchSummary"
        component={PitchSummaryScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="IdeaDetail"
        component={IdeaDetailScreen}
        options={{ title: 'Idea Details' }}
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
