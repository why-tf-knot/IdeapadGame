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
  { key: 'pitchIdea', label: 'The Idea', icon: '💡' },
  { key: 'pitchTarget', label: 'The Target', icon: '🎯' },
  { key: 'pitchSolves', label: 'What it Solves', icon: '🔧' },
  { key: 'pitchHow', label: 'How it Works', icon: '⚙️' },
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
  const [editingCard, setEditingCard] = useState<keyof GeneratedPitch | null>(null);
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
    const shareText = `${pitchTitle}\n\n` +
      `💡 The Idea: ${pitchData.pitchIdea}\n\n` +
      `🎯 The Target: ${pitchData.pitchTarget}\n\n` +
      `🔧 What it Solves: ${pitchData.pitchSolves}\n\n` +
      `⚙️ How it Works: ${pitchData.pitchHow}`;

    try {
      await Share.share({
        message: shareText,
        title: pitchTitle,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleGenerateImage = async () => {
    setImageGenerating(true);
    try {
      // Simulate image generation (placeholder)
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
      Alert.alert('Error', 'No idea ID found. Please try creating your idea again.');
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
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit pitch');
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.wellDone}>Well done! 🎉</Text>
          <Text style={styles.headerSubtext}>
            Here's your AI-generated pitch. Edit any section to make it perfect.
          </Text>
        </View>

        {/* Pitch Title (editable) */}
        <View style={styles.titleSection}>
          {editingTitle ? (
            <View style={styles.titleEditContainer}>
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
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Pitch Cards */}
        {PITCH_CARDS.map((card) => (
          <View key={card.key} style={styles.pitchCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardIcon}>{card.icon}</Text>
                <Text style={styles.cardLabel}>{card.label}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleEditCard(card.key)}
                style={styles.editButton}>
                <Text style={styles.editButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardContent}>{pitchData[card.key]}</Text>
          </View>
        ))}

        {/* Pitch Card Image Section */}
        <View style={styles.imageSection}>
          <Text style={styles.imageSectionTitle}>Pitch Card Image</Text>
          {pitchImageUrl ? (
            <View style={styles.imagePreview}>
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderEmoji}>🖼️</Text>
                <Text style={styles.imagePlaceholderText}>
                  Pitch card generated
                </Text>
              </View>
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={handleGenerateImage}
                disabled={imageGenerating}>
                <Text style={styles.regenerateButtonText}>
                  {imageGenerating ? 'Regenerating...' : '🔄 Regenerate image'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageActions}>
              <TouchableOpacity
                style={styles.generateImageBtn}
                onPress={handleGenerateImage}
                disabled={imageGenerating}>
                {imageGenerating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.generateImageBtnText}>
                    ✨ Generate pitch card image
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.skipImageBtn}
                onPress={() => setPitchImageUrl('skipped')}>
                <Text style={styles.skipImageBtnText}>Skip generate image</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareButtonText}>Share your card ↗</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spacer */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed bottom: Final Step button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.finalizeButton, finalizing && styles.finalizeButtonDisabled]}
          onPress={handleFinalize}
          disabled={finalizing}>
          {finalizing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.finalizeButtonText}>Final step</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
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

          <View style={styles.modalContent}>
            <TextInput
              style={styles.modalTextInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              placeholder={`Enter ${getCardForEdit()?.label?.toLowerCase()}...`}
              placeholderTextColor="#666"
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
    backgroundColor: '#0A1628',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  header: {
    marginBottom: 28,
  },
  wellDone: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtext: {
    fontSize: 15,
    color: '#8899AA',
    lineHeight: 22,
  },
  titleSection: {
    marginBottom: 24,
  },
  titleDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pitchTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  editIcon: {
    fontSize: 18,
  },
  titleEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#E63946',
    paddingBottom: 8,
  },
  titleSaveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E63946',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSaveBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  pitchCard: {
    backgroundColor: '#142038',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E2D45',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E2D45',
  },
  editButtonText: {
    color: '#8899AA',
    fontSize: 13,
    fontWeight: '600',
  },
  cardContent: {
    color: '#C0CCD8',
    fontSize: 15,
    lineHeight: 22,
  },
  imageSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  imageSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  imagePreview: {
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#142038',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E2D45',
    marginBottom: 12,
  },
  imagePlaceholderEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagePlaceholderText: {
    color: '#8899AA',
    fontSize: 14,
  },
  regenerateButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#1E2D45',
  },
  regenerateButtonText: {
    color: '#8899AA',
    fontSize: 14,
    fontWeight: '600',
  },
  imageActions: {
    gap: 12,
  },
  generateImageBtn: {
    backgroundColor: '#1E2D45',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3D55',
  },
  generateImageBtnText: {
    color: '#FFB547',
    fontSize: 16,
    fontWeight: '600',
  },
  skipImageBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  skipImageBtnText: {
    color: '#556677',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  actionButtons: {
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#142038',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E2D45',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A1628',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: '#1E2D45',
  },
  finalizeButton: {
    backgroundColor: '#E63946',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  finalizeButtonDisabled: {
    opacity: 0.6,
  },
  finalizeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2D45',
  },
  modalCancel: {
    color: '#8899AA',
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalSave: {
    color: '#E63946',
    fontSize: 16,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalTextInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    padding: 16,
    backgroundColor: '#142038',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E2D45',
  },
  modalCharCount: {
    color: '#556677',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
});

export default PitchSummaryScreen;
