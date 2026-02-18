import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { handleAppError } from '../utils/errorHandler';

interface Props {
  children: ReactNode;
  /** Optional fallback UI to render instead of the default */
  fallback?: ReactNode;
  /** Screen name for error tracking context */
  screenName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary for catching rendering errors.
 *
 * Wrap any screen or component tree to prevent a single crash
 * from bringing down the entire app.  Provides a "Try Again"
 * button that resets the error state and re-renders children.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    handleAppError(error, `ErrorBoundary [${this.props.screenName || 'unknown'}]: ${errorInfo.componentStack}`);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset} activeOpacity={0.7}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.xl,
  },
  icon: {
    fontSize: 56,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  button: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ErrorBoundary;
