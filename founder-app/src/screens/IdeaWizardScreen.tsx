import React, { useState, useRef, useCallback } from 'react';
import { Modal, Pressable } from 'react-native';
  const [showAgentModal, setShowAgentModal] = useState(false);
import { Alert, ActivityIndicator, Animated, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ideasAPI } from '../services/api';
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
const AGENT_COLORS = [
  '#D93B41', // Business Leader - red
  '#7B61FF', // Visionary - purple
  '#FFB300', // Problem Finder - gold
  '#00BFAE', // Tech Ace - teal
  '#FF6F61', // Designer - coral
  '#1E88E5', // Marketer - blue
  '#43A047', // Financier - green
  '#8D6E63', // Planner - brown
];
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
    sectionTitle: 'The problem',
    question: 'WHAT PROBLEM ARE YOU SOLVING?',
    aiCharacterEmoji: '🕵️‍♂️',
    aiCharacterName: 'The Problem Finder',
    aiCharacterQuote: "I help you dig deep to define the real pain point.",
    askButtonLabel: 'Ask the Problem Finder',
    placeholder: 'Describe the core problem...',
    maxLength: 400,
  },
  {
    stepNumber: 4,
    sectionTitle: 'Your solution',
    question: 'HOW WILL YOU SOLVE THIS PROBLEM?',
    aiCharacterEmoji: '💻',
    aiCharacterName: 'The Tech Ace',
    aiCharacterQuote: "As a techie, I can help you develop\na solution for your idea.",
    askButtonLabel: 'Ask the Tech Ace',
    placeholder: 'Describe your solution...',
    maxLength: 400,
  },
  {
    stepNumber: 5,
    sectionTitle: 'Design & Brand',
    question: 'WHAT WILL MAKE YOUR IDEA STAND OUT VISUALLY?',
    aiCharacterEmoji: '🎨',
    aiCharacterName: 'The Designer',
    aiCharacterQuote: "I help you craft a memorable look and feel.",
    askButtonLabel: 'Ask the Designer',
    placeholder: 'Describe your brand/design vision...',
    maxLength: 300,
  },
  {
    stepNumber: 6,
    sectionTitle: 'Go-to-Market',
    question: 'HOW WILL YOU REACH YOUR AUDIENCE?',
    aiCharacterEmoji: '📣',
    aiCharacterName: 'The Marketer',
    aiCharacterQuote: "Let me help you plan your launch and growth.",
    askButtonLabel: 'Ask the Marketer',
    placeholder: 'Describe your launch/marketing plan...',
    maxLength: 300,
  },
  {
    stepNumber: 7,
    sectionTitle: 'Business Model',
    question: 'HOW WILL YOU MAKE MONEY?',
    aiCharacterEmoji: '💰',
    aiCharacterName: 'The Financier',
    aiCharacterQuote: "I help you think through revenue and pricing.",
    askButtonLabel: 'Ask the Financier',
    placeholder: 'Describe your business model...',
    maxLength: 300,
  },
  {
    stepNumber: 8,
    sectionTitle: 'Roadmap',
    question: 'WHAT ARE YOUR NEXT STEPS?',
    aiCharacterEmoji: '🗺️',
    aiCharacterName: 'The Planner',
    aiCharacterQuote: "I help you map out your journey ahead.",
    askButtonLabel: 'Ask the Planner',
    placeholder: 'Describe your roadmap...',
    maxLength: 300,
  },
];

interface IdeaWizardScreenProps {
  navigation: any;
}

const IdeaWizardScreen: React.FC<IdeaWizardScreenProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(Array(WIZARD_STEPS.length).fill(''));
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
      // Pass all answers as an array for now; backend/types will need to support this
      navigation.replace('PitchGenerating', {
        wizardAnswers: answers,
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


  // Map each step to a backend AI service and prompt
  const AGENT_SERVICE_MAP = [
    { service: 'LLM_SUMMARY_IMPROVE', field: 'oneLineSummary' }, // Business Leader
    { service: 'LLM_PITCH_DRAFT', field: 'targetUser' },         // Visionary
    { service: 'LLM_PITCH_DRAFT', field: 'problem' },            // Problem Finder
    { service: 'LLM_PITCH_DRAFT', field: 'solution' },           // Tech Ace
    { service: 'LLM_PITCH_DRAFT', field: 'design' },             // Designer
    { service: 'LLM_PITCH_DRAFT', field: 'goToMarket' },         // Marketer
    { service: 'LLM_PITCH_DRAFT', field: 'businessModel' },      // Financier
    { service: 'LLM_ROADMAP_GENERATE', field: 'roadmap' },       // Planner
  ];

  const [isAgentLoading, setIsAgentLoading] = useState(false);

  const handleAskCharacter = async () => {
    setIsAgentLoading(true);
    try {
      // Compose a partial idea object for context
      const ideaObj: any = {
        oneLineSummary: answers[0],
        targetUser: answers[1],
        problem: answers[2],
        solution: answers[3],
        design: answers[4],
        goToMarket: answers[5],
        businessModel: answers[6],
        roadmap: answers[7],
        title: answers[0],
        category: 'Other',
        stage: 'Idea',
        differentiation: '',
        monetization: '',
      };
      const { service } = AGENT_SERVICE_MAP[currentStep];
      // Use the backend's AI tool endpoint (reuse generatePitch for now)
      // We'll call the backend with just this step's context
      const aiResponse = await ideasAPI.generateAgentSuggestion(service, ideaObj);
      if (aiResponse && aiResponse.text) {
        updateAnswer(aiResponse.text);
      } else {
        Alert.alert(step.aiCharacterName, 'No suggestion available.');
      }
    } catch (err) {
      Alert.alert(step.aiCharacterName, 'Failed to get suggestion.');
    } finally {
      setIsAgentLoading(false);
    }
  };

  const handleRephrase = async () => {
    if (!currentAnswer.trim()) return;
    setIsRephrasing(true);
    try {
      // Compose a partial idea object for context
      const ideaObj: any = {
        oneLineSummary: answers[0],
        targetUser: answers[1],
        problem: answers[2],
        solution: answers[3],
        design: answers[4],
        goToMarket: answers[5],
        businessModel: answers[6],
        roadmap: answers[7],
        title: answers[0],
        category: 'Other',
        stage: 'Idea',
        differentiation: '',
        monetization: '',
      };
      const { service } = AGENT_SERVICE_MAP[currentStep];
      // Use the backend's AI tool endpoint for rephrasing
      const aiResponse = await ideasAPI.generateAgentSuggestion(service, ideaObj, currentAnswer);
      if (aiResponse && aiResponse.text) {
        updateAnswer(aiResponse.text);
      } else {
        Alert.alert('Rephrase', 'No rephrased suggestion available.');
      }
    } catch (err) {
      Alert.alert('Rephrase', 'Failed to rephrase.');
    } finally {
      setIsRephrasing(false);
    }
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

          {/* AI Character section - enhanced visuals */}
          <View style={styles.characterSection}>
            <Pressable onPress={() => setShowAgentModal(true)}>
              <View style={[styles.characterAvatar, { borderColor: AGENT_COLORS[currentStep], borderWidth: 4, shadowColor: AGENT_COLORS[currentStep], shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 }]}> 
                <Text style={styles.characterEmoji}>{step.aiCharacterEmoji}</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => setShowAgentModal(true)}>
              <Text style={[styles.characterName, { color: AGENT_COLORS[currentStep], fontSize: 20, marginBottom: 2 }]}>{step.aiCharacterName}</Text>
              <Text style={[styles.characterRole, { color: AGENT_COLORS[currentStep] }]}>AI Agent</Text>
            </Pressable>
            <Text style={styles.characterQuote}>{step.aiCharacterQuote}</Text>
          </View>

          {/* Agent Persona Modal */}
          <Modal
            visible={showAgentModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAgentModal(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setShowAgentModal(false)}>
              <View style={[styles.agentModal, { borderColor: AGENT_COLORS[currentStep] }]}> 
                <Text style={[styles.characterEmoji, { fontSize: 60, marginBottom: 8 }]}>{step.aiCharacterEmoji}</Text>
                <Text style={[styles.characterName, { color: AGENT_COLORS[currentStep], fontSize: 22, marginBottom: 2 }]}>{step.aiCharacterName}</Text>
                <Text style={[styles.characterRole, { color: AGENT_COLORS[currentStep], marginBottom: 8 }]}>AI Agent</Text>
                <Text style={styles.agentModalQuote}>{step.aiCharacterQuote}</Text>
                <Text style={styles.agentModalTip}>Tap the agent for help or rephrasing at this step.</Text>
                <TouchableOpacity style={[styles.agentModalCloseBtn, { borderColor: AGENT_COLORS[currentStep] }]} onPress={() => setShowAgentModal(false)}>
                  <Text style={[styles.agentModalCloseText, { color: AGENT_COLORS[currentStep] }]}>Close</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentModal: {
    width: 320,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: 'center',
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  agentModalQuote: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  agentModalTip: {
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 18,
    fontStyle: 'italic',
  },
  agentModalCloseBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginTop: 4,
  },
  agentModalCloseText: {
    fontSize: 15,
    fontWeight: '600',
  },

          {/* Form panel */}
          <View style={[styles.formPanel, { borderLeftWidth: 8, borderLeftColor: AGENT_COLORS[currentStep], backgroundColor: '#F8FAFF' }]}> 
            {/* Step indicator */}
            <Text style={[styles.stepIndicator, { color: AGENT_COLORS[currentStep] }]}> 
              Step {step.stepNumber} of 8{'  '}/ {'  '}
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
              <TouchableOpacity style={styles.helperBtn} onPress={handleAskCharacter} disabled={isAgentLoading}>
                {isAgentLoading ? (
                  <ActivityIndicator size="small" color={COLORS.textSecondary} />
                ) : (
                  <Text style={styles.helperBtnText}>{step.askButtonLabel}</Text>
                )}
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
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.charBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 0,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
    characterRole: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 4,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
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
