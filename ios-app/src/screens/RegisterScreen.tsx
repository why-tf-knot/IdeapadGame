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

interface RegisterScreenProps {
  navigation: any;
  onLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation, onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'FOUNDER' | 'INVESTOR'>('FOUNDER');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register(name, email, password, role);
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      onLogin();
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.error || 'An error occurred');
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

        {/* Logo */}
        <View style={styles.brandBlock}>
          <View style={styles.logoRow}>
            <Text style={styles.logoIcon}>📄</Text>
            <Text style={styles.logoText}>BuildPaper</Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Create your account</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Jane Doe"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

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
              placeholder="Min. 6 characters"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Role selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>I AM A</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'FOUNDER' && styles.roleButtonActive,
                ]}
                onPress={() => setRole('FOUNDER')}
                activeOpacity={0.8}>
                <Text style={styles.roleEmoji}>💡</Text>
                <Text style={[
                  styles.roleText,
                  role === 'FOUNDER' && styles.roleTextActive,
                ]}>Founder</Text>
                <Text style={[
                  styles.roleDesc,
                  role === 'FOUNDER' && styles.roleDescActive,
                ]}>Pitch ideas & use AI tools</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'INVESTOR' && styles.roleButtonActive,
                ]}
                onPress={() => setRole('INVESTOR')}
                activeOpacity={0.8}>
                <Text style={styles.roleEmoji}>🏦</Text>
                <Text style={[
                  styles.roleText,
                  role === 'INVESTOR' && styles.roleTextActive,
                ]}>Investor</Text>
                <Text style={[
                  styles.roleDesc,
                  role === 'INVESTOR' && styles.roleDescActive,
                ]}>Review & fund ideas</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}>
            <Text style={styles.buttonText}>
              {loading ? 'Creating account…' : 'Get Started'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login link */}
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>
            Already have an account?{' '}
            <Text style={styles.linkAccent}>Sign in</Text>
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
  brandBlock: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.3,
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
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: COLORS.formBg,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: COLORS.accentLight,
    borderColor: COLORS.accent,
  },
  roleEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  roleTextActive: {
    color: COLORS.accent,
  },
  roleDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  roleDescActive: {
    color: COLORS.accent,
    opacity: 0.8,
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

export default RegisterScreen;
