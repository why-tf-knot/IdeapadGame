import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { creditsAPI } from '../services/api';
import { WalletInfo, TOKEN_TYPES, TOKEN_META, TokenType } from '../types';

interface WalletScreenProps {
  navigation: any;
}

const WalletScreen: React.FC<WalletScreenProps> = ({ navigation }) => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        return '#34C759';
      case 'INVEST_IN_IDEA':
        return '#FF9500';
      case 'SPEND_ON_AI_SERVICE':
        return '#007AFF';
      default:
        return '#666';
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
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  if (!walletInfo) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load wallet</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Tokens</Text>
        <Text style={styles.balanceAmount}>
          {(walletInfo.wallet.balance || 0).toLocaleString()}
        </Text>
        <Text style={styles.balanceSubtext}>AI tokens ready to invest</Text>
      </View>

      {/* Per-token balances */}
      <View style={styles.tokenGrid}>
        {TOKEN_TYPES.map((tt) => {
          const meta = TOKEN_META[tt];
          const bal = walletInfo.wallet.balances?.[tt.toLowerCase() as keyof typeof walletInfo.wallet.balances] || 0;
          return (
            <View key={tt} style={[styles.tokenCard, { borderLeftColor: meta.color }]}>
              <Text style={styles.tokenIcon}>{meta.icon}</Text>
              <Text style={styles.tokenName}>{meta.label}</Text>
              <Text style={[styles.tokenBalance, { color: meta.color }]}>{bal.toLocaleString()}</Text>
              <Text style={styles.tokenProvider}>{meta.provider}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 How Tokens Work</Text>
        <Text style={styles.infoText}>
          • Receive Gemini, Anthropic, Perplexity & ChatGPT tokens{'\n'}
          • Transfer specific tokens to promising ideas{'\n'}
          • Founders spend tokens on the matching AI provider{'\n'}
          • Tokens consumed = equity percentage
        </Text>
        <View style={styles.equityExample}>
          <Text style={styles.equityExampleText}>
            10,000 tokens consumed = 1% equity
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>

        {walletInfo.transactions && walletInfo.transactions.length > 0 ? (
          walletInfo.transactions.map((transaction: any, index: number) => (
            <View key={transaction._id || index} style={styles.transactionCard}>
              <View style={styles.transactionIcon}>
                <Text style={styles.transactionIconText}>
                  {getTransactionIcon(transaction.type, transaction.tokenType)}
                </Text>
              </View>

              <View style={styles.transactionInfo}>
                <Text style={styles.transactionType}>
                  {transaction.type.replace(/_/g, ' ')}
                </Text>
                {transaction.tokenType && (
                  <Text style={[styles.transactionTokenBadge, { color: TOKEN_META[transaction.tokenType as TokenType]?.color || '#666' }]}>
                    {TOKEN_META[transaction.tokenType as TokenType]?.label || transaction.tokenType} tokens
                  </Text>
                )}
                {transaction.memo && (
                  <Text style={styles.transactionMemo} numberOfLines={1}>
                    {transaction.memo}
                  </Text>
                )}
                <Text style={styles.transactionDate}>
                  {formatDate(transaction.createdAt)}
                </Text>
              </View>

              <View style={styles.transactionAmount}>
                <Text
                  style={[
                    styles.transactionAmountText,
                    {
                      color: getTransactionColor(transaction.type, transaction.tokenType),
                    },
                  ]}>
                  {transaction.type === 'GRANT_TO_INVESTOR' ? '+' : '-'}
                  {transaction.amount}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyTransactions}>
            <Text style={styles.emptyTransactionsText}>No transactions yet</Text>
            <Text style={styles.emptyTransactionsSubtext}>
              Start reviewing ideas to invest your credits!
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.helpButton}
        onPress={() => Alert.alert('Help', 'Invest Gemini, Anthropic, Perplexity, or ChatGPT tokens in ideas to earn equity!')}>
        <Text style={styles.helpButtonText}>Need Help? 💬</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  balanceCard: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 10,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  tokenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  tokenCard: {
    width: '47%',
    backgroundColor: '#fff',
    margin: '1.5%',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tokenIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  tokenName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  tokenBalance: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  tokenProvider: {
    fontSize: 11,
    color: '#999',
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  equityExample: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  equityExampleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  transactionTokenBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  transactionMemo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  transactionAmount: {
    marginLeft: 10,
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyTransactions: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyTransactionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyTransactionsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  helpButton: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default WalletScreen;
