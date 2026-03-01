import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONTS } from '../theme';

// Agent types and their metadata
export type AgentType = 'business' | 'science' | 'marketing' | 'developer';

interface AgentInfo {
  type: AgentType;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

const FOUNDER_AGENTS: AgentInfo[] = [
  { 
    type: 'business', 
    name: 'Business Leader', 
    emoji: '💼', 
    color: '#D93B41',
    description: 'Strategic advice on business models, market positioning, and growth' 
  },
  { 
    type: 'science', 
    name: 'Scientist', 
    emoji: '🔬', 
    color: '#7B61FF',
    description: 'Technical feasibility, research validation, and scientific rigor' 
  },
  { 
    type: 'marketing', 
    name: 'Marketer', 
    emoji: '📢', 
    color: '#00BFAE',
    description: 'Go-to-market strategy, positioning, and customer acquisition' 
  },
  { 
    type: 'developer', 
    name: 'Software Developer', 
    emoji: '💻', 
    color: '#F59E0B',
    description: 'Technical implementation, architecture, and MVP development' 
  },
];

interface Props {
  navigation: any;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const handleAgentPress = (agentType: AgentType) => {
    navigation.navigate('AgentChat', { agentType });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Founder Support Agents</Text>
      <Text style={styles.subtitle}>
        Chat with four specialized AI agents to help you go deeper into your idea.
      </Text>
      <View style={styles.agentGrid}>
        {FOUNDER_AGENTS.map((agent) => (
          <TouchableOpacity
            key={agent.type}
            style={[styles.agentCard, { borderColor: agent.color + '40' }]}
            onPress={() => handleAgentPress(agent.type)}
            activeOpacity={0.8}
          >
            <View style={[styles.agentEmojiContainer, { backgroundColor: agent.color + '15' }]}>
              <Text style={styles.agentEmoji}>{agent.emoji}</Text>
            </View>
            <Text style={[styles.agentName, { color: agent.color }]}>{agent.name}</Text>
            <Text style={styles.agentDescription} numberOfLines={2}>
              {agent.description}
            </Text>
            <View style={[styles.chatButton, { backgroundColor: agent.color }]}>
              <Text style={styles.chatButtonText}>Start Chat →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#f5f7fa',
    alignItems: 'center',
    minHeight: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 24,
    color: '#222',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#4F8EF7',
    marginBottom: 28,
    textAlign: 'center',
    fontWeight: '500',
  },
  agentGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  agentCard: {
    flexBasis: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  agentEmojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  agentEmoji: {
    fontSize: 26,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  agentDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 14,
    minHeight: 32,
  },
  chatButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default HomeScreen;
