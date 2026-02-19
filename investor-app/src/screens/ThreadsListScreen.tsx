import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONTS } from '../theme';
import { messagingAPI } from '../services/api';
import { ChatThread } from '../types';

interface Props {
  navigation: any;
}

export default function ThreadsListScreen({ navigation }: Props) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchThreads();
    const unsubscribe = navigation.addListener('focus', fetchThreads);
    return unsubscribe;
  }, [navigation]);

  const fetchThreads = useCallback(async () => {
    try {
      const { threads: data } = await messagingAPI.getMyThreads();
      setThreads(data);
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const getFounderName = (thread: ChatThread) => {
    if (typeof thread.founderId === 'object' && thread.founderId?.name) {
      return thread.founderId.name;
    }
    return 'Founder';
  };

  const renderThread = ({ item }: { item: ChatThread }) => (
    <TouchableOpacity
      style={styles.threadCard}
      onPress={() =>
        navigation.navigate('Chat', {
          threadId: item._id,
          founderName: getFounderName(item),
        })
      }
    >
      <View style={styles.threadHeader}>
        <Text style={styles.threadName}>{getFounderName(item)}</Text>
        {item.investorUnread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.investorUnread}</Text>
          </View>
        )}
      </View>
      <Text style={styles.threadMeta}>
        {item.messageCount ?? 0} messages · Last active{' '}
        {new Date(item.lastActivity).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <Text style={styles.subtitle}>🔒 End-to-end encrypted</Text>
      <FlatList
        data={threads}
        keyExtractor={(item) => item._id}
        renderItem={renderThread}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchThreads(); }} tintColor={COLORS.accent} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Message founders about ideas you've invested in
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  title: { fontSize: FONTS.xxl, fontWeight: '800', color: COLORS.text, padding: SPACING.md, paddingBottom: 0 },
  subtitle: { fontSize: FONTS.sm, color: COLORS.textMuted, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  list: { padding: SPACING.md },
  threadCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  threadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  threadName: { color: COLORS.text, fontSize: FONTS.lg, fontWeight: '700' },
  badge: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  threadMeta: { color: COLORS.textMuted, fontSize: FONTS.sm, marginTop: 4 },
  emptyText: { color: COLORS.textSecondary, fontSize: FONTS.lg, fontWeight: '600' },
  emptySubtext: { color: COLORS.textMuted, fontSize: FONTS.sm, marginTop: SPACING.sm, textAlign: 'center' },
});
