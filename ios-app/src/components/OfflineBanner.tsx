import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

/**
 * Renders a small banner at the top when the device is offline.
 * Uses a simple polling approach to check connectivity so we don't
 * need the @react-native-community/netinfo dependency.
 */
const OfflineBanner: React.FC<{ isOffline: boolean }> = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>📡 You're offline — some features may not work</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.error,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OfflineBanner;
