import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { pranaAPI, ideasAPI } from '../services/api';
import {
  TokenType,
  TOKEN_TYPES,
  TOKEN_META,
  PRANA_MARKET_RATES,
  Idea,
  PranaBalanceResponse,
} from '../types';
import { handleApiError } from '../utils/errorHandler';
import { COLORS, RADIUS, SHADOWS, SPACING, FONTS } from '../theme';

interface PranaExchangeScreenProps {
  route: any;
  navigation: any;
}

const PranaExchangeScreen: React.FC<PranaExchangeScreenProps> = ({ route, navigation }) => {
  const preselectedIdeaId = route?.params?.ideaId;

  const [pranaData, setPranaData] = useState<PranaBalanceResponse | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<string>(preselectedIdeaId || '');
  const [selectedToken, setSelectedToken] = useState<TokenType>('CHATGPT');
  const [creditAmount, setCreditAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [exchanging, setExchanging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pranaRes, ideasRes] = await Promise.all([
        pranaAPI.getBalance(),
        ideasAPI.getMyIdeas(),
      ]);
      setPranaData(pranaRes);
      setIdeas(ideasRes.ideas || []);
      if (!selectedIdea && ideasRes.ideas?.length > 0) {
        setSelectedIdea(ideasRes.ideas[0]._id);
      }
    } catch (error) {
      handleApiError(error, 'Failed to load Prana data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const pranaCost = creditAmount
    ? Math.round(parseInt(creditAmount, 10) * PRANA_MARKET_RATES[selectedToken] * 100) / 100
    : 0;

  const canAfford = pranaData ? pranaCost <= pranaData.pranaBalance : false;
  const maxCredits = pranaData
    ? Math.floor(pranaData.pranaBalance / PRANA_MARKET_RATES[selectedToken])
    : 0;

  const handleExchange = () => {
    const credits = parseInt(creditAmount, 10);
    if (!credits || credits <= 0) {
      Alert.alert('Invalid Amount', 'Enter a positive number of credits.');
      return;
    }
    if (!selectedIdea) {
      Alert.alert('Select Idea', 'Choose an idea to deposit credits into.');
      return;
    }
    if (!canAfford) {
      Alert.alert('Insufficient Prana', `You need ${pranaCost}₽ but only have ${pranaData?.pranaBalance}₽.`);
      return;
    }

    const ideaTitle = ideas.find(i => i._id === selectedIdea)?.title || 'this idea';
    Alert.alert(
      'Confirm Exchange',
      `Spend ${pranaCost}₽ to get ${credits} ${TOKEN_META[selectedToken].label} credits for "${ideaTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exchange', onPress: executeExchange },
      ]
    );
  };

  const executeExchange = async () => {
    const credits = parseInt(creditAmount, 10);
    setExchanging(true);
    try {
      const result = await pranaAPI.exchange(selectedIdea, selectedToken, credits);
      Alert.alert(
        'Exchange Complete! ✨',
        `Added ${result.creditsAdded} ${TOKEN_META[selectedToken].label} credits.\nPrana remaining: ${result.pranaRemaining}₽`,
      );
      setCreditAmount('');
      // Refresh balance
      const freshPrana = await pranaAPI.getBalance();
      setPranaData(freshPrana);
    } catch (error) {
      handleApiError(error, 'Exchange failed');
    } finally {
      setExchanging(false);
    }
  };

  const setMaxAmount = () => {
    setCreditAmount(maxCredits.toString());
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading Prana wallet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* Prana Balance Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Your Prana Balance</Text>
          <View style={styles.heroRow}>
            <Text style={styles.pranaSymbol}>₽</Text>
            <Text style={styles.pranaAmount}>
              {pranaData?.pranaBalance?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <Text style={styles.heroSubtext}>
            Lifetime exchanged: {pranaData?.totalExchanged?.toFixed(2) || '0.00'}₽
          </Text>
        </View>

        {/* Exchange Rates Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exchange Rates</Text>
          <Text style={styles.sectionSubtitle}>1 AI credit costs this many Prana (₽)</Text>
          <View style={styles.ratesGrid}>
            {TOKEN_TYPES.map((tt) => {
              const meta = TOKEN_META[tt];
              const rate = PRANA_MARKET_RATES[tt];
              const afford = pranaData?.affordability?.[tt] || 0;
              const isSelected = selectedToken === tt;
              return (
                <TouchableOpacity
                  key={tt}
                  style={[
                    styles.rateCard,
                    isSelected && { borderColor: meta.color, backgroundColor: meta.color + '15' },
                  ]}
                  onPress={() => setSelectedToken(tt)}
                >
                  <Text style={styles.rateIcon}>{meta.icon}</Text>
                  <Text style={[styles.rateName, isSelected && { color: meta.color }]}>
                    {meta.label}
                  </Text>
                  <Text style={styles.rateValue}>{rate}₽</Text>
                  <Text style={styles.rateAfford}>
                    Can buy: {afford}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Select Idea */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deposit Into Idea</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ideaScroll}>
            {ideas.map((idea) => (
              <TouchableOpacity
                key={idea._id}
                style={[
                  styles.ideaPill,
                  selectedIdea === idea._id && styles.ideaPillSelected,
                ]}
                onPress={() => setSelectedIdea(idea._id)}
              >
                <Text
                  style={[
                    styles.ideaPillText,
                    selectedIdea === idea._id && styles.ideaPillTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {idea.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Exchange Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exchange Prana</Text>
          <View style={styles.selectedTokenBanner}>
            <Text style={styles.selectedTokenIcon}>{TOKEN_META[selectedToken].icon}</Text>
            <Text style={styles.selectedTokenText}>
              {TOKEN_META[selectedToken].label} — {PRANA_MARKET_RATES[selectedToken]}₽ per credit
            </Text>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.creditInput}
              value={creditAmount}
              onChangeText={setCreditAmount}
              placeholder="Credits to buy"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.maxButton} onPress={setMaxAmount}>
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>
          </View>

          {creditAmount ? (
            <View style={styles.costPreview}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Credits</Text>
                <Text style={styles.costValue}>
                  {parseInt(creditAmount, 10) || 0} {TOKEN_META[selectedToken].label}
                </Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Prana Cost</Text>
                <Text style={[styles.costValue, !canAfford && styles.costValueError]}>
                  {pranaCost}₽
                </Text>
              </View>
              <View style={styles.costDivider} />
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Balance After</Text>
                <Text style={styles.costValue}>
                  {((pranaData?.pranaBalance || 0) - pranaCost).toFixed(2)}₽
                </Text>
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.exchangeButton,
              (!canAfford || !creditAmount || exchanging) && styles.exchangeButtonDisabled,
            ]}
            onPress={handleExchange}
            disabled={!canAfford || !creditAmount || exchanging}
          >
            {exchanging ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.exchangeButtonText}>
                Exchange {pranaCost > 0 ? `${pranaCost}₽` : 'Prana'} → {TOKEN_META[selectedToken].label}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Spacer */}
        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },

  // Hero
  heroCard: {
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    backgroundColor: '#4A148C',
    ...SHADOWS.lg,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: SPACING.xs,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pranaSymbol: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FDCB6E',
    marginRight: SPACING.xs,
  },
  pranaAmount: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: SPACING.sm,
  },

  // Sections
  section: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.h3,
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },

  // Rates Grid
  ratesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  rateCard: {
    width: '48%' as any,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: 2,
    ...SHADOWS.sm,
  },
  rateIcon: {
    fontSize: 22,
    marginBottom: SPACING.xs,
  },
  rateName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  rateValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gold,
  },
  rateAfford: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Idea picker
  ideaScroll: {
    marginTop: SPACING.sm,
  },
  ideaPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  ideaPillSelected: {
    backgroundColor: COLORS.accentLight,
    borderColor: COLORS.accent,
  },
  ideaPillText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    maxWidth: 140,
  },
  ideaPillTextSelected: {
    color: COLORS.accent,
    fontWeight: '600',
  },

  // Exchange form
  selectedTokenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgTertiary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  selectedTokenIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  selectedTokenText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  creditInput: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  maxButton: {
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  maxButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Cost preview
  costPreview: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  costLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  costValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  costValueError: {
    color: COLORS.error,
  },
  costDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },

  // Exchange button
  exchangeButton: {
    backgroundColor: '#4A148C',
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#2E0854',
    ...SHADOWS.md,
  },
  exchangeButtonDisabled: {
    opacity: 0.4,
  },
  exchangeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default PranaExchangeScreen;
