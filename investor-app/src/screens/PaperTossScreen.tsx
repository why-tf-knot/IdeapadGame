import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { reviewAPI, creditsAPI } from '../services/api';
import { Idea, TokenType, TOKEN_TYPES, TOKEN_META } from '../types';
import { COLORS as THEME, RADIUS, SHADOWS, SPACING } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.88;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.58;

// ─── Theme ──────────────────────────────────────────────
const COLORS = {
  bg: '#0A1628',
  card: '#142038',
  cardInner: '#182844',
  border: '#1E2D45',
  red: '#E63946',
  gold: '#FFB547',
  white: '#FFFFFF',
  textPrimary: '#F0F4FA',
  textSecondary: '#8899B0',
  textMuted: '#556680',
  overlay: 'rgba(6, 12, 24, 0.85)',
  modalBg: '#111C30',
  pitchCard: '#1A2E4A',
};

const CATEGORY_COLORS: Record<string, string> = {
  App: '#4F8EF7',
  Website: '#34D399',
  SaaS: '#A78BFA',
  'AI Tool': '#F472B6',
  'Content/Productized Service': '#FB923C',
  Other: '#6EE7B7',
};

const STAGE_COLORS: Record<string, string> = {
  Idea: COLORS.gold,
  Prototype: '#4F8EF7',
  MVP: '#34D399',
  Launched: COLORS.red,
};

// ─── Animation Config ───────────────────────────────────
const ANIM = {
  CRUMPLE_DURATION: 320,
  FLYING_DURATION: 420,
  SPRING_FRICTION: 7,
  SPRING_TENSION: 40,
  REJECT_THRESHOLD_Y: 120,
  REJECT_VELOCITY: 0.7,
  SAVE_THRESHOLD_X: 150,
  SAVE_VELOCITY_X: 0.7,
  SAVE_MIN_X: 100,
  ENTRANCE_FRICTION: 6,
  ENTRANCE_TENSION: 55,
};

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

// ─── Pitch Card Data Helper ─────────────────────────────
interface PitchCardItem {
  emoji: string;
  label: string;
  text: string;
}

const buildPitchCards = (idea: Idea): PitchCardItem[] => {
  if (idea.pitchIdea || idea.pitchTarget || idea.pitchSolves || idea.pitchHow) {
    const cards: PitchCardItem[] = [];
    if (idea.pitchIdea) cards.push({ emoji: '💡', label: 'The Idea', text: idea.pitchIdea });
    if (idea.pitchTarget) cards.push({ emoji: '🎯', label: 'The Target', text: idea.pitchTarget });
    if (idea.pitchSolves) cards.push({ emoji: '🔧', label: 'What it Solves', text: idea.pitchSolves });
    if (idea.pitchHow) cards.push({ emoji: '⚙️', label: 'How it Works', text: idea.pitchHow });
    return cards;
  }
  // Fallback to legacy fields
  const cards: PitchCardItem[] = [];
  if (idea.problem) cards.push({ emoji: '🔥', label: 'Problem', text: idea.problem });
  if (idea.solution) cards.push({ emoji: '✅', label: 'Solution', text: idea.solution });
  if (idea.targetUser) cards.push({ emoji: '🎯', label: 'Target User', text: idea.targetUser });
  if (idea.differentiation) cards.push({ emoji: '⭐', label: 'Differentiation', text: idea.differentiation });
  if (idea.monetization) cards.push({ emoji: '💰', label: 'Monetization', text: idea.monetization });
  if (idea.roadmap) cards.push({ emoji: '🗺️', label: 'Roadmap', text: idea.roadmap });
  return cards;
};

// ═════════════════════════════════════════════════════════
// Component
// ═════════════════════════════════════════════════════════
const PaperTossScreen: React.FC = () => {
  const [currentIdea, setCurrentIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [selectedTokenType, setSelectedTokenType] = useState<TokenType>('CHATGPT');
  const [isAnimating, setIsAnimating] = useState(false);

  // ─── Animated values ────────────────────────────────
  const pan = useRef(new Animated.ValueXY()).current;
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const spinnerRotation = useRef(new Animated.Value(0)).current;

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-25deg', '0deg', '25deg'],
    extrapolate: 'clamp',
  });

  // Reject indicator opacity driven by downward swipe
  const rejectIndicatorOpacity = pan.y.interpolate({
    inputRange: [0, ANIM.REJECT_THRESHOLD_Y],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const rejectIndicatorScale = pan.y.interpolate({
    inputRange: [0, ANIM.REJECT_THRESHOLD_Y],
    outputRange: [0.7, 1.15],
    extrapolate: 'clamp',
  });

  // Save indicator opacity driven by rightward swipe
  const saveIndicatorOpacity = pan.x.interpolate({
    inputRange: [0, ANIM.SAVE_THRESHOLD_X],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const saveIndicatorScale = pan.x.interpolate({
    inputRange: [0, ANIM.SAVE_THRESHOLD_X],
    outputRange: [0.7, 1.15],
    extrapolate: 'clamp',
  });

  // ─── Cleanup ────────────────────────────────────────
  useEffect(() => {
    return () => {
      pan.removeAllListeners();
      cardScale.removeAllListeners();
      cardOpacity.removeAllListeners();
      spinnerRotation.removeAllListeners();
    };
  }, [pan, cardScale, cardOpacity, spinnerRotation]);

  // ─── Spinner loop ───────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinnerRotation, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spinnerRotation]);

  const spinDeg = spinnerRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ─── Load first idea on mount ───────────────────────
  useEffect(() => {
    loadNextIdea();
  }, []);

  // ─── Data loading ───────────────────────────────────
  const loadNextIdea = async () => {
    setLoading(true);
    setIsAnimating(false);

    // Reset positions
    pan.setValue({ x: 0, y: 0 });
    cardScale.setValue(0.85);
    cardOpacity.setValue(0);

    try {
      const response = await reviewAPI.getNext();
      setCurrentIdea(response.idea);

      if (response.idea) {
        // Spring entrance animation
        Animated.parallel([
          Animated.spring(cardScale, {
            toValue: 1,
            friction: ANIM.ENTRANCE_FRICTION,
            tension: ANIM.ENTRANCE_TENSION,
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load idea');
    } finally {
      setLoading(false);
    }
  };

  // ─── Actions ────────────────────────────────────────
  const handleReject = async () => {
    if (!currentIdea || isAnimating) return;
    setIsAnimating(true);
    ReactNativeHapticFeedback.trigger('notificationWarning', hapticOptions);

    try {
      await reviewAPI.rejectIdea(currentIdea._id);
      loadNextIdea();
    } catch (error) {
      setIsAnimating(false);
      Alert.alert('Error', 'Failed to reject idea');
      resetCardPosition();
    }
  };

  const handleSave = async () => {
    if (!currentIdea || isAnimating) return;
    setIsAnimating(true);
    ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);

    try {
      await reviewAPI.saveIdea(currentIdea._id);
      setShowCreditModal(true);
    } catch (error) {
      setIsAnimating(false);
      Alert.alert('Error', 'Failed to save idea');
      resetCardPosition();
    }
  };

  const handleCreditAllocation = async () => {
    if (selectedAmount > 0 && currentIdea) {
      try {
        await creditsAPI.invest(currentIdea._id, selectedAmount, selectedTokenType);
        ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
        Alert.alert('Invested!', `You allocated ${selectedAmount} ${TOKEN_META[selectedTokenType].label} tokens to this idea.`);
      } catch (error: any) {
        ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
        Alert.alert('Error', error.response?.data?.error || 'Failed to allocate credits');
      }
    }
    setShowCreditModal(false);
    setSelectedAmount(0);
    loadNextIdea();
  };

  const resetCardPosition = () => {
    Animated.parallel([
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        friction: ANIM.SPRING_FRICTION,
        tension: ANIM.SPRING_TENSION,
        useNativeDriver: false,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: ANIM.SPRING_FRICTION,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ─── Gesture Handler ────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimating,
      onPanResponderGrant: () => {
        ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
        Animated.spring(cardScale, {
          toValue: 0.96,
          friction: ANIM.SPRING_FRICTION,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        const { dx, dy, vy, vx } = gestureState;

        // Restore scale first
        Animated.spring(cardScale, {
          toValue: 1,
          friction: ANIM.SPRING_FRICTION,
          useNativeDriver: true,
        }).start();

        // REJECT: swipe down
        if (dy > ANIM.REJECT_THRESHOLD_Y && vy > ANIM.REJECT_VELOCITY) {
          Animated.parallel([
            Animated.timing(pan, {
              toValue: { x: dx * 0.5, y: SCREEN_HEIGHT + 100 },
              duration: ANIM.CRUMPLE_DURATION,
              useNativeDriver: false,
            }),
            Animated.timing(cardScale, {
              toValue: 0.25,
              duration: ANIM.CRUMPLE_DURATION,
              useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
              toValue: 0,
              duration: ANIM.CRUMPLE_DURATION,
              useNativeDriver: true,
            }),
          ]).start(() => handleReject());
        }
        // SAVE: swipe right
        else if (
          dx > ANIM.SAVE_THRESHOLD_X ||
          (dx > ANIM.SAVE_MIN_X && vx > ANIM.SAVE_VELOCITY_X)
        ) {
          Animated.parallel([
            Animated.timing(pan, {
              toValue: { x: SCREEN_WIDTH + 120, y: dy - 60 },
              duration: ANIM.FLYING_DURATION,
              useNativeDriver: false,
            }),
            Animated.timing(cardScale, {
              toValue: 0.75,
              duration: ANIM.FLYING_DURATION,
              useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
              toValue: 0,
              duration: ANIM.FLYING_DURATION,
              useNativeDriver: true,
            }),
          ]).start(() => handleSave());
        }
        // SNAP BACK
        else {
          ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
          resetCardPosition();
        }
      },
    }),
  ).current;

  // ─── Category badge color ───────────────────────────
  const categoryColor = currentIdea
    ? CATEGORY_COLORS[currentIdea.category] || COLORS.gold
    : COLORS.gold;
  const stageColor = currentIdea
    ? STAGE_COLORS[currentIdea.stage] || COLORS.textSecondary
    : COLORS.textSecondary;

  // ═════════════════════════════════════════════════════
  // LOADING STATE
  // ═════════════════════════════════════════════════════
  if (loading) {
    return (
      <View style={styles.container}>
        <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
          <Text style={styles.spinnerEmoji}>🔄</Text>
        </Animated.View>
        <Text style={styles.loadingText}>Finding next idea…</Text>
        <Text style={styles.loadingSubtext}>Shuffling the deck</Text>
      </View>
    );
  }

  // ═════════════════════════════════════════════════════
  // EMPTY STATE
  // ═════════════════════════════════════════════════════
  if (!currentIdea) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🏖️</Text>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtext}>
            No more ideas to review right now.{'\n'}Check back later for fresh submissions.
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadNextIdea}>
            <Text style={styles.refreshButtonText}>↻  Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ═════════════════════════════════════════════════════
  // Build pitch preview cards for main card face
  // ═════════════════════════════════════════════════════
  const pitchCards = buildPitchCards(currentIdea);
  const previewPitchCards = pitchCards.slice(0, 2); // show max 2 on the main card

  // ═════════════════════════════════════════════════════
  // MAIN RENDER
  // ═════════════════════════════════════════════════════
  return (
    <View style={styles.container}>
      {/* ──── Header ────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Ideas</Text>
        <Text style={styles.headerSubtitle}>Swipe to decide</Text>
      </View>

      {/* ──── Trash indicator (bottom) ──────────────── */}
      <Animated.View
        style={[
          styles.indicator,
          styles.trashIndicator,
          {
            opacity: rejectIndicatorOpacity,
            transform: [{ scale: rejectIndicatorScale }],
          },
        ]}
      >
        <View style={[styles.indicatorCircle, { backgroundColor: 'rgba(230,57,70,0.15)' }]}>
          <Text style={styles.indicatorEmoji}>🗑️</Text>
        </View>
        <Text style={[styles.indicatorLabel, { color: COLORS.red }]}>Reject</Text>
      </Animated.View>

      {/* ──── Save indicator (right) ────────────────── */}
      <Animated.View
        style={[
          styles.indicator,
          styles.saveIndicator,
          {
            opacity: saveIndicatorOpacity,
            transform: [{ scale: saveIndicatorScale }],
          },
        ]}
      >
        <View style={[styles.indicatorCircle, { backgroundColor: THEME.accentLight }]}>
          <Text style={styles.indicatorEmoji}>📥</Text>
        </View>
        <Text style={[styles.indicatorLabel, { color: THEME.accent }]}>Save</Text>
      </Animated.View>

      {/* ──── Paper Card ────────────────────────────── */}
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { rotate },
              { scale: cardScale },
            ],
            opacity: cardOpacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.cardTouchable}
          onPress={() => setShowDetails(true)}
          activeOpacity={0.95}
        >
          {/* Top row: category + stage */}
          <View style={styles.cardTopRow}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '22', borderColor: categoryColor + '55' }]}>
              <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {currentIdea.category}
              </Text>
            </View>
            <View style={[styles.stageBadge, { backgroundColor: stageColor + '22', borderColor: stageColor + '55' }]}>
              <Text style={[styles.stageText, { color: stageColor }]}>
                {currentIdea.stage}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.cardTitle} numberOfLines={2}>
            {currentIdea.pitchTitle || currentIdea.title}
          </Text>

          {/* Summary */}
          <Text style={styles.cardSummary} numberOfLines={2}>
            {currentIdea.oneLineSummary}
          </Text>

          {/* Divider line */}
          <View style={styles.divider} />

          {/* Pitch preview cards */}
          {previewPitchCards.length > 0 && (
            <View style={styles.pitchPreviewContainer}>
              {previewPitchCards.map((pc, idx) => (
                <View key={idx} style={styles.pitchPreviewCard}>
                  <Text style={styles.pitchPreviewEmoji}>{pc.emoji}</Text>
                  <View style={styles.pitchPreviewText}>
                    <Text style={styles.pitchPreviewLabel}>{pc.label}</Text>
                    <Text style={styles.pitchPreviewBody} numberOfLines={2}>
                      {pc.text}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Bottom hint */}
          <View style={styles.cardBottomRow}>
            <Text style={styles.tapHint}>Tap for full details</Text>
            <View style={styles.swipeHints}>
              <Text style={styles.swipeHintText}>↓ reject</Text>
              <Text style={styles.swipeHintDot}>·</Text>
              <Text style={styles.swipeHintText}>→ save</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* ═══════════════════════════════════════════════ */}
      {/* DETAIL MODAL                                   */}
      {/* ═══════════════════════════════════════════════ */}
      <Modal
        visible={showDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.detailModal}>
          {/* Header */}
          <View style={styles.detailHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailHeaderTitle}>Idea Details</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowDetails(false)}
              style={styles.detailCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.detailCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.detailScroll}
            contentContainerStyle={styles.detailScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top badges */}
            <View style={styles.detailBadgeRow}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '22', borderColor: categoryColor + '55' }]}>
                <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                <Text style={[styles.categoryText, { color: categoryColor }]}>
                  {currentIdea.category}
                </Text>
              </View>
              <View style={[styles.stageBadge, { backgroundColor: stageColor + '22', borderColor: stageColor + '55' }]}>
                <Text style={[styles.stageText, { color: stageColor }]}>
                  {currentIdea.stage}
                </Text>
              </View>
            </View>

            {/* Title + summary */}
            <Text style={styles.detailTitle}>
              {currentIdea.pitchTitle || currentIdea.title}
            </Text>
            <Text style={styles.detailSummary}>{currentIdea.oneLineSummary}</Text>

            {/* Pitch cards */}
            {pitchCards.length > 0 && (
              <View style={styles.pitchCardGrid}>
                {pitchCards.map((pc, idx) => (
                  <View key={idx} style={styles.pitchDetailCard}>
                    <View style={styles.pitchDetailHeader}>
                      <Text style={styles.pitchDetailEmoji}>{pc.emoji}</Text>
                      <Text style={styles.pitchDetailLabel}>{pc.label}</Text>
                    </View>
                    <Text style={styles.pitchDetailBody}>{pc.text}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Extra legacy fields that don't appear in pitch cards */}
            {currentIdea.monetization && !currentIdea.pitchIdea && (
              <View style={styles.legacySection}>
                <Text style={styles.legacySectionTitle}>💰  Monetization</Text>
                <Text style={styles.legacySectionText}>{currentIdea.monetization}</Text>
              </View>
            )}
            {currentIdea.roadmap && !currentIdea.pitchIdea && (
              <View style={styles.legacySection}>
                <Text style={styles.legacySectionTitle}>🗺️  Roadmap</Text>
                <Text style={styles.legacySectionText}>{currentIdea.roadmap}</Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════ */}
      {/* CREDIT ALLOCATION MODAL                        */}
      {/* ═══════════════════════════════════════════════ */}
      <Modal
        visible={showCreditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreditModal(false)}
      >
        <View style={styles.creditOverlay}>
          <View style={styles.creditContainer}>
            {/* Header */}
            <View style={styles.creditHeader}>
              <Text style={styles.creditEmoji}>⚡</Text>
              <Text style={styles.creditTitle}>Invest Tokens</Text>
              <Text style={styles.creditSubtitle}>
                Choose a token type and amount to invest in this idea
              </Text>
            </View>

            {/* Token type selector */}
            <View style={styles.creditGrid}>
              {TOKEN_TYPES.map((tt) => {
                const meta = TOKEN_META[tt];
                const isSelected = selectedTokenType === tt;
                return (
                  <TouchableOpacity
                    key={tt}
                    style={[
                      styles.creditOption,
                      isSelected && { backgroundColor: meta.color, borderColor: meta.color },
                    ]}
                    onPress={() => {
                      setSelectedTokenType(tt);
                      ReactNativeHapticFeedback.trigger('selection', hapticOptions);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.creditOptionAmount, isSelected && styles.creditOptionAmountActive]}>
                      {meta.icon}
                    </Text>
                    <Text style={[styles.creditOptionLabel, isSelected && styles.creditOptionLabelActive]}>
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Amount options */}
            <View style={styles.creditGrid}>
              {[25, 50, 100, 200].map((amount) => {
                const isSelected = selectedAmount === amount;
                return (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.creditOption,
                      isSelected && styles.creditOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedAmount(amount);
                      ReactNativeHapticFeedback.trigger('selection', hapticOptions);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.creditOptionAmount,
                        isSelected && styles.creditOptionAmountActive,
                      ]}
                    >
                      {amount}
                    </Text>
                    <Text
                      style={[
                        styles.creditOptionLabel,
                        isSelected && styles.creditOptionLabelActive,
                      ]}
                    >
                      tokens
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={[
                styles.creditInvestBtn,
                selectedAmount === 0 && styles.creditSkipBtn,
              ]}
              onPress={handleCreditAllocation}
              activeOpacity={0.85}
            >
              <Text style={styles.creditInvestBtnText}>
                {selectedAmount > 0
                  ? `Invest ${selectedAmount} ${TOKEN_META[selectedTokenType].label}  ⚡`
                  : 'Skip for now'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.creditCancelBtn}
              onPress={() => {
                setShowCreditModal(false);
                setSelectedAmount(0);
                loadNextIdea();
              }}
            >
              <Text style={styles.creditCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ═══════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════
const styles = StyleSheet.create({
  // ─── Container ──────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Header ─────────────────────────────────────────
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 36,
    left: 24,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // ─── Loading State ──────────────────────────────────
  spinnerEmoji: {
    fontSize: 48,
  },
  loadingText: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.textMuted,
  },

  // ─── Empty State ────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  refreshButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  refreshButtonText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '600',
  },

  // ─── Indicators ─────────────────────────────────────
  indicator: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 5,
  },
  trashIndicator: {
    bottom: 50,
  },
  saveIndicator: {
    right: 24,
    top: SCREEN_HEIGHT / 2 - 45,
  },
  indicatorCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  indicatorEmoji: {
    fontSize: 28,
  },
  indicatorLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ─── Paper Card ─────────────────────────────────────
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    // Layered shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  cardTouchable: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-start',
  },

  // Card top row
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  categoryDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  stageBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  stageText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Card body
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
    marginBottom: 8,
    lineHeight: 30,
  },
  cardSummary: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },

  // Pitch preview on card face
  pitchPreviewContainer: {
    gap: 10,
    marginBottom: 12,
  },
  pitchPreviewCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.cardInner,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pitchPreviewEmoji: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 1,
  },
  pitchPreviewText: {
    flex: 1,
  },
  pitchPreviewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  pitchPreviewBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Card bottom
  cardBottomRow: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tapHint: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  swipeHints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  swipeHintDot: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginHorizontal: 6,
  },

  // ─── Detail Modal ───────────────────────────────────
  detailModal: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 58 : 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  detailCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCloseBtnText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    padding: 20,
  },
  detailBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
    marginBottom: 8,
    lineHeight: 34,
  },
  detailSummary: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },

  // Pitch detail cards
  pitchCardGrid: {
    gap: 14,
  },
  pitchDetailCard: {
    backgroundColor: COLORS.pitchCard,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pitchDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pitchDetailEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  pitchDetailLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pitchDetailBody: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 23,
  },

  // Legacy sections
  legacySection: {
    marginTop: 20,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  legacySectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gold,
    marginBottom: 8,
  },
  legacySectionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 23,
  },

  // ─── Credit Modal ───────────────────────────────────
  creditOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditContainer: {
    width: SCREEN_WIDTH * 0.88,
    backgroundColor: THEME.cardBg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: SPACING.lg + 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.5,
        shadowRadius: 32,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  creditHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  creditEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  creditTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  creditSubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  creditGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  creditOption: {
    width: '47%' as any,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: THEME.border,
    backgroundColor: THEME.formBg,
    alignItems: 'center',
  },
  creditOptionActive: {
    borderColor: THEME.accent,
    backgroundColor: THEME.accentLight,
  },
  creditOptionAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.textSecondary,
  },
  creditOptionAmountActive: {
    color: THEME.accent,
  },
  creditOptionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  creditOptionLabelActive: {
    color: THEME.accent,
  },
  creditInvestBtn: {
    backgroundColor: THEME.accent,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: SPACING.md - 4,
  },
  creditSkipBtn: {
    backgroundColor: THEME.formBg,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  creditInvestBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.white,
  },
  creditCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  creditCancelText: {
    fontSize: 14,
    color: THEME.textMuted,
  },
});

export default PaperTossScreen;
