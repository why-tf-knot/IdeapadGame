import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  ImageBackground,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useFrameCallback,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
  SharedValue,
  FrameInfo,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { reviewAPI, creditsAPI } from '../services/api';
import { Idea, TokenType, TOKEN_TYPES, TOKEN_META } from '../types';
import { COLORS as THEME, RADIUS, SHADOWS, SPACING } from '../theme';
import {
  PHYSICS,
  computeVelocity,
  stepRejectPhysics,
  stepSavePhysics,
  flutterRotation,
  flutterY,
  clamp,
  lerp,
  VelocitySample,
  PhysicsState,
} from '../utils/paperPhysics';

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

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

// ─── Card Phase State Machine ───────────────────────────
const PHASE = {
  LOADING: 0,
  IDLE: 1,        // card resting with subtle flutter
  DRAGGING: 2,    // user is touching — smoothed physics drag
  TOSS_REJECT: 3, // physics sim: gravity + tumble + crumple
  TOSS_SAVE: 4,   // physics sim: arc + spin + perspective shrink
  SNAP_BACK: 5,   // spring return to center
  DONE: 6,        // offscreen — trigger API call
} as const;

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
// Component — Real Physics Paper Toss
// ═════════════════════════════════════════════════════════
const PaperTossScreen: React.FC = () => {
  const [currentIdea, setCurrentIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [selectedTokenType, setSelectedTokenType] = useState<TokenType>('CHATGPT');
  const [isAnimating, setIsAnimating] = useState(false);

  // ─── Reanimated Shared Values ───────────────────────
  const cardX = useSharedValue(0);
  const cardY = useSharedValue(0);
  const cardRotation = useSharedValue(0);       // degrees
  const cardScale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);
  const phase = useSharedValue<number>(PHASE.LOADING);

  // Physics state
  const velX = useSharedValue(0);               // px/s
  const velY = useSharedValue(0);               // px/s
  const angularVel = useSharedValue(0);          // rad/s
  const physicsTime = useSharedValue(0);         // elapsed sim time

  // Global clock for idle flutter
  const globalTime = useSharedValue(0);

  // Velocity tracking buffer
  const velocityBuffer = useSharedValue<VelocitySample[]>([]);

  // Drag origin offset
  const dragStartX = useSharedValue(0);
  const dragStartY = useSharedValue(0);

  // Pending action after toss completes
  const pendingAction = useSharedValue<'reject' | 'save' | 'none'>('none');

  // Spinner
  const spinnerAngle = useSharedValue(0);

  // ─── Spinner Animation ──────────────────────────────
  useEffect(() => {
    const spin = () => {
      spinnerAngle.value = 0;
      spinnerAngle.value = withTiming(360, {
        duration: 1200,
        easing: Easing.linear,
      });
    };
    spin();
    const interval = setInterval(spin, 1200);
    return () => clearInterval(interval);
  }, []);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerAngle.value}deg` }],
  }));

  // ─── Swipe Indicator Animated Styles ────────────────
  const rejectIndicatorStyle = useAnimatedStyle(() => {
    const progress = clamp(cardY.value / PHYSICS.REJECT_MIN_DY, 0, 1);
    return {
      opacity: phase.value === PHASE.DRAGGING ? progress : 0,
      transform: [{ scale: lerp(0.7, 1.15, progress) }],
    };
  });

  const saveIndicatorStyle = useAnimatedStyle(() => {
    const progress = clamp(cardX.value / PHYSICS.SAVE_MIN_DX, 0, 1);
    return {
      opacity: phase.value === PHASE.DRAGGING ? progress : 0,
      transform: [{ scale: lerp(0.7, 1.15, progress) }],
    };
  });

  // ─── Card Animated Style ────────────────────────────
  const cardAnimatedStyle = useAnimatedStyle(() => {
    // Idle flutter (only when card is resting)
    let flutterRot = 0;
    let flutterTransY = 0;
    if (phase.value === PHASE.IDLE) {
      flutterRot = flutterRotation(globalTime.value);
      flutterTransY = flutterY(globalTime.value);
    }

    return {
      transform: [
        { translateX: cardX.value },
        { translateY: cardY.value + flutterTransY },
        { rotate: `${cardRotation.value + flutterRot}deg` },
        { scale: cardScale.value },
      ],
      opacity: cardOpacity.value,
    };
  });

  // ─── JS Callbacks (invoked from UI thread via runOnJS) ──
  const triggerHaptic = useCallback((type: string) => {
    try {
      ReactNativeHapticFeedback.trigger(type as any, hapticOptions);
    } catch {}
  }, []);

  const onRejectComplete = useCallback(async () => {
    if (!currentIdea) return;
    setIsAnimating(true);
    try {
      await reviewAPI.rejectIdea(currentIdea._id);
      loadNextIdea();
    } catch {
      setIsAnimating(false);
      Alert.alert('Error', 'Failed to reject idea');
    }
  }, [currentIdea]);

  const onSaveComplete = useCallback(async () => {
    if (!currentIdea) return;
    setIsAnimating(true);
    try {
      await reviewAPI.saveIdea(currentIdea._id);
      setShowCreditModal(true);
    } catch {
      setIsAnimating(false);
      Alert.alert('Error', 'Failed to save idea');
    }
  }, [currentIdea]);

  // ─── Physics Frame Callback ─────────────────────────
  // Executes every frame (~16ms) on the UI thread for
  // real-time Newtonian physics simulation
  useFrameCallback((frameInfo: FrameInfo) => {
    // Cap dt to prevent physics explosion on frame drops
    const dt = Math.min((frameInfo.timeSincePreviousFrame ?? 16) / 1000, 0.05);

    // Tick global clock (used for idle flutter)
    globalTime.value += dt;

    // ── Reject Toss: gravity + drag + turbulence + crumple ──
    if (phase.value === PHASE.TOSS_REJECT) {
      const state: PhysicsState = {
        x: cardX.value,
        y: cardY.value,
        vx: velX.value,
        vy: velY.value,
        rotation: cardRotation.value,
        angularVel: angularVel.value,
        scale: cardScale.value,
        opacity: cardOpacity.value,
        time: physicsTime.value,
      };

      const next = stepRejectPhysics(state, dt, SCREEN_HEIGHT);

      cardX.value = next.x;
      cardY.value = next.y;
      velX.value = next.vx;
      velY.value = next.vy;
      cardRotation.value = next.rotation;
      angularVel.value = next.angularVel;
      cardScale.value = next.scale;
      cardOpacity.value = next.opacity;
      physicsTime.value = next.time;

      // Terminal condition: card below screen or fully transparent
      if (next.y > SCREEN_HEIGHT + PHYSICS.OFFSCREEN_MARGIN || next.opacity <= 0.01) {
        phase.value = PHASE.DONE;
        runOnJS(onRejectComplete)();
      }
    }

    // ── Save Toss: lighter gravity arc + spin + perspective shrink ──
    if (phase.value === PHASE.TOSS_SAVE) {
      const state: PhysicsState = {
        x: cardX.value,
        y: cardY.value,
        vx: velX.value,
        vy: velY.value,
        rotation: cardRotation.value,
        angularVel: angularVel.value,
        scale: cardScale.value,
        opacity: cardOpacity.value,
        time: physicsTime.value,
      };

      const next = stepSavePhysics(state, dt, SCREEN_WIDTH);

      cardX.value = next.x;
      cardY.value = next.y;
      velX.value = next.vx;
      velY.value = next.vy;
      cardRotation.value = next.rotation;
      angularVel.value = next.angularVel;
      cardScale.value = next.scale;
      cardOpacity.value = next.opacity;
      physicsTime.value = next.time;

      // Terminal condition: past right edge or fully transparent
      if (next.x > SCREEN_WIDTH + PHYSICS.OFFSCREEN_MARGIN || next.opacity <= 0.01) {
        phase.value = PHASE.DONE;
        runOnJS(onSaveComplete)();
      }
    }
  });

  // ─── Load Next Idea ─────────────────────────────────
  const loadNextIdea = useCallback(async () => {
    setLoading(true);
    setIsAnimating(false);

    // Reset all physics state
    phase.value = PHASE.LOADING;
    cardX.value = 0;
    cardY.value = 0;
    cardRotation.value = 0;
    cardScale.value = 0.85;
    cardOpacity.value = 0;
    velX.value = 0;
    velY.value = 0;
    angularVel.value = 0;
    physicsTime.value = 0;
    velocityBuffer.value = [];
    pendingAction.value = 'none';

    try {
      const response = await reviewAPI.getNext();
      setCurrentIdea(response.idea);

      if (response.idea) {
        // Spring entrance: scale 0.85 → 1 with overshoot
        cardScale.value = withSpring(1, {
          damping: PHYSICS.SPRING_DAMPING,
          stiffness: PHYSICS.SPRING_STIFFNESS,
          mass: PHYSICS.SPRING_MASS,
        });
        // Fade in
        cardOpacity.value = withTiming(1, {
          duration: 350,
          easing: Easing.out(Easing.cubic),
        });
        // Enter idle state (enables flutter)
        phase.value = PHASE.IDLE;
      }
    } catch {
      Alert.alert('Error', 'Failed to load idea');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Mount ──────────────────────────────────────────
  useEffect(() => {
    loadNextIdea();
  }, []);

  // ─── Credit Allocation Handler ──────────────────────
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

  // ─── Pan Gesture (Gesture Handler v2 + Reanimated) ──
  const panGesture = Gesture.Pan()
    .enabled(!isAnimating)
    .onBegin(() => {
      // Only start drag from idle or snap-back
      if (phase.value !== PHASE.IDLE && phase.value !== PHASE.SNAP_BACK) return;

      phase.value = PHASE.DRAGGING;
      dragStartX.value = cardX.value;
      dragStartY.value = cardY.value;
      velocityBuffer.value = [];

      // Subtle "pickup" — card compresses slightly
      cardScale.value = withSpring(0.96, {
        damping: PHYSICS.SPRING_DAMPING,
        stiffness: PHYSICS.SPRING_STIFFNESS * 2,
      });

      runOnJS(triggerHaptic)('impactLight');
    })
    .onUpdate((e) => {
      if (phase.value !== PHASE.DRAGGING) return;

      // ── Smoothed position (lerp for momentum feel) ──
      const targetX = dragStartX.value + e.translationX;
      const targetY = dragStartY.value + e.translationY;
      cardX.value = lerp(cardX.value, targetX, 1 - PHYSICS.DRAG_SMOOTHING);
      cardY.value = lerp(cardY.value, targetY, 1 - PHYSICS.DRAG_SMOOTHING);

      // ── Velocity-driven tilt while dragging ──
      const tiltDeg = clamp(
        e.velocityX * PHYSICS.DRAG_TILT_FACTOR * 0.001,
        -PHYSICS.DRAG_MAX_TILT,
        PHYSICS.DRAG_MAX_TILT,
      );
      cardRotation.value = lerp(cardRotation.value, tiltDeg, 0.15);

      // ── Record velocity sample ──
      const now = Date.now();
      const buf = velocityBuffer.value.slice();
      buf.push({ x: e.absoluteX, y: e.absoluteY, t: now });
      while (buf.length > PHYSICS.VELOCITY_BUFFER_SIZE) {
        buf.shift();
      }
      velocityBuffer.value = buf;
    })
    .onEnd(() => {
      if (phase.value !== PHASE.DRAGGING) return;

      // ── Compute release velocity from tracked samples ──
      const now = Date.now();
      const { vx, vy, speed } = computeVelocity(velocityBuffer.value, now);
      const dx = cardX.value;
      const dy = cardY.value;

      // ── Classify throw ──
      const isRejectDist = dy > PHYSICS.REJECT_MIN_DY;
      const isRejectVel = vy > PHYSICS.REJECT_MIN_SPEED;
      const isReject = isRejectDist && isRejectVel;

      const isSaveDist = dx > PHYSICS.SAVE_MIN_DX;
      const isSaveVel = vx > PHYSICS.SAVE_MIN_SPEED;
      const isSaveFast = dx > PHYSICS.SAVE_FAST_DX && vx > PHYSICS.SAVE_FAST_SPEED;
      const isSave = (isSaveDist && isSaveVel) || isSaveFast;

      if (isReject) {
        // ── Launch reject physics ──
        phase.value = PHASE.TOSS_REJECT;
        velX.value = vx;
        velY.value = Math.max(vy, PHYSICS.REJECT_MIN_SPEED);
        // Angular velocity from horizontal component + random paper tumble
        angularVel.value = vx * 0.003 + (Math.random() - 0.5) * 4;
        physicsTime.value = 0;
        pendingAction.value = 'reject';
        runOnJS(triggerHaptic)('notificationWarning');

      } else if (isSave) {
        // ── Launch save physics ──
        phase.value = PHASE.TOSS_SAVE;
        velX.value = Math.max(vx, PHYSICS.SAVE_MIN_SPEED);
        velY.value = vy - 200; // slight upward launch for natural arc
        angularVel.value = vx * 0.002 + 2; // spin
        physicsTime.value = 0;
        pendingAction.value = 'save';
        runOnJS(triggerHaptic)('notificationSuccess');

      } else {
        // ── Snap back (spring physics) ──
        phase.value = PHASE.SNAP_BACK;

        // Use release velocity as spring initial velocity for natural feel
        cardX.value = withSpring(0, {
          damping: PHYSICS.SPRING_DAMPING,
          stiffness: PHYSICS.SPRING_STIFFNESS,
          mass: PHYSICS.SPRING_MASS,
          velocity: vx * 0.001,
        });
        cardY.value = withSpring(0, {
          damping: PHYSICS.SPRING_DAMPING,
          stiffness: PHYSICS.SPRING_STIFFNESS,
          mass: PHYSICS.SPRING_MASS,
          velocity: vy * 0.001,
        });
        cardRotation.value = withSpring(0, {
          damping: PHYSICS.SPRING_DAMPING * 1.2,
          stiffness: PHYSICS.SPRING_STIFFNESS,
        });
        cardScale.value = withSpring(1, {
          damping: PHYSICS.SPRING_DAMPING,
          stiffness: PHYSICS.SPRING_STIFFNESS,
        });

        // Return to idle (flutter resumes)
        phase.value = PHASE.IDLE;

        runOnJS(triggerHaptic)('impactMedium');
      }
    });

  // ─── Tap Gesture (open detail modal) ────────────────
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      if (phase.value === PHASE.IDLE || phase.value === PHASE.SNAP_BACK) {
        runOnJS(setShowDetails)(true);
      }
    });

  // Pan takes priority; Tap only fires if no drag happened
  const composedGesture = Gesture.Race(panGesture, tapGesture);

  // ─── Derived colors ─────────────────────────────────
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
        <Animated.View style={spinnerStyle}>
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
  // Build pitch preview cards
  // ═════════════════════════════════════════════════════
  const pitchCards = buildPitchCards(currentIdea);
  const previewPitchCards = pitchCards.slice(0, 2);

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
          rejectIndicatorStyle,
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
          saveIndicatorStyle,
        ]}
      >
        <View style={[styles.indicatorCircle, { backgroundColor: THEME.accentLight }]}>
          <Text style={styles.indicatorEmoji}>📥</Text>
        </View>
        <Text style={[styles.indicatorLabel, { color: THEME.accent }]}>Save</Text>
      </Animated.View>

      {/* ──── Paper Card (real physics) ─────────────── */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[styles.card, cardAnimatedStyle]}
        >
          <ImageBackground
            source={require('../assets/notebook-paper-bg.svg')}
            resizeMode="stretch"
            style={styles.cardBg}
            imageStyle={{ borderRadius: 24 }}
          >
            <View style={styles.cardTouchable}>
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

            {/* Divider */}
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
            </View>
          </ImageBackground>
        </Animated.View>
        cardBg: {
          flex: 1,
          width: '100%',
          height: '100%',
          borderRadius: 24,
          overflow: 'hidden',
          justifyContent: 'flex-start',
        },
      </GestureDetector>

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

            <Text style={styles.detailTitle}>
              {currentIdea.pitchTitle || currentIdea.title}
            </Text>
            <Text style={styles.detailSummary}>{currentIdea.oneLineSummary}</Text>

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
            <View style={styles.creditHeader}>
              <Text style={styles.creditEmoji}>⚡</Text>
              <Text style={styles.creditTitle}>Invest Tokens</Text>
              <Text style={styles.creditSubtitle}>
                Choose a token type and amount to invest in this idea
              </Text>
            </View>

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
// STYLES (unchanged from original)
// ═══════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
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
