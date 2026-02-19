import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme';

interface StatBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
  icon?: string;
}

/**
 * Animated stat bar (RPG / Pokémon GO style).
 * Shows a label, current/max, and an animated fill bar.
 */
const StatBar: React.FC<StatBarProps> = ({
  label,
  current,
  max,
  color,
  icon,
}) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const percentage = max > 0 ? Math.min(current / max, 1) : 0;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: percentage,
      useNativeDriver: false,
      tension: 20,
      friction: 7,
    }).start();
  }, [current, max, percentage, widthAnim]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {icon ? `${icon} ` : ''}{label}
        </Text>
        <Text style={styles.value}>
          {current.toLocaleString()}
          <Text style={styles.maxValue}>/{max.toLocaleString()}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: animatedWidth, backgroundColor: color }]}>
          {/* Shine / highlight */}
          <View style={styles.shine} />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  maxValue: {
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  track: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
});

export default StatBar;
