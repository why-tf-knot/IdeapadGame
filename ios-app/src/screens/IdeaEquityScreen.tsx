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

interface IdeaEquityScreenProps {
  route: any;
  navigation: any;
}

interface EquityData {
  ideaId: string;
  totalCreditsInvested: number;
  totalCreditsSpent: number;
  totalEquityPercent: number;
  investorEquity: Array<{
    investorId: string;
    investorName: string;
    creditsAllocated: number;
    estimatedEquityPercent: number;
  }>;
}

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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading equity data...</Text>
      </View>
    );
  }

  if (!equityData) {
    return (
      <View style={styles.centerContainer}>
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
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total Equity Pool</Text>
        <Text style={styles.summaryValue}>
          {equityData.totalEquityPercent.toFixed(4)}%
        </Text>
        <Text style={styles.summarySubtext}>
          Based on {equityData.totalCreditsSpent.toLocaleString()} credits consumed
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Invested</Text>
          <Text style={styles.statValue}>
            {equityData.totalCreditsInvested.toLocaleString()}
          </Text>
          <Text style={styles.statUnit}>credits</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Credits Spent</Text>
          <Text style={styles.statValue}>
            {equityData.totalCreditsSpent.toLocaleString()}
          </Text>
          <Text style={styles.statUnit}>credits</Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Equity Distribution</Text>
        <Text style={styles.sectionSubtitle}>
          Estimated ownership based on credit allocation
        </Text>

        {equityData.investorEquity.map((investor, index) => {
          const sharePercent =
            equityData.totalCreditsInvested > 0
              ? (investor.creditsAllocated / equityData.totalCreditsInvested) * 100
              : 0;

          return (
            <View key={investor.investorId} style={styles.investorCard}>
              <View style={styles.investorHeader}>
                <View style={styles.investorAvatar}>
                  <Text style={styles.investorAvatarText}>
                    {investor.investorName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.investorInfo}>
                  <Text style={styles.investorName}>{investor.investorName}</Text>
                  <Text style={styles.investorCredits}>
                    {investor.creditsAllocated.toLocaleString()} credits allocated
                  </Text>
                </View>
              </View>

              <View style={styles.investorStats}>
                <View style={styles.investorStat}>
                  <Text style={styles.investorStatLabel}>Share of Pool</Text>
                  <Text style={styles.investorStatValue}>{sharePercent.toFixed(1)}%</Text>
                </View>
                <View style={styles.investorStat}>
                  <Text style={styles.investorStatLabel}>Est. Equity</Text>
                  <Text style={[styles.investorStatValue, styles.equityHighlight]}>
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

      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerTitle}>⚠️ Important Note</Text>
        <Text style={styles.disclaimerText}>
          These equity percentages are estimates only and are not legally binding. Actual
          equity agreements would require proper legal documentation and contracts.
        </Text>
      </View>
    </ScrollView>
  );
};

const getColorForIndex = (index: number): string => {
  const colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#AF52DE'];
  return colors[index % colors.length];
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  summaryCard: {
    backgroundColor: '#1B5E20',
    margin: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 54,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 15,
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#fff',
    margin: '1%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statUnit: {
    fontSize: 11,
    color: '#666',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  investorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  investorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  investorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  investorAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  investorInfo: {
    flex: 1,
  },
  investorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  investorCredits: {
    fontSize: 13,
    color: '#666',
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
    color: '#999',
    marginBottom: 4,
  },
  investorStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  equityHighlight: {
    color: '#1B5E20',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  disclaimerCard: {
    backgroundColor: '#FFF3CD',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
});

export default IdeaEquityScreen;
