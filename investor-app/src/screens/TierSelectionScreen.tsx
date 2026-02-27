import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { creditsAPI } from '../services/api';
import {
  InvestorTier,
  INVESTOR_TIERS,
  TIER_META,
  TOKEN_TYPES,
  TOKEN_META,
} from '../types';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

interface TierSelectionScreenProps {
  navigation: any;
  route?: {
    params?: {
      currentTier?: InvestorTier;
      onTierChanged?: () => void;
    };
  };
}

const TierSelectionScreen: React.FC<TierSelectionScreenProps> = ({
  navigation,
  route,
}: TierSelectionScreenProps) => {
  const currentTier: InvestorTier = route?.params?.currentTier || 'SHISHYA';
  const [selectedTier, setSelectedTier] = useState<InvestorTier>(currentTier);
  const [saving, setSaving] = useState(false);

  const handleSelect = async () => {
    if (selectedTier === currentTier) {
      navigation.goBack();
      return;
    }

    setSaving(true);
    try {
      await creditsAPI.selectTier(selectedTier);
      Alert.alert(
        'Tier Updated!',
        `You are now a ${TIER_META[selectedTier].label}. Your next monthly grant will reflect the new tier.`,
        [
          {
            text: 'OK',
            onPress: () => {
              route?.params?.onTierChanged?.();
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update tier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Your Path</Text>
        <Text style={styles.headerSub}>
          Select a tier to determine your monthly AI token grant
        </Text>
      </View>

      {/* Tier Cards */}
      {INVESTOR_TIERS.map((tier) => {
        const meta = TIER_META[tier];
        const isSelected = selectedTier === tier;
        const isCurrent = currentTier === tier;

        return (
          <TouchableOpacity
            key={tier}
            activeOpacity={0.8}
            onPress={() => setSelectedTier(tier)}
            style={[
              styles.tierCard,
              { borderColor: isSelected ? meta.color : COLORS.border },
              isSelected && { borderWidth: 2.5, backgroundColor: `${meta.color}08` },
            ]}
          >
            {/* Tier badge */}
            {isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: meta.color }]}>
                <Text style={styles.currentBadgeText}>CURRENT</Text>
              </View>
            )}

            {/* Icon & name */}
            <View style={styles.tierHeader}>
              <Text style={styles.tierIcon}>{meta.icon}</Text>
              <View style={styles.tierNameWrap}>
                <Text style={[styles.tierName, { color: meta.color }]}>{meta.label}</Text>
                <Text style={styles.tierSubtitle}>{meta.subtitle}</Text>
              </View>
              {isSelected && (
                <View style={[styles.checkCircle, { backgroundColor: meta.color }]}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
              )}
            </View>

            {/* Description */}
            <Text style={styles.tierDesc}>{meta.description}</Text>

            {/* Token breakdown */}
            <View style={styles.tokenBreakdown}>
              {TOKEN_TYPES.map((tt) => (
                <View key={tt} style={styles.tokenRow}>
                  <Text style={styles.tokenRowIcon}>{TOKEN_META[tt].icon}</Text>
                  <Text style={styles.tokenRowLabel}>{TOKEN_META[tt].label}</Text>
                  <Text style={[styles.tokenRowAmount, { color: TOKEN_META[tt].color }]}>
                    +{meta.perToken}
                  </Text>
                </View>
              ))}
            </View>

            {/* Total */}
            <View style={[styles.totalRow, { backgroundColor: `${meta.color}15` }]}>
              <Text style={styles.totalLabel}>Monthly Grant Total</Text>
              <Text style={[styles.totalAmount, { color: meta.color }]}>
                {meta.totalGrant.toLocaleString()} tokens
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Confirm button */}
      <TouchableOpacity
        style={[
          styles.confirmBtn,
          { backgroundColor: TIER_META[selectedTier].color },
          saving && { opacity: 0.6 },
        ]}
        activeOpacity={0.7}
        disabled={saving}
        onPress={handleSelect}
      >
        {saving ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.confirmBtnText}>
            {selectedTier === currentTier
              ? 'Keep Current Tier'
              : `Select ${TIER_META[selectedTier].label} Tier`}
          </Text>
        )}
      </TouchableOpacity>

      {/* Info note */}
      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>📌 How Tiers Work</Text>
        <Text style={styles.noteText}>
          • Your tier determines how many AI tokens you receive each month{'\n'}
          • Changing tiers takes effect on your next monthly grant{'\n'}
          • Higher tiers let you invest in more ideas simultaneously{'\n'}
          • All tiers have the same 30-day grant cooldown
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },
  headerSub: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  /* ---- Tier Card ---- */
  tierCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    position: 'relative',
    ...SHADOWS.md,
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.8,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierIcon: {
    fontSize: 36,
    marginRight: 14,
  },
  tierNameWrap: {
    flex: 1,
  },
  tierName: {
    fontSize: 22,
    fontWeight: '900',
  },
  tierSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
  },
  tierDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  /* ---- Token breakdown ---- */
  tokenBreakdown: {
    backgroundColor: COLORS.formBg,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 12,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  tokenRowIcon: {
    fontSize: 18,
    width: 28,
  },
  tokenRowLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tokenRowAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  /* ---- Total ---- */
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  /* ---- Confirm ---- */
  confirmBtn: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    padding: 18,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  confirmBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.white,
  },
  /* ---- Note ---- */
  noteCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  noteText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default TierSelectionScreen;
