import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

interface LoginScreenProps {
  navigation: any;
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      onLogin();
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">

        {/* Decorative skyline */}
        <View style={styles.skyline}>
          <Text style={styles.skylineEmoji}>🏙️</Text>
        </View>

        {/* Logo + Branding */}
        <View style={styles.brandBlock}>
          <View style={styles.logoRow}>
            <Text style={styles.logoIcon}>📄</Text>
            <Text style={styles.logoText}>BuildPaper</Text>
          </View>
          <Text style={styles.tagline}>Where ideas meet investors</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Welcome back</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            <Text style={styles.buttonText}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>
            Don't have an account?{' '}
            <Text style={styles.linkAccent}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  skyline: {
    alignItems: 'center',
    marginBottom: -8,
    opacity: 0.18,
  },
  skylineEmoji: {
    fontSize: 64,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  logoIcon: {
    fontSize: 28,
    marginRight: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.4,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.formBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.md,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  linkButton: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  linkAccent: {
    color: COLORS.accent,
    fontWeight: '700',
  },
});

export default LoginScreen;
