import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '../theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Animated shimmer placeholder shown while data is loading.
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
};

/** Pre-built card skeleton for idea lists */
export const IdeaCardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <SkeletonLoader width="60%" height={18} style={{ marginBottom: 10 }} />
    <SkeletonLoader width="100%" height={12} style={{ marginBottom: 6 }} />
    <SkeletonLoader width="80%" height={12} style={{ marginBottom: 14 }} />
    <View style={styles.row}>
      <SkeletonLoader width={60} height={24} borderRadius={12} />
      <SkeletonLoader width={60} height={24} borderRadius={12} style={{ marginLeft: 8 }} />
      <SkeletonLoader width={60} height={24} borderRadius={12} style={{ marginLeft: 8 }} />
    </View>
  </View>
);

/** Pre-built skeleton for wallet screen */
export const WalletSkeleton: React.FC = () => (
  <View style={{ padding: 24 }}>
    <View style={styles.heroSkeleton}>
      <SkeletonLoader width={120} height={14} borderRadius={7} style={{ marginBottom: 12 }} />
      <SkeletonLoader width={160} height={40} borderRadius={8} style={{ marginBottom: 8 }} />
      <SkeletonLoader width={140} height={12} borderRadius={6} />
    </View>
    <View style={styles.row}>
      <View style={styles.tokenSkeleton}>
        <SkeletonLoader width={36} height={36} borderRadius={18} style={{ marginBottom: 8 }} />
        <SkeletonLoader width={60} height={12} borderRadius={6} />
      </View>
      <View style={[styles.tokenSkeleton, { marginLeft: 12 }]}>
        <SkeletonLoader width={36} height={36} borderRadius={18} style={{ marginBottom: 8 }} />
        <SkeletonLoader width={60} height={12} borderRadius={6} />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.bgTertiary,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
  },
  heroSkeleton: {
    backgroundColor: COLORS.bgTertiary,
    borderRadius: RADIUS.xl,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenSkeleton: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default SkeletonLoader;
