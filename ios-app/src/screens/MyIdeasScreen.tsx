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
import { ideasAPI } from '../services/api';
import { Idea } from '../types';

interface MyIdeasScreenProps {
  navigation: any;
}

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

  const renderIdea = ({ item }: { item: Idea }) => (
    <TouchableOpacity
      style={styles.ideaCard}
      onPress={() => navigation.navigate('IdeaDetail', { ideaId: item._id })}>
      <View style={styles.ideaHeader}>
        <Text style={styles.ideaTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, getStatusColor(item.status)]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      <Text style={styles.ideaSummary} numberOfLines={2}>
        {item.oneLineSummary}
      </Text>
      <View style={styles.ideaFooter}>
        <Text style={styles.ideaCategory}>{item.category}</Text>
        <Text style={styles.ideaStage}>{item.stage}</Text>
        <Text style={styles.ideaCredits}>💰 {item.aiCredits || 0} tokens</Text>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { backgroundColor: '#34C759' };
      case 'PENDING_REVIEW':
        return { backgroundColor: '#FF9500' };
      case 'DRAFT':
        return { backgroundColor: '#007AFF' };
      default:
        return { backgroundColor: '#8E8E93' };
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Ideas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateIdea')}>
          <Text style={styles.addButtonText}>+ New Idea</Text>
        </TouchableOpacity>
      </View>

      {ideas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No ideas yet!</Text>
          <Text style={styles.emptySubtext}>
            Tap "New Idea" to submit your first idea
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  ideaSummary: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  ideaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ideaCategory: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  ideaStage: {
    fontSize: 12,
    color: '#666',
  },
  ideaCredits: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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

export default MyIdeasScreen;
