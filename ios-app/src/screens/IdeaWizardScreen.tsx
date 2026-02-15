import React, { useState, useRef } from 'react';
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
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WizardStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  question: string;
  aiCharacter: string;
  aiCharacterName: string;
  aiCharacterRole: string;
  placeholder: string;
  maxLength: number;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    stepNumber: 1,
    title: 'Your idea',
    subtitle: 'Step 1 of 4',
    question: 'What is your idea in one sentence?',
    aiCharacter: '🧑‍💼',
    aiCharacterName: 'The Business Leader',
    aiCharacterRole: 'Helps you articulate your vision clearly',
    placeholder: 'Describe your idea concisely...',
    maxLength: 250,
  },
  {
    stepNumber: 2,
    title: 'Your audience',
    subtitle: 'Step 2 of 4',
    question: 'Who would benefit from your idea?',
    aiCharacter: '🔮',
    aiCharacterName: 'The Visionary',
    aiCharacterRole: 'Helps you identify your target audience',
    placeholder: 'Describe the people who need this...',
    maxLength: 400,
  },
  {
    stepNumber: 3,
    title: 'Your markets',
    subtitle: 'Step 3 of 4',
    question: 'What challenges will be solved with your idea?',
    aiCharacter: '🔬',
    aiCharacterName: 'The Scientist',
    aiCharacterRole: 'Helps you define the problem space',
    placeholder: 'Describe the challenges you will solve...',
    maxLength: 400,
  },
  {
    stepNumber: 4,
    title: 'Your solution',
    subtitle: 'Step 4 of 4',
    question: 'How will you bring your idea to life?',
    aiCharacter: '💻',
    aiCharacterName: 'The Tech Ace',
    aiCharacterRole: 'Helps you plan the execution',
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
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const step = WIZARD_STEPS[currentStep];
  const currentAnswer = answers[currentStep];
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const animateTransition = (direction: 'forward' | 'back', callback: () => void) => {
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
  };

  const handleNext = () => {
    if (!currentAnswer.trim()) return;

    if (isLastStep) {
      // Navigate to pitch generation with all answers
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

  const progressWidth = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: `${progressWidth}%` }]}
          />
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>
            {isFirstStep ? '✕' : '←'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>{step.subtitle}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}>
          {/* Step title */}
          <Text style={styles.stepTitle}>{step.title}</Text>

          {/* AI Character */}
          <View style={styles.aiCharacterCard}>
            <View style={styles.aiCharacterAvatar}>
              <Text style={styles.aiCharacterEmoji}>{step.aiCharacter}</Text>
            </View>
            <View style={styles.aiCharacterInfo}>
              <Text style={styles.aiCharacterName}>{step.aiCharacterName}</Text>
              <Text style={styles.aiCharacterRole}>{step.aiCharacterRole}</Text>
            </View>
          </View>

          {/* Question */}
          <Text style={styles.question}>{step.question}</Text>

          {/* Text input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={currentAnswer}
              onChangeText={updateAnswer}
              placeholder={step.placeholder}
              placeholderTextColor="#999"
              multiline
              maxLength={step.maxLength}
              textAlignVertical="top"
              autoFocus
            />
            <Text style={styles.charCount}>
              {currentAnswer.length}/{step.maxLength}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !currentAnswer.trim() && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!currentAnswer.trim()}>
          <Text style={styles.nextButtonText}>
            {isLastStep ? 'Generate Pitch' : 'Next'}
          </Text>
          {!isLastStep && <Text style={styles.nextArrow}>→</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#1E2D45',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E63946',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
  },
  stepIndicator: {
    color: '#8899AA',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
  },
  aiCharacterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#142038',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#1E2D45',
  },
  aiCharacterAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E2D45',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  aiCharacterEmoji: {
    fontSize: 26,
  },
  aiCharacterInfo: {
    flex: 1,
  },
  aiCharacterName: {
    color: '#E63946',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  aiCharacterRole: {
    color: '#8899AA',
    fontSize: 13,
    lineHeight: 18,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
    lineHeight: 28,
  },
  inputContainer: {
    backgroundColor: '#142038',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E2D45',
    padding: 16,
    minHeight: 160,
  },
  textInput: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    padding: 0,
  },
  charCount: {
    color: '#556677',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
  },
  nextButton: {
    backgroundColor: '#E63946',
    borderRadius: 14,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#3A1520',
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  nextArrow: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default IdeaWizardScreen;
