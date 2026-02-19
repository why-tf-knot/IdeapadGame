import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { equityAPI } from '../services/api';
import { TOKEN_TYPES, TOKEN_META, TokenType } from '../types';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

interface IdeaEquityScreenProps {
  route: any;
  navigation: any;
}

interface EquityData {
  ideaId: string;
  totalCreditsInvested: number;
  totalCreditsSpent: number;
  totalEquityPercent: number;
  tokenBreakdown?: Record<string, { invested: number; spent: number }>;
  investorEquity: Array<{
    investorId: string;
    investorName: string;
    creditsAllocated: number;
    tokenAllocations?: { tokenType: string; amount: number }[];
    estimatedEquityPercent: number;
  }>;
}

const INVESTOR_COLORS = [
  COLORS.accent,
  COLORS.success,
  COLORS.warning,
  COLORS.error,
  '#5856D6',
  '#AF52DE',
];

const getColorForIndex = (index: number): string =>
  INVESTOR_COLORS[index % INVESTOR_COLORS.length];

const IdeaEquityScreen: React.FC<IdeaEquityScreenProps> = ({ route, navigation }) => {
  const { ideaId, ideaTitle } = route.params;
  const [equityData, setEquityData] = useState<EquityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: ideaTitle || 'Equity Breakdown' });
    loadEquityData();
  }, [ideaId]);

  const loadEquityData = async () => {
    try {
      const data = await equityAPI.getIdeaEquity(ideaId);
      setEquityData(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load equity data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading equity data…</Text>
      </View>
    );
  }

  if (!equityData) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No equity data available</Text>
      </View>
    );
  }

  const utilizationRate =
    equityData.totalCreditsInvested > 0
      ? (equityData.totalCreditsSpent / equityData.totalCreditsInvested) * 100
      : 0;

  return (
    <ScrollView style={styles.container}>
      {/* Hero equity card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Total Equity Pool</Text>
        <Text style={styles.heroValue}>
          {equityData.totalEquityPercent.toFixed(4)}%
        </Text>
        <Text style={styles.heroSub}>
          Based on {equityData.totalCreditsSpent.toLocaleString()} tokens consumed
        </Text>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Invested</Text>
          <Text style={styles.statValue}>
            {equityData.totalCreditsInvested.toLocaleString()}
          </Text>
          <Text style={styles.statUnit}>tokens</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Tokens Spent</Text>
          <Text style={styles.statValue}>
            {equityData.totalCreditsSpent.toLocaleString()}
          </Text>
          <Text style={styles.statUnit}>tokens</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Utilization</Text>
          <Text style={styles.statValue}>{utilizationRate.toFixed(1)}%</Text>
          <Text style={styles.statUnit}>of invested</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Investors</Text>
          <Text style={styles.statValue}>{equityData.investorEquity.length}</Text>
          <Text style={styles.statUnit}>backers</Text>
        </View>
      </View>

      {/* Token Breakdown */}
      {equityData.tokenBreakdown && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Token Breakdown</Text>
          <Text style={styles.sectionSub}>Invested & spent per AI provider</Text>
          <View style={styles.tokenGrid}>
            {TOKEN_TYPES.map((tt) => {
              const meta = TOKEN_META[tt];
              const info = equityData.tokenBreakdown?.[tt] || { invested: 0, spent: 0 };
              if (info.invested === 0 && info.spent === 0) return null;
              return (
                <View key={tt} style={[styles.tokenBrkCard, { borderLeftColor: meta.color }]}>
                  <Text style={{ fontSize: 22 }}>{meta.icon}</Text>
                  <Text style={[styles.tokenBrkName, { color: meta.color }]}>{meta.label}</Text>
                  <Text style={styles.tokenBrkStat}>Invested: {info.invested.toLocaleString()}</Text>
                  <Text style={styles.tokenBrkStat}>Spent: {info.spent.toLocaleString()}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Equity Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Equity Distribution</Text>
        <Text style={styles.sectionSub}>Estimated ownership based on token allocation</Text>

        {equityData.investorEquity.map((investor, index) => {
          const sharePercent =
            equityData.totalCreditsInvested > 0
              ? (investor.creditsAllocated / equityData.totalCreditsInvested) * 100
              : 0;

          return (
            <View key={investor.investorId} style={styles.investorCard}>
              <View style={styles.investorHeader}>
                <View style={[styles.avatar, { backgroundColor: getColorForIndex(index) }]}>
                  <Text style={styles.avatarText}>
                    {investor.investorName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.investorInfo}>
                  <Text style={styles.investorName}>{investor.investorName}</Text>
                  <Text style={styles.investorCredits}>
                    {investor.creditsAllocated.toLocaleString()} tokens allocated
                  </Text>
                </View>
              </View>

              {/* Per-token allocation chips */}
              {investor.tokenAllocations && investor.tokenAllocations.length > 0 && (
                <View style={styles.tokenAllocRow}>
                  {investor.tokenAllocations.map((ta) => {
                    const meta = TOKEN_META[ta.tokenType as TokenType];
                    if (!meta) return null;
                    return (
                      <View key={ta.tokenType} style={[styles.tokenAllocChip, { backgroundColor: meta.color + '15' }]}>
                        <Text style={{ fontSize: 12 }}>{meta.icon}</Text>
                        <Text style={[styles.tokenAllocChipText, { color: meta.color }]}>
                          {ta.amount.toLocaleString()}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={styles.investorStats}>
                <View style={styles.investorStat}>
                  <Text style={styles.investorStatLabel}>Share of Pool</Text>
                  <Text style={styles.investorStatValue}>{sharePercent.toFixed(1)}%</Text>
                </View>
                <View style={styles.investorStat}>
                  <Text style={styles.investorStatLabel}>Est. Equity</Text>
                  <Text style={[styles.investorStatValue, { color: COLORS.successDark }]}>
                    {investor.estimatedEquityPercent.toFixed(4)}%
                  </Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${sharePercent}%`,
                      backgroundColor: getColorForIndex(index),
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>⚠️ Important Note</Text>
        <Text style={styles.disclaimerText}>
          These equity percentages are estimates only and are not legally binding. Actual
          equity agreements would require proper legal documentation and contracts.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
  },
  /* Hero */
  heroCard: {
    backgroundColor: COLORS.accent,
    margin: SPACING.lg,
    padding: 28,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  heroLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.85,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  heroValue: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.75,
  },
  /* Stats grid */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statBox: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    margin: '1%',
    padding: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  /* Sections */
  section: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    color: COLORS.text,
  },
  sectionSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  /* Token breakdown */
  tokenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tokenBrkCard: {
    width: '47%',
    backgroundColor: COLORS.cardBg,
    margin: '1.5%',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  tokenBrkName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 6,
  },
  tokenBrkStat: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  /* Token allocation chips */
  tokenAllocRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tokenAllocChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginRight: 6,
    marginBottom: 4,
  },
  tokenAllocChipText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  /* Investor cards */
  investorCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  investorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
  },
  investorInfo: {
    flex: 1,
  },
  investorName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  investorCredits: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  investorStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  investorStat: {
    flex: 1,
  },
  investorStatLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  investorStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.divider,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  /* Disclaimer */
  disclaimer: {
    backgroundColor: COLORS.warningBg,
    marginHorizontal: SPACING.lg,
    marginBottom: 30,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.warningDark,
    marginBottom: 6,
  },
  disclaimerText: {
    fontSize: 13,
    color: COLORS.warningDark,
    lineHeight: 18,
  },
});

export default IdeaEquityScreen;
