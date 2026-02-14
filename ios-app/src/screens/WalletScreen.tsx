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
import { WalletInfo } from '../types';

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

  const getTransactionIcon = (type: string) => {
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

  const getTransactionColor = (type: string) => {
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
        <Text style={styles.balanceLabel}>Available Credits</Text>
        <Text style={styles.balanceAmount}>{walletInfo.wallet.balance.toLocaleString()}</Text>
        <Text style={styles.balanceSubtext}>AI credits ready to invest</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 How Credits Work</Text>
        <Text style={styles.infoText}>
          • Receive 1,000 credits monthly{'\n'}
          • Invest credits in promising ideas{'\n'}
          • Founders use credits for AI tools{'\n'}
          • Credits consumed = equity percentage
        </Text>
        <View style={styles.equityExample}>
          <Text style={styles.equityExampleText}>
            10,000 credits consumed = 1% equity
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
                  {getTransactionIcon(transaction.type)}
                </Text>
              </View>

              <View style={styles.transactionInfo}>
                <Text style={styles.transactionType}>
                  {transaction.type.replace(/_/g, ' ')}
                </Text>
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
                      color: getTransactionColor(transaction.type),
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
        onPress={() => Alert.alert('Help', 'Credits help you support founders and earn equity!')}>
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
