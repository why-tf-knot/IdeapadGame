import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthResponse,
  User,
  Idea,
  WalletInfo,
  IdeaCreditInfo,
  InvestResponse,
  IdeaEquityInfo,
  EnrichedIdea,
  TokenType,
  TokenBalances,
  ChatThread,
  ChatMessage,
  InvestorTier,
} from '../types';

// Investor backend
const INVESTOR_API_URL = 'http://localhost:3002/api';
// Shared messaging service
const MESSAGING_API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: INVESTOR_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

const messagingApi = axios.create({
  baseURL: MESSAGING_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Auth interceptor for both clients
const attachToken = async (config: any) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(attachToken, (e) => Promise.reject(e));
messagingApi.interceptors.request.use(attachToken, (e) => Promise.reject(e));

// ─── Auth API ──────────────────────────────────────────

export const authAPI = {
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getMe: async (): Promise<{ user: User; walletBalance: number | null }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// ─── Review API ────────────────────────────────────────

export const reviewAPI = {
  getNext: async (): Promise<{ idea: Idea | null; message?: string }> => {
    const response = await api.get('/review/next');
    return response.data;
  },

  saveIdea: async (ideaId: string): Promise<{ message: string }> => {
    const response = await api.post(`/review/${ideaId}/save`);
    return response.data;
  },

  rejectIdea: async (ideaId: string): Promise<{ message: string }> => {
    const response = await api.post(`/review/${ideaId}/reject`);
    return response.data;
  },

  getSavedIdeas: async (): Promise<{ ideas: Idea[] }> => {
    const response = await api.get('/review/saved');
    return response.data;
  },
};

// ─── Credits API ───────────────────────────────────────

export const creditsAPI = {
  getWallet: async (): Promise<WalletInfo> => {
    const response = await api.get('/credits/wallet/me');
    return response.data;
  },

  invest: async (ideaId: string, amount: number, tokenType: TokenType): Promise<InvestResponse> => {
    const response = await api.post('/credits/invest', { ideaId, amount, tokenType });
    return response.data;
  },

  getIdeaCredits: async (ideaId: string): Promise<IdeaCreditInfo> => {
    const response = await api.get(`/credits/idea/${ideaId}`);
    return response.data;
  },

  claimMonthlyGrant: async (): Promise<{ message: string; tier: InvestorTier; granted: Record<string, number>; newBalances: TokenBalances }> => {
    const response = await api.post('/credits/grant');
    return response.data;
  },

  selectTier: async (tier: InvestorTier): Promise<{ message: string; tier: InvestorTier }> => {
    const response = await api.post('/credits/tier/select', { tier });
    return response.data;
  },

  getTiers: async (): Promise<{ tiers: { id: InvestorTier; grants: Record<string, number>; totalGrant: number }[] }> => {
    const response = await api.get('/credits/tiers');
    return response.data;
  },
};

// ─── Equity API ────────────────────────────────────────

export const equityAPI = {
  getIdeaEquity: async (ideaId: string): Promise<IdeaEquityInfo> => {
    const response = await api.get(`/equity/idea/${ideaId}`);
    return response.data;
  },
};

// ─── Batch API ─────────────────────────────────────────

export const batchAPI = {
  enrichIdeas: async (ideaIds: string[]): Promise<{ ideas: EnrichedIdea[] }> => {
    const response = await api.post('/batch/batch-enrich', { ideaIds });
    return response.data;
  },
};

// ─── Messaging API (via shared-services) ───────────────

export const messagingAPI = {
  /** Create or retrieve a thread for an idea between founder & investor */
  getOrCreateThread: async (ideaId: string, founderId: string): Promise<{ thread: ChatThread }> => {
    const response = await messagingApi.post('/messages/threads', { ideaId, founderId });
    return response.data;
  },

  /** List all threads for the current user (investor) */
  getMyThreads: async (): Promise<{ threads: ChatThread[] }> => {
    const response = await messagingApi.get('/messages/threads');
    return response.data;
  },

  /** Get thread messages (decrypted server-side) */
  getThread: async (threadId: string): Promise<{ thread: ChatThread; messages: ChatMessage[] }> => {
    const response = await messagingApi.get(`/messages/threads/${threadId}`);
    return response.data;
  },

  /** Send a message (encrypted server-side) */
  sendMessage: async (threadId: string, text: string): Promise<{ message: ChatMessage }> => {
    const response = await messagingApi.post(`/messages/threads/${threadId}/messages`, { text });
    return response.data;
  },

  /** Mark thread as read */
  markRead: async (threadId: string): Promise<void> => {
    await messagingApi.post(`/messages/threads/${threadId}/read`);
  },
};

// ─── Transfer History (via shared-services) ────────────

export const transferAPI = {
  getHistory: async (): Promise<{ transfers: any[] }> => {
    const response = await messagingApi.get('/transfers/history');
    return response.data;
  },

  getIdeaTransfers: async (ideaId: string): Promise<{ transfers: any[] }> => {
    const response = await messagingApi.get(`/transfers/idea/${ideaId}`);
    return response.data;
  },
};

export default api;
