import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { ideasAPI } from '../services/api';
import { WizardAnswers } from '../types';

// ─── Light theme matching Red Bull Basement ─────────────
const COLORS = {
  bg: '#F5F5F0',
  text: '#1A2332',
  textSecondary: '#5A6577',
  accent: '#D93B41',
  cardBg: '#FFFFFF',
  border: '#E0E4EB',
  skyline: '#C8CDD6',
};

interface PitchGeneratingScreenProps {
  route: any;
  navigation: any;
}

const LOADING_MESSAGES = [
  'Analyzing your idea...',
  'Understanding your audience...',
  'Mapping the market...',
  'Crafting your pitch...',
  'A bit of patience, we are generating your pitch',
  'Almost there...',
];

const PitchGeneratingScreen: React.FC<PitchGeneratingScreenProps> = ({
  route,
  navigation,
}) => {
  const { wizardAnswers } = route.params as { wizardAnswers: WizardAnswers };
  const [messageIndex, setMessageIndex] = useState(0);
  const [pitchReady, setPitchReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const robotWaveAnim = useRef(new Animated.Value(0)).current;
  const cardFadeAnim = useRef(new Animated.Value(0)).current;

  // Robot wave animation
  useEffect(() => {
    const wave = Animated.loop(
      Animated.sequence([
        Animated.timing(robotWaveAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(robotWaveAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    wave.start();
    return () => wave.stop();
  }, [robotWaveAnim]);

  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  // Generate pitch
  useEffect(() => {
    generatePitch();
  }, []);

  const generatePitch = async () => {
    try {
      const response = await ideasAPI.generatePitch(wizardAnswers);

      // Brief "ready" state before navigating
      setPitchReady(true);
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      // Short delay so user sees "Well done" state
      await new Promise<void>((resolve) => setTimeout(resolve, 1200));

      navigation.replace('PitchSummary', {
        ideaId: response.idea._id,
        pitch: {
          pitchTitle: response.idea.pitchTitle,
          pitchIdea: response.idea.pitchIdea,
          pitchTarget: response.idea.pitchTarget,
          pitchSolves: response.idea.pitchSolves,
          pitchHow: response.idea.pitchHow,
        },
      });
    } catch (error: any) {
      console.error('Pitch generation error:', error);
      navigation.replace('PitchSummary', {
        ideaId: null,
        pitch: {
          pitchTitle: 'My Idea',
          pitchIdea: wizardAnswers.step1,
          pitchTarget: wizardAnswers.step2,
          pitchSolves: wizardAnswers.step3,
          pitchHow: wizardAnswers.step4,
        },
        wizardAnswers,
        error: 'Failed to generate pitch. You can still edit your submission.',
      });
    }
  };

  const robotRotation = robotWaveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Main heading */}
        <Text style={styles.heading}>
          {pitchReady ? 'Well done' : 'Hang tight'}
        </Text>
        <Text style={styles.subheading}>
          {pitchReady
            ? 'Your pitch is ready!'
            : 'Our AI is crafting your pitch'}
        </Text>

        {/* Loading message card (or placeholder cards when ready) */}
        {pitchReady ? (
          <Animated.View style={[styles.readyCards, { opacity: cardFadeAnim }]}>
            {['The Idea', 'The Target', 'What it Solves', 'How it Works'].map(
              (label) => (
                <View key={label} style={styles.placeholderCard}>
                  <View style={styles.placeholderLine} />
                  <View style={[styles.placeholderLine, { width: '60%' }]} />
                </View>
              ),
            )}
          </Animated.View>
        ) : (
          <View style={styles.loadingSection}>
            <View style={styles.loadingCard}>
              <Animated.Text
                style={[styles.loadingMessage, { opacity: fadeAnim }]}>
                {LOADING_MESSAGES[messageIndex]}
              </Animated.Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: robotWaveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['30%', '70%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* Robot character on the right side */}
      <Animated.View
        style={[
          styles.robotContainer,
          { transform: [{ rotate: robotRotation }] },
        ]}>
        <Text style={styles.robotEmoji}>🤖</Text>
        <View style={styles.robotLightbulb}>
          <Text style={styles.robotLightbulbEmoji}>💡</Text>
        </View>
      </Animated.View>

      {/* City skyline at bottom */}
      <View style={styles.skyline}>
        <Text style={styles.skylineText}>🏙️</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'ios' ? 80 : 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  heading: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 28,
  },

  // ─── Loading state ─────────────────────
  loadingSection: {
    gap: 16,
  },
  loadingCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: 'center',
  },
  loadingMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressTrack: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },

  // ─── Ready state (placeholder cards) ───
  readyCards: {
    gap: 12,
  },
  placeholderCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 8,
  },
  placeholderLine: {
    height: 10,
    backgroundColor: '#E8EDF4',
    borderRadius: 5,
    width: '85%',
  },

  // ─── Robot character ───────────────────
  robotContainer: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 200 : 160,
    alignItems: 'center',
  },
  robotEmoji: {
    fontSize: 80,
  },
  robotLightbulb: {
    position: 'absolute',
    top: -16,
    right: -4,
  },
  robotLightbulbEmoji: {
    fontSize: 22,
  },

  // ─── Skyline ──────────────────────────
  skyline: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    opacity: 0.2,
  },
  skylineText: {
    fontSize: 48,
    letterSpacing: 10,
  },
});

export default PitchGeneratingScreen;
