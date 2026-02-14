import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { reviewAPI, creditsAPI, equityAPI } from '../services/api';
import { Idea } from '../types';

interface SavedIdeasScreenProps {
  navigation: any;
}

interface IdeaWithCredits extends Idea {
  myCredits?: number;
  totalCredits?: number;
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
      
      // Enrich each idea with credit and equity information
      const enrichedIdeas = await Promise.all(
        response.ideas.map(async (idea) => {
          try {
            const creditInfo = await creditsAPI.getIdeaCredits(idea._id);
            const equityInfo = await equityAPI.getIdeaEquity(idea._id);
            
            // Find my allocation
            const myAllocation = creditInfo.allocations?.find(
              (alloc: any) => alloc.investor?.id
            );
            
            // Find my equity
            const myEquity = equityInfo.investorEquity?.find(
              (inv: any) => inv.investorId
            );

            return {
              ...idea,
              myCredits: myAllocation?.amount || 0,
              totalCredits: creditInfo.balance || 0,
              equityPercent: myEquity?.estimatedEquityPercent || 0,
            };
          } catch (error) {
            console.error('Error enriching idea:', error);
            return idea;
          }
        })
      );

      setIdeas(enrichedIdeas);
    } catch (error) {
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
    <TouchableOpacity style={styles.ideaCard} onPress={() => handleIdeaPress(item)}>
      <View style={styles.ideaHeader}>
        <Text style={styles.ideaTitle}>{item.title}</Text>
        <View style={styles.stageBadge}>
          <Text style={styles.stageText}>{item.stage}</Text>
        </View>
      </View>

      <Text style={styles.ideaSummary} numberOfLines={2}>
        {item.oneLineSummary}
      </Text>

      <View style={styles.categoryRow}>
        <Text style={styles.categoryText}>{item.category}</Text>
        <Text style={styles.targetUser}>Target: {item.targetUser}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>My Investment</Text>
          <Text style={styles.statValue}>💰 {item.myCredits || 0} credits</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Funded</Text>
          <Text style={styles.statValue}>🏦 {item.totalCredits || 0} credits</Text>
        </View>
      </View>

      {item.equityPercent !== undefined && item.equityPercent > 0 && (
        <View style={styles.equityRow}>
          <Text style={styles.equityLabel}>Est. Equity:</Text>
          <Text style={styles.equityValue}>{item.equityPercent.toFixed(4)}%</Text>
        </View>
      )}

      <TouchableOpacity style={styles.detailsButton} onPress={() => handleIdeaPress(item)}>
        <Text style={styles.detailsButtonText}>View Equity Breakdown →</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading saved ideas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Ideas</Text>
        <Text style={styles.headerSubtitle}>{ideas.length} investments</Text>
      </View>

      {ideas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📥</Text>
          <Text style={styles.emptyText}>No saved ideas yet</Text>
          <Text style={styles.emptySubtext}>
            Review ideas and save the ones you like!
          </Text>
        </View>
      ) : (
        <FlatList
          data={ideas}
          renderItem={renderIdea}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 15,
  },
  ideaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  ideaTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
    color: '#333',
  },
  stageBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stageText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  ideaSummary: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  targetUser: {
    fontSize: 12,
    color: '#666',
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
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  equityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  equityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  equityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  detailsButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailsButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default SavedIdeasScreen;
