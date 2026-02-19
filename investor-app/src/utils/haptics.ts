/**
 * Platform-safe haptic feedback utility
 * 
 * Wraps ReactNativeHapticFeedback to only fire on iOS.
 * On Android, uses the vibrate fallback when available.
 */

import { Platform } from 'react-native';
import ReactNativeHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

/**
 * Trigger haptic feedback safely across platforms.
 * On iOS: uses native haptic engine.
 * On Android: uses vibrate fallback if available (won't crash).
 */
export function triggerHaptic(type: HapticFeedbackTypes): void {
  try {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger(type, hapticOptions);
    } else if (Platform.OS === 'android') {
      // Android: use vibrate fallback only, less reliable
      ReactNativeHapticFeedback.trigger(type, {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
  } catch (error) {
    // Silently fail — haptics are non-critical
    console.warn('[Haptics] Failed to trigger:', error);
  }
}

// Pre-defined haptic helpers for common interactions
export const haptics = {
  /** Light tap feedback (e.g., button press) */
  light: () => triggerHaptic('impactLight' as HapticFeedbackTypes),
  /** Medium impact (e.g., card snap) */
  medium: () => triggerHaptic('impactMedium' as HapticFeedbackTypes),
  /** Heavy impact (e.g., successful action) */
  heavy: () => triggerHaptic('impactHeavy' as HapticFeedbackTypes),
  /** Selection changed */
  selection: () => triggerHaptic('selection' as HapticFeedbackTypes),
  /** Success notification */
  success: () => triggerHaptic('notificationSuccess' as HapticFeedbackTypes),
  /** Warning notification */
  warning: () => triggerHaptic('notificationWarning' as HapticFeedbackTypes),
  /** Error notification */
  error: () => triggerHaptic('notificationError' as HapticFeedbackTypes),
};
