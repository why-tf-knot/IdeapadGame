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
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Spinner animation
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [spinAnim]);

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

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
      
      // Navigate to pitch summary
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

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Top decorative elements */}
      <View style={styles.decorTop}>
        <View style={[styles.decorDot, styles.decorDot1]} />
        <View style={[styles.decorDot, styles.decorDot2]} />
        <View style={[styles.decorDot, styles.decorDot3]} />
      </View>

      <View style={styles.content}>
        {/* Animated spinner */}
        <Animated.View
          style={[
            styles.spinnerContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}>
          <Animated.View
            style={[
              styles.spinnerRing,
              { transform: [{ rotate: spinInterpolation }] },
            ]}>
            <View style={styles.spinnerDot} />
          </Animated.View>
          <View style={styles.spinnerCenter}>
            <Text style={styles.spinnerEmoji}>✨</Text>
          </View>
        </Animated.View>

        {/* Loading message */}
        <Animated.Text style={[styles.loadingMessage, { opacity: fadeAnim }]}>
          {LOADING_MESSAGES[messageIndex]}
        </Animated.Text>

        <Text style={styles.subMessage}>
          Our AI is crafting your perfect pitch
        </Text>

        {/* Progress dots */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  opacity: spinAnim.interpolate({
                    inputRange: [
                      (i * 0.33) % 1,
                      ((i * 0.33 + 0.15) % 1),
                      ((i * 0.33 + 0.3) % 1),
                    ].sort((a, b) => a - b),
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  decorDot: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.1,
  },
  decorDot1: {
    width: 120,
    height: 120,
    backgroundColor: '#E63946',
    top: -40,
    right: -30,
  },
  decorDot2: {
    width: 80,
    height: 80,
    backgroundColor: '#FFB547',
    top: 60,
    left: -20,
  },
  decorDot3: {
    width: 60,
    height: 60,
    backgroundColor: '#007AFF',
    top: 30,
    right: 80,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  spinnerContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  spinnerRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#E63946',
    borderRightColor: '#E63946',
  },
  spinnerDot: {
    position: 'absolute',
    top: -4,
    right: 15,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E63946',
  },
  spinnerCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#142038',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerEmoji: {
    fontSize: 28,
  },
  loadingMessage: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  subMessage: {
    color: '#556677',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E63946',
  },
});

export default PitchGeneratingScreen;
