import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Red Bull Basement–inspired light theme ─────────────
const COLORS = {
  bg: '#F5F5F0',          // warm off-white
  formBg: '#E8EDF4',      // light blue-grey form panel
  white: '#FFFFFF',
  text: '#1A2332',         // near-black
  textSecondary: '#5A6577',
  accent: '#D93B41',       // Red Bull red CTA
  accentLight: '#FDE8E9',
  border: '#D5DAE2',
  charBg: '#EEF1F6',
  skyline: '#C8CDD6',
};

interface WizardStep {
  stepNumber: number;
  sectionTitle: string;         // "Your idea", "Your audience", etc.
  question: string;             // Bold uppercase question
  aiCharacterEmoji: string;     // Fallback emoji for the character
  aiCharacterName: string;      // "The Visionary", etc.
  aiCharacterQuote: string;     // First-person personality line
  askButtonLabel: string;       // "Ask the Visionary", etc.
  placeholder: string;
  maxLength: number;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    stepNumber: 1,
    sectionTitle: 'Your idea',
    question: 'WHAT IS YOUR IDEA IN ONE SENTENCE?',
    aiCharacterEmoji: '🧑‍💼',
    aiCharacterName: 'The Business Leader',
    aiCharacterQuote: "I lead with strategy.\nLet me help you articulate your vision.",
    askButtonLabel: 'Ask the Business Leader',
    placeholder: 'Describe your idea concisely...',
    maxLength: 250,
  },
  {
    stepNumber: 2,
    sectionTitle: 'Your audience',
    question: 'WHO WOULD BENEFIT FROM YOUR IDEA?',
    aiCharacterEmoji: '🔮',
    aiCharacterName: 'The Visionary',
    aiCharacterQuote: "I'm the connector, I can guide\nyou to the best audience for your idea.",
    askButtonLabel: 'Ask the Visionary',
    placeholder: 'Describe the people who need this...',
    maxLength: 400,
  },
  {
    stepNumber: 3,
    sectionTitle: 'Your markets',
    question: 'WHAT CHALLENGES WILL BE SOLVED WITH YOUR IDEA?',
    aiCharacterEmoji: '🔬',
    aiCharacterName: 'The Scientist',
    aiCharacterQuote: "Everyone needs science, I'm here to help\nyou identify the best markets for your idea.",
    askButtonLabel: 'Ask the Scientist',
    placeholder: 'Describe the challenges you will solve...',
    maxLength: 400,
  },
  {
    stepNumber: 4,
    sectionTitle: 'Your solution',
    question: 'HOW WILL YOU BRING YOUR IDEA TO LIFE?',
    aiCharacterEmoji: '💻',
    aiCharacterName: 'The Tech Ace',
    aiCharacterQuote: "As a techie, I can help you develop\na solution for your idea.",
    askButtonLabel: 'Ask the Tech Ace',
    placeholder: 'Describe how you will build this...',
    maxLength: 400,
  },
];

interface IdeaWizardScreenProps {
  navigation: any;
}

const IdeaWizardScreen: React.FC<IdeaWizardScreenProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(['', '', '', '']);
  const [isRephrasing, setIsRephrasing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const step = WIZARD_STEPS[currentStep];
  const currentAnswer = answers[currentStep];
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const animateTransition = useCallback(
    (direction: 'forward' | 'back', callback: () => void) => {
      const toValue = direction === 'forward' ? -SCREEN_WIDTH : SCREEN_WIDTH;

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        callback();
        slideAnim.setValue(direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [fadeAnim, slideAnim],
  );

  const handleNext = () => {
    if (!currentAnswer.trim()) return;

    if (isLastStep) {
      navigation.replace('PitchGenerating', {
        wizardAnswers: {
          step1: answers[0],
          step2: answers[1],
          step3: answers[2],
          step4: answers[3],
        },
      });
      return;
    }

    animateTransition('forward', () => {
      setCurrentStep((prev) => prev + 1);
    });
  };

  const handleBack = () => {
    if (isFirstStep) {
      navigation.goBack();
      return;
    }
    animateTransition('back', () => {
      setCurrentStep((prev) => prev - 1);
    });
  };

  const updateAnswer = (text: string) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = text;
    setAnswers(newAnswers);
  };

  const handleAskCharacter = () => {
    Alert.alert(
      step.aiCharacterName,
      `Need help? ${step.aiCharacterName} suggests: Think about what makes your answer unique and specific. Avoid generic statements.`,
    );
  };

  const handleRephrase = async () => {
    if (!currentAnswer.trim()) return;
    setIsRephrasing(true);
    // Simulate AI rephrase (placeholder — will use real AI endpoint)
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));
    // Simple placeholder rephrase
    const rephrased = currentAnswer.charAt(0).toUpperCase() + currentAnswer.slice(1).trim();
    updateAnswer(rephrased);
    setIsRephrasing(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Top bar: close + info */}
      <View style={styles.topBar}>
        <View style={{ width: 36 }} />
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.topIconBtn} onPress={() => Alert.alert('Info', 'Answer 4 questions and our AI will craft your pitch.')}>
          <Text style={styles.topIconText}>ⓘ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topIconBtn} onPress={handleBack}>
          <Text style={styles.topIconText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <Animated.View
          style={[
            styles.animatedWrap,
            { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
          ]}>
          {/* AI Character section */}
          <View style={styles.characterSection}>
            <View style={styles.characterAvatar}>
              <Text style={styles.characterEmoji}>{step.aiCharacterEmoji}</Text>
            </View>
            <Text style={styles.characterName}>{step.aiCharacterName}</Text>
            <Text style={styles.characterQuote}>{step.aiCharacterQuote}</Text>
          </View>

          {/* Form panel */}
          <View style={styles.formPanel}>
            {/* Step indicator */}
            <Text style={styles.stepIndicator}>
              Step {step.stepNumber} out of 4{'  '}/ {'  '}
              <Text style={styles.stepIndicatorBold}>{step.sectionTitle}</Text>
            </Text>

            {/* Question */}
            <Text style={styles.question}>{step.question}</Text>

            {/* Text input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={currentAnswer}
                onChangeText={updateAnswer}
                placeholder={step.placeholder}
                placeholderTextColor="#A0A8B5"
                multiline
                maxLength={step.maxLength}
                textAlignVertical="top"
              />
            </View>
            <Text style={styles.charCount}>
              {currentAnswer.length}/{step.maxLength}
            </Text>

            {/* AI helper buttons */}
            <View style={styles.helperRow}>
              <TouchableOpacity style={styles.helperBtn} onPress={handleAskCharacter}>
                <Text style={styles.helperBtnText}>{step.askButtonLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.helperBtn}
                onPress={handleRephrase}
                disabled={isRephrasing || !currentAnswer.trim()}>
                {isRephrasing ? (
                  <ActivityIndicator size="small" color={COLORS.textSecondary} />
                ) : (
                  <Text style={styles.helperBtnText}>Rephrase my text</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* City skyline decoration */}
        <View style={styles.skylineRow}>
          <Text style={styles.skylineText}>🏙️</Text>
        </View>
      </ScrollView>

      {/* Bottom navigation */}
      <View style={styles.bottomBar}>
        {!isFirstStep && (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[
            styles.nextBtn,
            !currentAnswer.trim() && styles.nextBtnDisabled,
          ]}
          onPress={handleNext}
          disabled={!currentAnswer.trim()}>
          <Text style={styles.nextBtnText}>
            {isLastStep ? 'Generate Pitch' : 'Move to the next step'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 4,
    gap: 8,
  },
  topIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E8ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topIconText: {
    fontSize: 18,
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  animatedWrap: {
    flex: 1,
  },

  // ─── Character ─────────────────────────
  characterSection: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
  },
  characterAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.charBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  characterEmoji: {
    fontSize: 48,
  },
  characterName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  characterQuote: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },

  // ─── Form panel ────────────────────────
  formPanel: {
    backgroundColor: COLORS.formBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  stepIndicator: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  stepIndicatorBold: {
    fontWeight: '700',
    color: COLORS.text,
  },
  question: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 18,
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  inputContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    minHeight: 110,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInput: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
    padding: 0,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 6,
  },

  // ─── AI helper buttons ─────────────────
  helperRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  helperBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
  },
  helperBtnText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // ─── Skyline decoration ────────────────
  skylineRow: {
    alignItems: 'center',
    paddingVertical: 4,
    opacity: 0.25,
  },
  skylineText: {
    fontSize: 40,
    letterSpacing: 8,
  },

  // ─── Bottom bar ────────────────────────
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: '#E5E8ED',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  backBtnText: {
    fontSize: 20,
    color: COLORS.text,
  },
  nextBtn: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default IdeaWizardScreen;
