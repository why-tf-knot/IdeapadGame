import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { ideasAPI, creditsAPI } from '../services/api';
import { Idea } from '../types';

interface IdeaDetailScreenProps {
  route: any;
  navigation: any;
}

interface AITool {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  service: string;
}

const AI_TOOLS: AITool[] = [
  {
    id: '1',
    name: 'Improve Summary',
    description: 'Enhance your one-line pitch with AI',
    cost: 10,
    icon: '✨',
    service: 'LLM_SUMMARY_IMPROVE',
  },
  {
    id: '2',
    name: 'Generate Pitch Deck',
    description: 'Create a 6-slide pitch structure',
    cost: 20,
    icon: '📊',
    service: 'LLM_PITCH_DRAFT',
  },
  {
    id: '3',
    name: 'Build Roadmap',
    description: 'Generate a 3-6 month development plan',
    cost: 20,
    icon: '🗺️',
    service: 'LLM_ROADMAP_GENERATE',
  },
];

const IdeaDetailScreen: React.FC<IdeaDetailScreenProps> = ({ route, navigation }) => {
  const { ideaId } = route.params;
  const [idea, setIdea] = useState<Idea | null>(null);
  const [aiCredits, setAiCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingTool, setProcessingTool] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);

  useEffect(() => {
    loadIdeaDetails();
  }, [ideaId]);

  const loadIdeaDetails = async () => {
    try {
      const ideaResponse = await ideasAPI.getById(ideaId);
      setIdea(ideaResponse.idea);
      setAiCredits(ideaResponse.idea.aiCredits || 0);
      
      navigation.setOptions({ title: ideaResponse.idea.title });
    } catch (error) {
      Alert.alert('Error', 'Failed to load idea details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUseTool = async (tool: AITool) => {
    if (!idea) return;

    if (aiCredits < tool.cost) {
      Alert.alert(
        'Insufficient Credits',
        `You need ${tool.cost} AI credits to use this tool, but only have ${aiCredits} available.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Confirm',
      `Use ${tool.cost} AI credits for "${tool.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Credits',
          onPress: () => executeTool(tool),
        },
      ]
    );
  };

  const executeTool = async (tool: AITool) => {
    if (!idea) return;

    setProcessingTool(tool.id);
    setSelectedTool(tool);

    try {
      const response = await creditsAPI.spend(idea._id, tool.cost, tool.service);
      
      setAiCredits(response.newBalance);
      setAiResult(response.result);
      setShowResultModal(true);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to process AI request');
    } finally {
      setProcessingTool(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading idea...</Text>
      </View>
    );
  }

  if (!idea) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Idea not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* AI Credits Card */}
        <View style={styles.creditsCard}>
          <View style={styles.creditsHeader}>
            <Text style={styles.creditsLabel}>AI Credits Available</Text>
            <Text style={styles.creditsAmount}>{aiCredits}</Text>
          </View>
          <Text style={styles.creditsSubtext}>
            Use these credits to improve your pitch with AI tools
          </Text>
        </View>

        {/* Idea Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Your Idea</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{idea.category}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Stage</Text>
            <View style={styles.stageBadge}>
              <Text style={styles.stageBadgeText}>{idea.stage}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Target User</Text>
            <Text style={styles.detailValue}>{idea.targetUser}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>{idea.status.replace('_', ' ')}</Text>
          </View>
        </View>

        {/* One-line Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>One-Line Summary</Text>
          <Text style={styles.summaryText}>{idea.oneLineSummary}</Text>
        </View>

        {/* AI Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI-Powered Tools</Text>
          <Text style={styles.sectionSubtitle}>
            Enhance your pitch using AI (costs AI credits)
          </Text>

          {AI_TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={[
                styles.toolCard,
                processingTool === tool.id && styles.toolCardProcessing,
              ]}
              onPress={() => handleUseTool(tool)}
              disabled={processingTool !== null}>
              <View style={styles.toolIcon}>
                <Text style={styles.toolIconText}>{tool.icon}</Text>
              </View>

              <View style={styles.toolInfo}>
                <Text style={styles.toolName}>{tool.name}</Text>
                <Text style={styles.toolDescription}>{tool.description}</Text>
              </View>

              <View style={styles.toolAction}>
                {processingTool === tool.id ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <>
                    <Text style={styles.toolCost}>{tool.cost}</Text>
                    <Text style={styles.toolCostLabel}>credits</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Problem & Solution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Problem</Text>
          <Text style={styles.bodyText}>{idea.problem}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solution</Text>
          <Text style={styles.bodyText}>{idea.solution}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Differentiation</Text>
          <Text style={styles.bodyText}>{idea.differentiation}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monetization</Text>
          <Text style={styles.bodyText}>{idea.monetization}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Roadmap</Text>
          <Text style={styles.bodyText}>{idea.roadmap}</Text>
        </View>
      </ScrollView>

      {/* AI Result Modal */}
      <Modal
        visible={showResultModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResultModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedTool?.icon} {selectedTool?.name}
            </Text>
            <TouchableOpacity onPress={() => setShowResultModal(false)}>
              <Text style={styles.closeButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.creditsUsedBanner}>
              <Text style={styles.creditsUsedText}>
                ✓ Used {selectedTool?.cost} credits
              </Text>
              <Text style={styles.creditsRemainingText}>
                {aiCredits} remaining
              </Text>
            </View>

            <Text style={styles.resultText}>{aiResult}</Text>
          </ScrollView>
        </View>
      </Modal>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  scrollView: {
    flex: 1,
  },
  creditsCard: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  creditsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  creditsLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  creditsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  creditsSubtext: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.8,
  },
  section: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  stageBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stageBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  bodyText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  toolCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toolCardProcessing: {
    opacity: 0.6,
  },
  toolIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  toolIconText: {
    fontSize: 24,
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 13,
    color: '#666',
  },
  toolAction: {
    alignItems: 'center',
    marginLeft: 10,
  },
  toolCost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  toolCostLabel: {
    fontSize: 11,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  creditsUsedBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  creditsUsedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  creditsRemainingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  resultText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
});

export default IdeaDetailScreen;
