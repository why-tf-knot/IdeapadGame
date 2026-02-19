import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { messagingAPI } from '../services/api';
import { ChatMessage, ChatThread } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io as socketIO, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

interface Props {
  route: { params: { threadId: string; ideaTitle?: string; investorName?: string } };
  navigation: any;
}

export default function ChatScreen({ route, navigation }: Props) {
  const { threadId, ideaTitle, investorName } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: investorName ? `Chat with ${investorName}` : ideaTitle || 'Messages',
    });
    loadUserId();
    fetchMessages();
    connectSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_thread', threadId);
        socketRef.current.disconnect();
      }
    };
  }, []);

  const connectSocket = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const socket = socketIO(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_thread', threadId);
      });

      socket.on('new_message', (data: { threadId: string; message: ChatMessage }) => {
        if (data.threadId === threadId) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === data.message._id)) return prev;
            return [...prev, data.message];
          });
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          messagingAPI.markRead(threadId).catch(() => {});
        }
      });
    } catch (err) {
      console.warn('[ChatScreen] Socket connection failed, using HTTP only:', err);
    }
  };

  const loadUserId = async () => {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserId(user.id);
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      const data = await messagingAPI.getThread(threadId);
      setThread(data.thread);
      setMessages(data.messages);
      // Mark as read
      await messagingAPI.markRead(threadId);
    } catch (err: any) {
      if (loading) {
        Alert.alert('Error', 'Failed to load messages');
      }
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const { message } = await messagingAPI.sendMessage(threadId, trimmed);
      setMessages((prev) => [...prev, message]);
      setText('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMine = item.senderId === userId;
    return (
      <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
        <Text style={[styles.roleLabel, { color: isMine ? COLORS.accent : '#F59E0B' }]}>
          {item.senderRole === 'FOUNDER' ? 'You (Founder)' : investorName || 'Investor'}
        </Text>
        <Text style={[styles.messageText, isMine && styles.myMessageText]}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading encrypted messages...</Text>
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
        {ideaTitle && (
          <View style={styles.ideaBanner}>
            <Text style={styles.ideaBannerText}>Re: {ideaTitle}</Text>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No messages yet. Start a conversation!</Text>
              <Text style={styles.encryptedNote}>🔒 Messages are end-to-end encrypted</Text>
            </View>
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
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
  ideaBanner: {
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ideaBannerText: { color: COLORS.textMuted, fontSize: FONTS.sm, fontStyle: 'italic' },
  messagesList: { padding: SPACING.md, flexGrow: 1 },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.accent + '22',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.cardBg,
    borderBottomLeftRadius: 4,
  },
  roleLabel: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  messageText: { color: COLORS.text, fontSize: FONTS.md, lineHeight: 20 },
  myMessageText: { color: COLORS.text },
  timestamp: { color: COLORS.textMuted, fontSize: 10, textAlign: 'right', marginTop: 4 },
  emptyText: { color: COLORS.textSecondary, fontSize: FONTS.md, textAlign: 'center' },
  encryptedNote: { color: COLORS.textMuted, fontSize: FONTS.sm, marginTop: SPACING.sm },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.sm,
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
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginLeft: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: '#FFF', fontWeight: '700', fontSize: FONTS.md },
});
