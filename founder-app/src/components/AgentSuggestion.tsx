import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

export type AgentRole = 'business' | 'science' | 'marketing' | 'developer';

const AGENT_LABELS: Record<AgentRole, string> = {
  business: 'Business Leader',
  science: 'Scientist',
  marketing: 'Marketer',
  developer: 'Software Developer',
};

const AGENT_EMOJIS: Record<AgentRole, string> = {
  business: '💼',
  science: '🔬',
  marketing: '📢',
  developer: '💻',
};

interface AgentSuggestionProps {
  agent: AgentRole;
  onAsk: (agent: AgentRole) => Promise<string>;
}

const AgentSuggestion: React.FC<AgentSuggestionProps> = ({ agent, onAsk }) => {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onAsk(agent);
      setSuggestion(result);
    } catch (e: any) {
      setError('Failed to get suggestion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.agentBox}>
      <Text style={styles.agentTitle}>{AGENT_EMOJIS[agent]} {AGENT_LABELS[agent]}</Text>
      <TouchableOpacity style={styles.askBtn} onPress={handleAsk} disabled={loading}>
        <Text style={styles.askBtnText}>Ask {AGENT_LABELS[agent]}</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}
      {suggestion && <Text style={styles.suggestion}>{suggestion}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  agentBox: {
    backgroundColor: '#f7f7fa',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  agentTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  askBtn: {
    backgroundColor: '#4F8EF7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  askBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  suggestion: {
    marginTop: 10,
    color: '#222',
    fontSize: 15,
  },
  error: {
    marginTop: 10,
    color: '#d00',
    fontSize: 14,
  },
});

export default AgentSuggestion;
