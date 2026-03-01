import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthResponse,
  User,
  Idea,
  WizardAnswers,
  GeneratedPitch,
  SpendResponse,
  TokenType,
  TokenBalances,
  ChatThread,
  ChatMessage,
  PranaBalanceResponse,
  PranaExchangeResponse,
} from '../types';

// Founder backend
const FOUNDER_API_URL = 'http://localhost:3001/api';
// Shared messaging service
const MESSAGING_API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: FOUNDER_API_URL,
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

  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// ─── Ideas API ─────────────────────────────────────────

export const ideasAPI = {
  create: async (ideaData: Partial<Idea>): Promise<{ idea: Idea }> => {
    const response = await api.post('/ideas', ideaData);
    return response.data;
  },

  update: async (id: string, ideaData: Partial<Idea>): Promise<{ idea: Idea }> => {
    const response = await api.put(`/ideas/${id}`, ideaData);
    return response.data;
  },

  getMyIdeas: async (): Promise<{ ideas: Idea[] }> => {
    const response = await api.get('/ideas/my');
    return response.data;
  },

  getById: async (id: string): Promise<{ idea: Idea }> => {
    const response = await api.get(`/ideas/${id}`);
    return response.data;
  },

  generatePitch: async (wizardAnswers: WizardAnswers): Promise<{ idea: Idea }> => {
    const response = await api.post('/ideas/generate-pitch', { wizardAnswers });
    return response.data;
  },

  finalizePitch: async (ideaId: string, pitchData: GeneratedPitch & { pitchTitle: string }): Promise<{ idea: Idea }> => {
    const response = await api.post(`/ideas/${ideaId}/finalize`, pitchData);
    return response.data;
  },
};

// ─── Credits API (founder side — spend AI credits) ─────

export const creditsAPI = {
  getIdeaCredits: async (ideaId: string): Promise<{ balance: number; balances: TokenBalances }> => {
    const response = await api.get(`/credits/idea/${ideaId}`);
    return response.data;
  },

  spend: async (ideaId: string, amount: number, service: string, tokenType: TokenType): Promise<SpendResponse> => {
    const response = await api.post('/credits/spend', { ideaId, amount, service, tokenType });
    return response.data;
  },
};

// ─── Prana API (founder Prana wallet & exchange) ───────

export const pranaAPI = {
  /** Get current Prana balance, exchange rates, and affordability per token */
  getBalance: async (): Promise<PranaBalanceResponse> => {
    const response = await api.get('/credits/prana/balance');
    return response.data;
  },

  /** Get current market exchange rates */
  getRates: async (): Promise<{ rates: Record<TokenType, number> }> => {
    const response = await api.get('/credits/prana/rates');
    return response.data;
  },

  /** Exchange Prana for AI credits on a specific idea */
  exchange: async (
    ideaId: string,
    tokenType: TokenType,
    credits: number
  ): Promise<PranaExchangeResponse> => {
    const response = await api.post('/credits/prana/exchange', {
      ideaId,
      tokenType,
      credits,
    });
    return response.data;
  },
};

// ─── Messaging API (via shared-services) ───────────────

export const messagingAPI = {
  /** Create or retrieve a thread for an idea between founder & investor */
  getOrCreateThread: async (ideaId: string, investorId: string): Promise<{ thread: ChatThread }> => {
    const response = await messagingApi.post('/messages/threads', { ideaId, investorId });
    return response.data;
  },

  /** List all threads for the current user (founder) */
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

// ─── Agent Chat API (specialized AI agents for founders) ───

export type AgentType = 'business' | 'science' | 'marketing' | 'developer';

interface AgentChatRequest {
  agentType: AgentType;
  ideaId: string;
  message: string;
  conversationHistory?: { role: string; content: string }[];
}

interface AgentChatResponse {
  text: string;
  tokensUsed?: number;
}

export const agentAPI = {
  /** Send a message to a specialized agent and get a response */
  chat: async (request: AgentChatRequest): Promise<AgentChatResponse> => {
    const response = await api.post('/agents/chat', request);
    return response.data;
  },

  /** Get a one-off suggestion from an agent (no conversation context) */
  getSuggestion: async (
    agentType: AgentType, 
    ideaId: string, 
    prompt?: string
  ): Promise<AgentChatResponse> => {
    const response = await api.post('/agents/suggest', { agentType, ideaId, prompt });
    return response.data;
  },
};

export default api;
