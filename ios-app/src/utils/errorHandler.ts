/**
 * Centralized error handling utility
 * 
 * Provides consistent error handling across all screens.
 * Can be extended with error tracking services (Sentry, Bugsnag).
 */

import { Alert } from 'react-native';

/**
 * Handle API errors with consistent user feedback and logging
 */
export function handleApiError(error: any, userMessage: string): void {
  // Extract a useful error message
  const serverMessage = error?.response?.data?.error;
  const networkMessage = error?.message === 'Network Error'
    ? 'Please check your internet connection.'
    : undefined;

  const displayMessage = serverMessage || networkMessage || userMessage;

  console.error(`[API Error] ${userMessage}:`, {
    status: error?.response?.status,
    serverMessage,
    message: error?.message,
  });

  Alert.alert('Error', displayMessage);

  // TODO: Send to error tracking service (Sentry, Bugsnag)
  // if (__DEV__ === false) {
  //   Sentry.captureException(error, { extra: { userMessage } });
  // }
}

/**
 * Handle non-API errors (e.g. rendering, logic errors)
 */
export function handleAppError(error: any, context: string): void {
  console.error(`[App Error] ${context}:`, error);

  // TODO: Send to error tracking service
}

/**
 * Wrap an async function with error handling
 * Useful for event handlers where you can't use try/catch easily
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage: string
): (...args: Parameters<T>) => Promise<void> {
  return async (...args: Parameters<T>) => {
    try {
      await fn(...args);
    } catch (error) {
      handleApiError(error, errorMessage);
    }
  };
}
