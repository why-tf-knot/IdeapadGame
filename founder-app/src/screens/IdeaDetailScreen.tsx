import React, { useState, useEffect, useRef } from 'react';
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
import { Idea, TokenType, TOKEN_TYPES, TOKEN_META, TokenBalances } from '../types';
import { handleApiError } from '../utils/errorHandler';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

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
  const [tokenBalances, setTokenBalances] = useState<TokenBalances>({ gemini: 0, anthropic: 0, perplexity: 0, chatgpt: 0 });
  const [selectedToken, setSelectedToken] = useState<TokenType>('CHATGPT');
  const [loading, setLoading] = useState(true);
  const [processingTool, setProcessingTool] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);

  // AbortController ref for cancelling in-flight requests on unmount
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadIdeaDetails();

    // Cleanup: abort any in-flight requests when navigating away
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [ideaId]);

  const loadIdeaDetails = async () => {
    try {
      const ideaResponse = await ideasAPI.getById(ideaId);
      setIdea(ideaResponse.idea);

      // Load per-token balances for this idea
      try {
        const creditInfo = await creditsAPI.getIdeaCredits(ideaId);
        if (creditInfo.balances) {
          setTokenBalances(creditInfo.balances);
        }
      } catch {
        // Fallback — old data
      }
      
      navigation.setOptions({ title: ideaResponse.idea.title });
    } catch (error) {
      handleApiError(error, 'Failed to load idea details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  /** Get balance for currently selected token */
  const currentTokenBalance = tokenBalances[selectedToken.toLowerCase() as keyof TokenBalances] || 0;

  const handleUseTool = async (tool: AITool) => {
    if (!idea) return;

    if (currentTokenBalance < tool.cost) {
      Alert.alert(
        'Insufficient Tokens',
        `You need ${tool.cost} ${TOKEN_META[selectedToken].label} tokens to use this tool, but only have ${currentTokenBalance} available.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Confirm',
      `Spend ${tool.cost} ${TOKEN_META[selectedToken].label} tokens for "${tool.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Tokens',
          onPress: () => executeTool(tool),
        },
      ]
    );
  };

  const executeTool = async (tool: AITool) => {
    if (!idea) return;

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setProcessingTool(tool.id);
    setSelectedTool(tool);

    // Optimistic UI update: deduct tokens immediately
    const previousBalances = { ...tokenBalances };
    const tokenKey = selectedToken.toLowerCase() as keyof TokenBalances;
    setTokenBalances(prev => ({ ...prev, [tokenKey]: prev[tokenKey] - tool.cost }));

    try {
      const response = await creditsAPI.spend(idea._id, tool.cost, tool.service, selectedToken);
      
      // Update with actual server balances
      if (response.newBalances) {
        setTokenBalances(response.newBalances);
      }
      setAiResult(response.result);
      setShowResultModal(true);
    } catch (error: any) {
      // Check if the request was intentionally aborted (navigation away)
      if (error?.name === 'AbortError' || error?.message === 'canceled') {
        return;
      }

      // Rollback optimistic update on error
      setTokenBalances(previousBalances);
      handleApiError(error, 'Failed to process AI request');
    } finally {
      setProcessingTool(null);
      abortControllerRef.current = null;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
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
        {/* Token Balances Card */}
        <View style={styles.creditsCard}>
          <View style={styles.creditsHeader}>
            <Text style={styles.creditsLabel}>Idea Token Balances</Text>
          </View>
          <View style={styles.tokenRow}>
            {TOKEN_TYPES.map((tt) => {
              const meta = TOKEN_META[tt];
              const bal = tokenBalances[tt.toLowerCase() as keyof TokenBalances] || 0;
              const isSelected = selectedToken === tt;
              return (
                <TouchableOpacity
                  key={tt}
                  style={[styles.tokenChip, isSelected && { backgroundColor: meta.color + '33', borderColor: meta.color }]}
                  onPress={() => setSelectedToken(tt)}>
                  <Text style={styles.tokenChipIcon}>{meta.icon}</Text>
                  <Text style={[styles.tokenChipLabel, isSelected && { color: meta.color }]}>{bal}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.creditsSubtext}>
            Selected: {TOKEN_META[selectedToken].icon} {TOKEN_META[selectedToken].label} — powered by {TOKEN_META[selectedToken].provider}
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
            Spend {TOKEN_META[selectedToken].label} tokens to enhance your pitch
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
                  <ActivityIndicator size="small" color={TOKEN_META[selectedToken].color} />
                ) : (
                  <>
                    <Text style={[styles.toolCost, { color: TOKEN_META[selectedToken].color }]}>{tool.cost}</Text>
                    <Text style={styles.toolCostLabel}>{TOKEN_META[selectedToken].label}</Text>
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
                ✓ Used {selectedTool?.cost} {TOKEN_META[selectedToken].label} tokens
              </Text>
              <Text style={styles.creditsRemainingText}>
                {currentTokenBalance} remaining
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
    backgroundColor: COLORS.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
  },
  scrollView: {
    flex: 1,
  },
  creditsCard: {
    backgroundColor: COLORS.accent,
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    ...SHADOWS.lg,
  },
  creditsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  creditsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.9,
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.sm,
  },
  tokenChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    marginHorizontal: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tokenChipIcon: {
    fontSize: 18,
  },
  tokenChipLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 2,
  },
  creditsSubtext: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.8,
  },
  section: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: SPACING.md,
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  stageBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  stageBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  bodyText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  toolCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  toolCardProcessing: {
    opacity: 0.6,
  },
  toolIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.formBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
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
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  toolDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  toolAction: {
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  toolCost: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent,
  },
  toolCostLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  creditsUsedBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.successBg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  creditsUsedText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.successDark,
  },
  creditsRemainingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.successDark,
  },
  resultText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
  },
});

export default IdeaDetailScreen;
