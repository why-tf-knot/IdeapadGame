import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

interface ProfileScreenProps {
  onLogout: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));
    } catch (e) {
      console.error('Failed to load user:', e);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Investor'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>🏦 INVESTOR</Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user?.name}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>Investor</Text>
        </View>
      </View>

      {/* About */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>About BuildPaper</Text>
        <Text style={styles.aboutText}>
          BuildPaper connects investors with founders. Invest AI tokens in
          promising ideas to earn equity as founders build their products.
        </Text>
        <Text style={styles.version}>v2.0.0</Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingBottom: 60 },
  avatarWrap: { alignItems: 'center', marginBottom: SPACING.lg, marginTop: SPACING.md },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F59E0B',
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.md,
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: COLORS.white },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  email: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  roleBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: RADIUS.pill, marginTop: 10,
  },
  roleText: { color: '#F59E0B', fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg, padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  label: { fontSize: 14, color: COLORS.textMuted },
  value: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.divider },
  aboutText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  version: { fontSize: 12, color: COLORS.textMuted, marginTop: 10 },
  logoutBtn: {
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.md, paddingVertical: 16,
    alignItems: 'center', marginTop: SPACING.sm,
    ...SHADOWS.sm,
  },
  logoutText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
});

export default ProfileScreen;
