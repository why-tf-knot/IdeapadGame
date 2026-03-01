import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONTS } from '../theme';
import { agentAPI, ideasAPI } from '../services/api';
import { Idea } from '../types';

// Agent types and metadata
export type AgentType = 'business' | 'science' | 'marketing' | 'developer';

interface AgentMeta {
  name: string;
  emoji: string;
  color: string;
  description: string;
  systemPrompt: string;
}

export const AGENT_DATA: Record<AgentType, AgentMeta> = {
  business: {
    name: 'Business Leader',
    emoji: '💼',
    color: '#D93B41',
    description: 'Strategic advice on business models, market positioning, and growth',
    systemPrompt: 'You are a world-class business leader and startup mentor. Help founders refine their business strategy, identify risks and opportunities, and take actionable next steps.',
  },
  science: {
    name: 'Scientist',
    emoji: '🔬',
    color: '#7B61FF',
    description: 'Technical feasibility, research validation, and scientific rigor',
    systemPrompt: 'You are a top scientist and technical expert. Help founders evaluate technical feasibility, identify research gaps, and strengthen the scientific foundation of their ideas.',
  },
  marketing: {
    name: 'Marketer',
    emoji: '📢',
    color: '#00BFAE',
    description: 'Go-to-market strategy, positioning, and customer acquisition',
    systemPrompt: 'You are a world-class marketer and growth expert. Help founders develop compelling messaging, identify ideal customer segments, and plan effective go-to-market strategies.',
  },
  developer: {
    name: 'Software Developer',
    emoji: '💻',
    color: '#F59E0B',
    description: 'Technical implementation, architecture, and MVP development',
    systemPrompt: 'You are a senior software developer and technical architect. Help founders plan their tech stack, design scalable architecture, and prioritize MVP features.',
  },
};

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

interface Props {
  route: { params: { agentType: AgentType; ideaId?: string } };
  navigation: any;
}

export default function AgentChatScreen({ route, navigation }: Props) {
  const { agentType, ideaId: initialIdeaId } = route.params;
  const agent = AGENT_DATA[agentType];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [showIdeaPicker, setShowIdeaPicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({
      title: `${agent.emoji} ${agent.name}`,
      headerStyle: { backgroundColor: agent.color },
      headerTintColor: '#fff',
    });
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    try {
      const { ideas: fetchedIdeas } = await ideasAPI.getMyIdeas();
      setIdeas(fetchedIdeas);
      // Auto-select if ideaId was passed or if there's only one idea
      if (initialIdeaId) {
        const found = fetchedIdeas.find(i => i._id === initialIdeaId);
        if (found) setSelectedIdea(found);
      } else if (fetchedIdeas.length === 1) {
        setSelectedIdea(fetchedIdeas[0]);
      }
      // Add welcome message
      addWelcomeMessage();
    } catch (err) {
      Alert.alert('Error', 'Failed to load your ideas');
    } finally {
      setLoadingIdeas(false);
    }
  };

  const addWelcomeMessage = () => {
    setMessages([{
      id: 'welcome',
      role: 'agent',
      text: `Hello! I'm your ${agent.name}. ${agent.description}.\n\n${selectedIdea ? `I see you're working on "${selectedIdea.title}". How can I help you today?` : 'Select an idea above, then ask me anything about your startup!'}`,
      timestamp: new Date(),
    }]);
  };

  const handleSelectIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    setShowIdeaPicker(false);
    // Update welcome message with selected idea context
    setMessages([{
      id: 'welcome-updated',
      role: 'agent',
      text: `Great! Let's work on "${idea.title}".\n\nAs your ${agent.name}, I can help you with ${agent.description.toLowerCase()}.\n\nWhat would you like to explore?`,
      timestamp: new Date(),
    }]);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    if (!selectedIdea) {
      Alert.alert('Select an Idea', 'Please select an idea to discuss first.');
      setShowIdeaPicker(true);
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setText('');
    setSending(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages
        .filter(m => m.id !== 'welcome' && m.id !== 'welcome-updated')
        .map(m => ({ role: m.role, content: m.text }));

      const response = await agentAPI.chat({
        agentType,
        ideaId: selectedIdea._id,
        message: trimmed,
        conversationHistory,
      });

      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        text: response.text,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to get response');
      // Remove user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isAgent = item.role === 'agent';
    return (
      <View style={[styles.bubble, isAgent ? styles.agentBubble : styles.userBubble]}>
        {isAgent && (
          <View style={styles.agentHeader}>
            <Text style={[styles.agentEmoji, { backgroundColor: agent.color + '22' }]}>{agent.emoji}</Text>
            <Text style={[styles.agentName, { color: agent.color }]}>{agent.name}</Text>
          </View>
        )}
        <Text style={[styles.messageText, isAgent && styles.agentMessageText]}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (loadingIdeas) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={agent.color} />
        <Text style={styles.loadingText}>Loading your ideas...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Idea Selector */}
        <TouchableOpacity 
          style={[styles.ideaSelector, { borderColor: agent.color }]} 
          onPress={() => setShowIdeaPicker(!showIdeaPicker)}
        >
          <Text style={styles.ideaSelectorLabel}>Working on:</Text>
          <Text style={[styles.ideaSelectorValue, { color: agent.color }]}>
            {selectedIdea ? selectedIdea.title : 'Select an idea...'}
          </Text>
          <Text style={styles.ideaSelectorArrow}>{showIdeaPicker ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {/* Idea Picker Dropdown */}
        {showIdeaPicker && (
          <View style={styles.ideaPickerDropdown}>
            {ideas.length === 0 ? (
              <Text style={styles.noIdeasText}>No ideas yet. Create one first!</Text>
            ) : (
              ideas.map(idea => (
                <TouchableOpacity
                  key={idea._id}
                  style={[
                    styles.ideaPickerItem,
                    selectedIdea?._id === idea._id && { backgroundColor: agent.color + '15' }
                  ]}
                  onPress={() => handleSelectIdea(idea)}
                >
                  <Text style={styles.ideaPickerTitle}>{idea.title}</Text>
                  <Text style={styles.ideaPickerSummary} numberOfLines={1}>
                    {idea.oneLineSummary}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Start a conversation with your {agent.name}!</Text>
            </View>
          }
        />

        {/* Input Row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={`Ask the ${agent.name}...`}
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={2000}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: agent.color }, sending && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={sending || !text.trim()}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  loadingText: { color: COLORS.textMuted, marginTop: SPACING.sm, fontSize: FONTS.sm },
  
  // Idea Selector
  ideaSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 2,
  },
  ideaSelectorLabel: { 
    fontSize: FONTS.sm, 
    color: COLORS.textMuted, 
    marginRight: SPACING.xs 
  },
  ideaSelectorValue: { 
    flex: 1, 
    fontSize: FONTS.md, 
    fontWeight: '600' 
  },
  ideaSelectorArrow: { 
    fontSize: FONTS.sm, 
    color: COLORS.textMuted 
  },

  // Idea Picker Dropdown
  ideaPickerDropdown: {
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 200,
  },
  ideaPickerItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ideaPickerTitle: { 
    fontSize: FONTS.md, 
    fontWeight: '600', 
    color: COLORS.text 
  },
  ideaPickerSummary: { 
    fontSize: FONTS.sm, 
    color: COLORS.textMuted, 
    marginTop: 2 
  },
  noIdeasText: { 
    padding: SPACING.md, 
    color: COLORS.textMuted, 
    fontStyle: 'italic' 
  },

  // Messages
  messagesList: { padding: SPACING.md, flexGrow: 1 },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  agentBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.cardBg,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.accent + '22',
    borderBottomRightRadius: 4,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  agentEmoji: {
    fontSize: 16,
    padding: 4,
    borderRadius: 8,
    marginRight: SPACING.xs,
  },
  agentName: {
    fontSize: FONTS.sm,
    fontWeight: '700',
  },
  messageText: { 
    fontSize: FONTS.md, 
    color: COLORS.text, 
    lineHeight: 22 
  },
  agentMessageText: { 
    color: COLORS.textSecondary 
  },
  timestamp: { 
    fontSize: FONTS.xs, 
    color: COLORS.textMuted, 
    marginTop: SPACING.xs, 
    alignSelf: 'flex-end' 
  },
  emptyText: { 
    color: COLORS.textMuted, 
    fontSize: FONTS.md 
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: FONTS.md,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginLeft: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: '#FFF', fontWeight: '700', fontSize: FONTS.md },
});
