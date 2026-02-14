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
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { reviewAPI, creditsAPI } from '../services/api';
import { Idea } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.6;

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const PaperTossScreen: React.FC = () => {
  const [currentIdea, setCurrentIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  
  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  useEffect(() => {
    loadNextIdea();
  }, []);

  const loadNextIdea = async () => {
    setLoading(true);
    setIsAnimating(false);
    
    // Reset animations
    pan.setValue({ x: 0, y: 0 });
    scale.setValue(1);
    opacity.setValue(1);
    
    try {
      const response = await reviewAPI.getNext();
      setCurrentIdea(response.idea);
      
      // Entrance animation
      if (response.idea) {
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load idea');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!currentIdea || isAnimating) return;

    setIsAnimating(true);
    
    // Haptic feedback for rejection
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
    
    // Haptic feedback for saving
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
        await creditsAPI.invest(currentIdea._id, selectedAmount);
        ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
        Alert.alert('Success', `Allocated ${selectedAmount} credits!`);
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
        friction: 7,
        tension: 40,
        useNativeDriver: false,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimating,
      onPanResponderGrant: () => {
        // Light haptic on touch
        ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
        
        // Slight scale down when grabbed
        Animated.spring(scale, {
          toValue: 0.95,
          friction: 7,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        const { dx, dy, vy, vx } = gestureState;

        // Restore scale
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        }).start();

        // Reject: Swipe down with velocity
        if (dy > 120 && vy > 0.7) {
          // Crumple effect - shrink and fade
          Animated.parallel([
            Animated.timing(pan, {
              toValue: { x: dx, y: SCREEN_HEIGHT + 100 },
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(scale, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            handleReject();
          });
        }
        // Save: Swipe right with velocity
        else if (dx > 150 || (dx > 100 && vx > 0.7)) {
          // Flying paper effect
          Animated.parallel([
            Animated.timing(pan, {
              toValue: { x: SCREEN_WIDTH + 100, y: dy - 50 },
              duration: 400,
              useNativeDriver: false,
            }),
            Animated.timing(scale, {
              toValue: 0.8,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.5,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start(() => {
            handleSave();
          });
        }
        // Snap back
        else {
          ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
          resetCardPosition();
        }
      },
    })
  ).current;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading next idea...</Text>
      </View>
    );
  }

  if (!currentIdea) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyIcon}>🎉</Text>
        <Text style={styles.emptyText}>No more ideas to review!</Text>
        <Text style={styles.emptySubtext}>Check back later for new submissions</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Trash bin indicator */}
      <Animated.View
        style={[
          styles.trashBin,
          {
            opacity: pan.y.interpolate({
              inputRange: [0, 120],
              outputRange: [0.3, 1],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                scale: pan.y.interpolate({
                  inputRange: [0, 120],
                  outputRange: [1, 1.2],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}>
        <Text style={styles.trashIcon}>🗑️</Text>
        <Text style={styles.trashText}>Swipe down to reject</Text>
      </Animated.View>

      {/* Saved tray indicator */}
      <Animated.View
        style={[
          styles.savedTray,
          {
            opacity: pan.x.interpolate({
              inputRange: [0, 150],
              outputRange: [0.3, 1],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                scale: pan.x.interpolate({
                  inputRange: [0, 150],
                  outputRange: [1, 1.2],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}>
        <Text style={styles.savedIcon}>📥</Text>
        <Text style={styles.savedText}>Swipe right to save</Text>
      </Animated.View>

      {/* Paper card */}
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { rotate },
              { scale },
            ],
            opacity,
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
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
