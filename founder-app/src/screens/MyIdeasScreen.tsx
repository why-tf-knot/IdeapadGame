import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ideasAPI } from '../services/api';
import { Idea } from '../types';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

interface MyIdeasScreenProps {
  navigation: any;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  ACTIVE:         { bg: COLORS.success,   text: '#fff' },
  PENDING_REVIEW: { bg: COLORS.warning,   text: '#fff' },
  DRAFT:          { bg: COLORS.formBg,    text: COLORS.textSecondary },
  DEFAULT:        { bg: COLORS.border,    text: COLORS.textMuted },
};

const MyIdeasScreen: React.FC<MyIdeasScreenProps> = ({ navigation }) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    try {
      const response = await ideasAPI.getMyIdeas();
      setIdeas(response.ideas);
    } catch (error) {
      Alert.alert('Error', 'Failed to load ideas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadIdeas();
  };

  const statusStyle = (status: string) =>
    STATUS_STYLES[status] || STATUS_STYLES.DEFAULT;

  const renderIdea = ({ item }: { item: Idea }) => {
    const ss = statusStyle(item.status);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('IdeaDetail', { ideaId: item._id })}
        activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: ss.bg }]}>
            <Text style={[styles.badgeText, { color: ss.text }]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <Text style={styles.cardSummary} numberOfLines={2}>
          {item.oneLineSummary}
        </Text>

        <View style={styles.cardFooter}>
          <View style={[styles.tagPill, { backgroundColor: COLORS.accentLight }]}>
            <Text style={[styles.tagPillText, { color: COLORS.accent }]}>{item.category}</Text>
          </View>
          <Text style={styles.stageLabel}>{item.stage}</Text>
          <Text style={styles.tokenLabel}>💰 {item.aiCredits || 0} tokens</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Ideas</Text>
          <Text style={styles.headerSub}>{ideas.length} pitch{ideas.length !== 1 ? 'es' : ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => navigation.navigate('CreateIdea')}
          activeOpacity={0.85}>
          <Text style={styles.newButtonText}>+ New Idea</Text>
        </TouchableOpacity>
      </View>

      {ideas.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💡</Text>
          <Text style={styles.emptyTitle}>No ideas yet</Text>
          <Text style={styles.emptySub}>
            Tap "+ New Idea" to submit your first pitch
          </Text>
        </View>
      ) : (
        <FlatList
          data={ideas}
          renderItem={renderIdea}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.bg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  newButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  newButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md + 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardSummary: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    marginRight: 10,
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stageLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default MyIdeasScreen;
