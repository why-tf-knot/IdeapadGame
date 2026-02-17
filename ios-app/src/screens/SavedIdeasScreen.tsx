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
import { reviewAPI, batchAPI } from '../services/api';
import { Idea, TOKEN_META, TokenType } from '../types';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

interface SavedIdeasScreenProps {
  navigation: any;
}

interface IdeaWithCredits extends Idea {
  myCredits?: number;
  totalCredits?: number;
  tokenBalances?: { gemini: number; anthropic: number; perplexity: number; chatgpt: number };
  equityPercent?: number;
}

const SavedIdeasScreen: React.FC<SavedIdeasScreenProps> = ({ navigation }) => {
  const [ideas, setIdeas] = useState<IdeaWithCredits[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSavedIdeas();
  }, []);

  const loadSavedIdeas = async () => {
    try {
      const response = await reviewAPI.getSavedIdeas();
      
      if (response.ideas.length > 0) {
        const ideaIds = response.ideas.map(idea => idea._id);
        const enrichedResponse = await batchAPI.enrichIdeas(ideaIds);
        setIdeas(enrichedResponse.ideas);
      } else {
        setIdeas([]);
      }
    } catch (error) {
      console.error('Error loading saved ideas:', error);
      Alert.alert('Error', 'Failed to load saved ideas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSavedIdeas();
  };

  const handleIdeaPress = (idea: IdeaWithCredits) => {
    navigation.navigate('IdeaEquity', { ideaId: idea._id, ideaTitle: idea.title });
  };

  const renderIdea = ({ item }: { item: IdeaWithCredits }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleIdeaPress(item)} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.stageBadge}>
          <Text style={styles.stageText}>{item.stage}</Text>
        </View>
      </View>

      <Text style={styles.summary} numberOfLines={2}>
        {item.oneLineSummary}
      </Text>

      <View style={styles.metaRow}>
        <View style={[styles.tagPill, { backgroundColor: COLORS.accentLight }]}>
          <Text style={[styles.tagPillText, { color: COLORS.accent }]}>{item.category}</Text>
        </View>
        <Text style={styles.targetUser}>Target: {item.targetUser}</Text>
      </View>

      {/* Investment stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>My Investment</Text>
          <Text style={styles.statValue}>💰 {item.myCredits || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Funded</Text>
          <Text style={styles.statValue}>🏦 {item.totalCredits || 0}</Text>
        </View>
      </View>

      {/* Token balance chips */}
      {item.tokenBalances && (
        <View style={styles.tokenRow}>
          {(['GEMINI', 'ANTHROPIC', 'PERPLEXITY', 'CHATGPT'] as TokenType[]).map((tt) => {
            const bal = item.tokenBalances?.[tt.toLowerCase() as keyof typeof item.tokenBalances] || 0;
            if (bal === 0) return null;
            const meta = TOKEN_META[tt];
            return (
              <View key={tt} style={[styles.tokenChip, { backgroundColor: meta.color + '15' }]}>
                <Text style={{ fontSize: 11 }}>{meta.icon}</Text>
                <Text style={[styles.tokenChipText, { color: meta.color }]}>{bal}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Equity estimate */}
      {item.equityPercent !== undefined && item.equityPercent > 0 && (
        <View style={styles.equityRow}>
          <Text style={styles.equityLabel}>Est. Equity</Text>
          <Text style={styles.equityValue}>{item.equityPercent.toFixed(4)}%</Text>
        </View>
      )}

      <View style={styles.ctaRow}>
        <Text style={styles.ctaText}>View Equity Breakdown →</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading portfolio…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Ideas</Text>
        <Text style={styles.headerSub}>{ideas.length} investment{ideas.length !== 1 ? 's' : ''}</Text>
      </View>

      {ideas.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📥</Text>
          <Text style={styles.emptyTitle}>No saved ideas yet</Text>
          <Text style={styles.emptySub}>
            Review ideas and save the ones you like!
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
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textMuted,
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
    flex: 1,
    marginRight: 10,
    color: COLORS.text,
  },
  stageBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  stageText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  summary: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  targetUser: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  tokenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tokenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginRight: 6,
    marginBottom: 4,
  },
  tokenChipText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 3,
  },
  equityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 12,
  },
  equityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.successDark,
  },
  equityValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.successDark,
  },
  ctaRow: {
    alignItems: 'center',
    paddingTop: 6,
  },
  ctaText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
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

export default SavedIdeasScreen;
