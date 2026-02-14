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
  Image,
  ScrollView,
} from 'react-native';
import { reviewAPI, creditsAPI } from '../services/api';
import { Idea } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.6;

const PaperTossScreen: React.FC = () => {
  const [currentIdea, setCurrentIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(0);

  const pan = useRef(new Animated.ValueXY()).current;
  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  useEffect(() => {
    loadNextIdea();
  }, []);

  const loadNextIdea = async () => {
    setLoading(true);
    try {
      const response = await reviewAPI.getNext();
      setCurrentIdea(response.idea);
    } catch (error) {
      Alert.alert('Error', 'Failed to load idea');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!currentIdea) return;

    try {
      await reviewAPI.rejectIdea(currentIdea._id);
      resetCardPosition();
      loadNextIdea();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject idea');
    }
  };

  const handleSave = async () => {
    if (!currentIdea) return;

    try {
      await reviewAPI.saveIdea(currentIdea._id);
      setShowCreditModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to save idea');
    }
  };

  const handleCreditAllocation = async () => {
    if (selectedAmount > 0 && currentIdea) {
      try {
        await creditsAPI.invest(currentIdea._id, selectedAmount);
        Alert.alert('Success', `Allocated ${selectedAmount} credits!`);
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.error || 'Failed to allocate credits');
      }
    }
    setShowCreditModal(false);
    resetCardPosition();
    loadNextIdea();
  };

  const resetCardPosition = () => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        const { dx, dy, vy } = gestureState;

        // Reject: Swipe down with velocity
        if (dy > 100 && vy > 0.5) {
          Animated.timing(pan, {
            toValue: { x: dx, y: SCREEN_HEIGHT },
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            handleReject();
          });
        }
        // Save: Swipe right
        else if (dx > 120) {
          Animated.timing(pan, {
            toValue: { x: SCREEN_WIDTH, y: dy },
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            handleSave();
          });
        }
        // Snap back
        else {
          resetCardPosition();
        }
      },
    })
  ).current;

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!currentIdea) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No more ideas to review!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Trash bin indicator */}
      <View style={styles.trashBin}>
        <Text style={styles.trashIcon}>🗑️</Text>
        <Text style={styles.trashText}>Swipe down to reject</Text>
      </View>

      {/* Saved tray indicator */}
      <View style={styles.savedTray}>
        <Text style={styles.savedIcon}>📥</Text>
        <Text style={styles.savedText}>Swipe right to save</Text>
      </View>

      {/* Paper card */}
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { rotate },
            ],
          },
        ]}
        {...panResponder.panHandlers}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => setShowDetails(true)}
          activeOpacity={0.9}>
          <Text style={styles.category}>{currentIdea.category}</Text>
          <Text style={styles.title}>{currentIdea.title}</Text>
          <Text style={styles.summary}>{currentIdea.oneLineSummary}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{currentIdea.stage}</Text>
          </View>
          <Text style={styles.tapHint}>Tap for details</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Idea Details Modal */}
      <Modal
        visible={showDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetails(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Idea Details</Text>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.detailTitle}>{currentIdea.title}</Text>
            <Text style={styles.detailSummary}>{currentIdea.oneLineSummary}</Text>

            <Text style={styles.sectionTitle}>Problem</Text>
            <Text style={styles.sectionText}>{currentIdea.problem}</Text>

            <Text style={styles.sectionTitle}>Solution</Text>
            <Text style={styles.sectionText}>{currentIdea.solution}</Text>

            <Text style={styles.sectionTitle}>Target User</Text>
            <Text style={styles.sectionText}>{currentIdea.targetUser}</Text>

            <Text style={styles.sectionTitle}>Differentiation</Text>
            <Text style={styles.sectionText}>{currentIdea.differentiation}</Text>

            <Text style={styles.sectionTitle}>Monetization</Text>
            <Text style={styles.sectionText}>{currentIdea.monetization}</Text>

            <Text style={styles.sectionTitle}>Roadmap</Text>
            <Text style={styles.sectionText}>{currentIdea.roadmap}</Text>
          </ScrollView>
        </View>
      </Modal>

      {/* Credit Allocation Modal */}
      <Modal
        visible={showCreditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreditModal(false)}>
        <View style={styles.creditModalOverlay}>
          <View style={styles.creditModalContainer}>
            <Text style={styles.creditModalTitle}>Allocate AI Credits</Text>
            <Text style={styles.creditModalText}>
              How many AI credits would you like to invest in this idea?
            </Text>
            <View style={styles.creditOptions}>
              {[25, 50, 100, 200].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.creditOption,
                    selectedAmount === amount && styles.creditOptionSelected,
                  ]}
                  onPress={() => setSelectedAmount(amount)}>
                  <Text
                    style={[
                      styles.creditOptionText,
                      selectedAmount === amount && styles.creditOptionTextSelected,
                    ]}>
                    {amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.creditButton}
              onPress={handleCreditAllocation}>
              <Text style={styles.creditButtonText}>
                {selectedAmount > 0 ? `Invest ${selectedAmount} Credits` : 'Skip'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  trashBin: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  trashIcon: {
    fontSize: 40,
  },
  trashText: {
    marginTop: 5,
    color: '#666',
    fontSize: 12,
  },
  savedTray: {
    position: 'absolute',
    right: 20,
    top: SCREEN_HEIGHT / 2 - 50,
    alignItems: 'center',
  },
  savedIcon: {
    fontSize: 40,
  },
  savedText: {
    marginTop: 5,
    color: '#666',
    fontSize: 12,
    width: 80,
    textAlign: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
  },
  category: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  summary: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  badge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tapHint: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    color: '#999',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailSummary: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
    color: '#333',
  },
  sectionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  creditModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditModalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
  },
  creditModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  creditModalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  creditOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  creditOption: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
    alignItems: 'center',
    marginBottom: 10,
  },
  creditOptionSelected: {
    backgroundColor: '#007AFF',
  },
  creditOptionText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  creditOptionTextSelected: {
    color: '#fff',
  },
  creditButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  creditButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaperTossScreen;
