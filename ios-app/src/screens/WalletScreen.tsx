import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { creditsAPI } from '../services/api';
import { WalletInfo, TOKEN_TYPES, TOKEN_META, TokenType } from '../types';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

interface WalletScreenProps {
  navigation: any;
}

const WalletScreen: React.FC<WalletScreenProps> = ({ navigation }) => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    loadWalletInfo();
  }, []);

  const loadWalletInfo = async () => {
    try {
      const info = await creditsAPI.getWallet();
      setWalletInfo(info);
    } catch (error) {
      Alert.alert('Error', 'Failed to load wallet information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWalletInfo();
  };

  const getTransactionIcon = (type: string, tokenType?: TokenType) => {
    if (tokenType && TOKEN_META[tokenType]) {
      return TOKEN_META[tokenType].icon;
    }
    switch (type) {
      case 'GRANT_TO_INVESTOR':
        return '🎁';
      case 'INVEST_IN_IDEA':
        return '💸';
      case 'SPEND_ON_AI_SERVICE':
        return '🤖';
      default:
        return '💰';
    }
  };

  const getTransactionColor = (type: string, tokenType?: TokenType) => {
    if (tokenType && TOKEN_META[tokenType]) {
      return TOKEN_META[tokenType].color;
    }
    switch (type) {
      case 'GRANT_TO_INVESTOR':
        return COLORS.success;
      case 'INVEST_IN_IDEA':
        return COLORS.warning;
      case 'SPEND_ON_AI_SERVICE':
        return COLORS.accent;
      default:
        return COLORS.textMuted;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading wallet…</Text>
      </View>
    );
  }

  if (!walletInfo) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load wallet</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}>
      {/* Hero balance card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Tokens</Text>
        <Text style={styles.balanceAmount}>
          {(walletInfo.wallet.balance || 0).toLocaleString()}
        </Text>
        <Text style={styles.balanceSub}>AI tokens ready to invest</Text>
      </View>

      {/* Per-token grid */}
      <View style={styles.tokenGrid}>
        {TOKEN_TYPES.map((tt) => {
          const meta = TOKEN_META[tt];
          const bal = walletInfo.wallet.balances?.[tt.toLowerCase() as keyof typeof walletInfo.wallet.balances] || 0;
          return (
            <View key={tt} style={[styles.tokenCard, { borderLeftColor: meta.color }]}>
              <Text style={styles.tokenIcon}>{meta.icon}</Text>
              <Text style={styles.tokenName}>{meta.label}</Text>
              <Text style={[styles.tokenBal, { color: meta.color }]}>{bal.toLocaleString()}</Text>
              <Text style={styles.tokenProvider}>{meta.provider}</Text>
            </View>
          );
        })}
      </View>

      {/* Claim Monthly Grant */}
      <TouchableOpacity
        style={[styles.grantBtn, claiming && { opacity: 0.6 }]}
        disabled={claiming}
        activeOpacity={0.7}
        onPress={async () => {
          setClaiming(true);
          try {
            const result = await creditsAPI.claimMonthlyGrant();
            Alert.alert('Tokens Granted!', result.message);
            loadWalletInfo();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to claim grant');
          } finally {
            setClaiming(false);
          }
        }}>
        <Text style={styles.grantBtnText}>{claiming ? 'Claiming…' : '🎁  Claim Monthly Token Grant'}</Text>
      </TouchableOpacity>

      {/* Info card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 How Tokens Work</Text>
        <Text style={styles.infoText}>
          • Receive Gemini, Anthropic, Perplexity & ChatGPT tokens{'\n'}
          • Transfer specific tokens to promising ideas{'\n'}
          • Founders spend tokens on the matching AI provider{'\n'}
          • Tokens consumed = equity percentage
        </Text>
        <View style={styles.equityBox}>
          <Text style={styles.equityBoxText}>10,000 tokens consumed = 1% equity</Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>

        {walletInfo.transactions && walletInfo.transactions.length > 0 ? (
          walletInfo.transactions.map((transaction: any, index: number) => (
            <View key={transaction._id || index} style={styles.txCard}>
              <View style={styles.txIconWrap}>
                <Text style={styles.txIconText}>
                  {getTransactionIcon(transaction.type, transaction.tokenType)}
                </Text>
              </View>

              <View style={styles.txInfo}>
                <Text style={styles.txType}>
                  {transaction.type.replace(/_/g, ' ')}
                </Text>
                {transaction.tokenType && (
                  <Text style={[styles.txTokenBadge, { color: TOKEN_META[transaction.tokenType as TokenType]?.color || COLORS.textMuted }]}>
                    {TOKEN_META[transaction.tokenType as TokenType]?.label || transaction.tokenType} tokens
                  </Text>
                )}
                {transaction.memo && (
                  <Text style={styles.txMemo} numberOfLines={1}>
                    {transaction.memo}
                  </Text>
                )}
                <Text style={styles.txDate}>
                  {formatDate(transaction.createdAt)}
                </Text>
              </View>

              <View style={styles.txAmount}>
                <Text
                  style={[
                    styles.txAmountText,
                    { color: getTransactionColor(transaction.type, transaction.tokenType) },
                  ]}>
                  {transaction.type === 'GRANT_TO_INVESTOR' ? '+' : '-'}
                  {transaction.amount}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyTx}>
            <Text style={styles.emptyTxTitle}>No transactions yet</Text>
            <Text style={styles.emptyTxSub}>
              Start reviewing ideas to invest your tokens!
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.helpBtn}
        activeOpacity={0.7}
        onPress={() => Alert.alert('Help', 'Invest Gemini, Anthropic, Perplexity, or ChatGPT tokens in ideas to earn equity!')}>
        <Text style={styles.helpBtnText}>Need Help? 💬</Text>
      </TouchableOpacity>
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
  /* ---- Hero balance ---- */
  balanceCard: {
    backgroundColor: COLORS.accent,
    margin: SPACING.lg,
    padding: 28,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.85,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 4,
  },
  balanceSub: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.75,
  },
  /* ---- Token grid ---- */
  tokenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  tokenCard: {
    width: '47%',
    backgroundColor: COLORS.cardBg,
    margin: '1.5%',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  tokenIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  tokenName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  tokenBal: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  tokenProvider: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  /* ---- Grant button ---- */
  grantBtn: {
    backgroundColor: COLORS.accent,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: 16,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  grantBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  /* ---- Info card ---- */
  infoCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: COLORS.text,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  equityBox: {
    backgroundColor: COLORS.successBg,
    padding: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  equityBoxText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.successDark,
  },
  /* ---- Transactions ---- */
  section: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
    color: COLORS.text,
  },
  txCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    padding: 14,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.formBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txIconText: {
    fontSize: 20,
  },
  txInfo: {
    flex: 1,
  },
  txType: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  txTokenBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  txMemo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  txDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  txAmount: {
    marginLeft: 10,
  },
  txAmountText: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyTx: {
    backgroundColor: COLORS.cardBg,
    padding: 30,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTxTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyTxSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  helpBtn: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginBottom: 30,
    padding: 16,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  helpBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accent,
  },
});

export default WalletScreen;
