import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  Share,
  ActivityIndicator,
} from 'react-native';
import { ideasAPI } from '../services/api';
import { GeneratedPitch } from '../types';

// ─── Red Bull Basement light theme ──────────────────────
const COLORS = {
  bg: '#F5F5F0',
  cardBg: '#FFFFFF',
  formBg: '#E8EDF4',
  text: '#1A2332',
  textSecondary: '#5A6577',
  accent: '#D93B41',
  border: '#E0E4EB',
  imageBg: '#D8DDE6',
  link: '#3478F6',
};

interface PitchSummaryScreenProps {
  route: any;
  navigation: any;
}

interface PitchCard {
  key: keyof GeneratedPitch;
  label: string;
  icon: string;
}

const PITCH_CARDS: PitchCard[] = [
  { key: 'pitchIdea', label: 'The Idea', icon: '💡', agent: { name: 'Business Leader', emoji: '🧑‍💼', color: '#FDE8E9' } },
  { key: 'pitchTarget', label: 'The Target', icon: '🎯', agent: { name: 'Visionary', emoji: '🔮', color: '#E8F4F8' } },
  { key: 'pitchSolves', label: 'What it Solves', icon: '🔧', agent: { name: 'Problem Finder', emoji: '🕵️‍♂️', color: '#FFF7E0' } },
  { key: 'pitchHow', label: 'How it Works', icon: '⚙️', agent: { name: 'Tech Ace', emoji: '💻', color: '#E8EDF4' } },
  { key: 'pitchDesign', label: 'Design & Brand', icon: '🎨', agent: { name: 'Designer', emoji: '🎨', color: '#F3E8F4' } },
  { key: 'pitchGoToMarket', label: 'Go-to-Market', icon: '📣', agent: { name: 'Marketer', emoji: '📣', color: '#E8F8F4' } },
  { key: 'pitchBusinessModel', label: 'Business Model', icon: '💰', agent: { name: 'Financier', emoji: '💰', color: '#F4F8E8' } },
  { key: 'pitchRoadmap', label: 'Roadmap', icon: '🗺️', agent: { name: 'Planner', emoji: '🗺️', color: '#F8F4E8' } },
];

const PitchSummaryScreen: React.FC<PitchSummaryScreenProps> = ({
  route,
  navigation,
}) => {
  const { ideaId, pitch, error: initialError } = route.params as {
    ideaId: string | null;
    pitch: GeneratedPitch;
    error?: string;
  };

  const [pitchTitle, setPitchTitle] = useState(pitch.pitchTitle || 'My Idea');
  const [pitchData, setPitchData] = useState<GeneratedPitch>(pitch);
  const [editingCard, setEditingCard] = useState<keyof GeneratedPitch | null>(
    null,
  );
  const [editText, setEditText] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [pitchImageUrl, setPitchImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialError) {
      Alert.alert('Notice', initialError);
    }
  }, [initialError]);

  const handleEditCard = (cardKey: keyof GeneratedPitch) => {
    setEditingCard(cardKey);
    setEditText(pitchData[cardKey]);
  };

  const handleSaveCard = () => {
    if (!editingCard) return;
    setPitchData((prev) => ({
      ...prev,
      [editingCard]: editText,
    }));
    setEditingCard(null);
    setEditText('');
  };

  const handleShare = async () => {
    const shareText =
      `${pitchTitle}\n\n` +
      `💡 The Idea: ${pitchData.pitchIdea}\n\n` +
      `🎯 The Target: ${pitchData.pitchTarget}\n\n` +
      `🔧 What it Solves: ${pitchData.pitchSolves}\n\n` +
      `⚙️ How it Works: ${pitchData.pitchHow}`;

    try {
      await Share.share({ message: shareText, title: pitchTitle });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleGenerateImage = async () => {
    setImageGenerating(true);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 2000));
      setPitchImageUrl('generated');
      Alert.alert('Image Generated', 'Your pitch card image has been created!');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate image. Try again later.');
    } finally {
      setImageGenerating(false);
    }
  };

  const handleFinalize = async () => {
    if (!ideaId) {
      Alert.alert(
        'Error',
        'No idea ID found. Please try creating your idea again.',
      );
      navigation.popToTop();
      return;
    }

    setFinalizing(true);
    try {
      await ideasAPI.finalizePitch(ideaId, {
        ...pitchData,
        pitchTitle,
      });

      Alert.alert(
        'Pitch Submitted! 🎉',
        'Your idea has been submitted for review. Investors will be able to see it soon!',
        [
          {
            text: 'View My Ideas',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'FounderHome' }],
              });
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to submit pitch',
      );
    } finally {
      setFinalizing(false);
    }
  };

  const getCardForEdit = () => {
    if (!editingCard) return null;
    return PITCH_CARDS.find((c) => c.key === editingCard);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {/* ─── Top bar ──────────────────────── */}
        <View style={styles.topBar}>
          <Text style={styles.logo}>📄 BuildPaper</Text>
        </View>

        {/* ─── Header ─────────────────────── */}
        <Text style={styles.heading}>Pitch Summary</Text>
        <Text style={styles.subheading}>
          Here's your AI-generated pitch. Tap any card to edit it.
        </Text>

        {/* ─── Image section ──────────────── */}
        <View style={styles.imageSection}>
          {pitchImageUrl ? (
            <View style={styles.imageContainer}>
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imageEmoji}>🖼️</Text>
                <Text style={styles.imageLabel}>Pitch card generated</Text>
              </View>
            </View>
          ) : (
            <View style={styles.imageContainer}>
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imageEmoji}>🎨</Text>
                <Text style={styles.imageLabel}>AI-generated image</Text>
              </View>
            </View>
          )}

          {/* Image action buttons */}
          <View style={styles.imageActions}>
            <TouchableOpacity
              style={styles.imageActionBtn}
              onPress={handleShare}>
              <Text style={styles.imageActionIcon}>↗</Text>
              <Text style={styles.imageActionText}>Share your card</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageActionBtn}
              onPress={() => Alert.alert('PDF', 'Download coming soon')}>
              <Text style={styles.imageActionIcon}>⬇</Text>
              <Text style={styles.imageActionText}>Download PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageActionBtn}
              onPress={handleGenerateImage}
              disabled={imageGenerating}>
              {imageGenerating ? (
                <ActivityIndicator size="small" color={COLORS.textSecondary} />
              ) : (
                <>
                  <Text style={styles.imageActionIcon}>🔄</Text>
                  <Text style={styles.imageActionText}>Regenerate image</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Pitch Title (editable) ────── */}
        <View style={styles.titleSection}>
          {editingTitle ? (
            <View style={styles.titleEditRow}>
              <TextInput
                style={styles.titleInput}
                value={pitchTitle}
                onChangeText={setPitchTitle}
                maxLength={80}
                autoFocus
                onBlur={() => setEditingTitle(false)}
                onSubmitEditing={() => setEditingTitle(false)}
              />
              <TouchableOpacity
                style={styles.titleSaveBtn}
                onPress={() => setEditingTitle(false)}>
                <Text style={styles.titleSaveBtnText}>✓</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.titleDisplay}
              onPress={() => setEditingTitle(true)}>
              <Text style={styles.pitchTitle}>{pitchTitle}</Text>
              <Text style={styles.editPencil}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Pitch Cards ───────────────── */}
        {PITCH_CARDS.map((card) => (
          <View key={card.key} style={[styles.pitchCard, { borderLeftWidth: 6, borderLeftColor: card.agent?.color || COLORS.accent }]}> 
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardIcon}>{card.icon}</Text>
                <Text style={styles.cardLabel}>{card.label}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleEditCard(card.key)}
                style={styles.editBtn}>
                <Text style={styles.editBtnText}>✏️ Edit</Text>
              </TouchableOpacity>
            </View>
            {/* Agent cue */}
            {card.agent && (
              <View style={[styles.agentCue, { backgroundColor: card.agent.color }]}> 
                <Text style={styles.agentEmoji}>{card.agent.emoji}</Text>
                <Text style={styles.agentName}>{card.agent.name}</Text>
              </View>
            )}
            <Text style={styles.cardContent}>{pitchData[card.key]}</Text>
          </View>
        ))}
  agentCue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  agentEmoji: {
    fontSize: 18,
  },
  agentName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

        {/* Bottom spacer */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ─── Fixed bottom: Final Step ───── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.finalizeButton,
            finalizing && styles.finalizeDisabled,
          ]}
          onPress={handleFinalize}
          disabled={finalizing}>
          {finalizing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.finalizeText}>Final step</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ─── Edit Modal ─────────────────── */}
      <Modal
        visible={editingCard !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingCard(null)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditingCard(null)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {getCardForEdit()?.icon} Edit {getCardForEdit()?.label}
            </Text>
            <TouchableOpacity onPress={handleSaveCard}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <TextInput
              style={styles.modalInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              placeholder={`Enter ${getCardForEdit()?.label?.toLowerCase()}...`}
              placeholderTextColor="#999"
              autoFocus
              textAlignVertical="top"
            />
            <Text style={styles.modalCharCount}>
              {editText.length} characters
            </Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
  },

  // ─── Top bar ──────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },

  // ─── Header ───────────────────────────
  heading: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },

  // ─── Image section ────────────────────
  imageSection: {
    marginBottom: 24,
  },
  imageContainer: {
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.imageBg,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageEmoji: {
    fontSize: 44,
    marginBottom: 6,
  },
  imageLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  imageActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageActionIcon: {
    fontSize: 14,
  },
  imageActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },

  // ─── Title ────────────────────────────
  titleSection: {
    marginBottom: 20,
  },
  titleDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pitchTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  editPencil: {
    fontSize: 16,
  },
  titleEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
    paddingBottom: 6,
  },
  titleSaveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSaveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // ─── Pitch Cards ──────────────────────
  pitchCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardIcon: {
    fontSize: 16,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.formBg,
  },
  editBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },

  // ─── Bottom bar ───────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  finalizeButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finalizeDisabled: {
    opacity: 0.6,
  },
  finalizeText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },

  // ─── Modal (light theme) ──────────────
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCancel: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
  },
  modalSave: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  modalInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 23,
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCharCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
});

export default PitchSummaryScreen;
