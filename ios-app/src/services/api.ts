import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, User, Idea, WalletInfo } from '../types';

// Update this to your backend URL
const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  register: async (name: string, email: string, password: string, role: 'FOUNDER' | 'INVESTOR'): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { name, email, password, role });
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

// Ideas API
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
};

// Review API
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

// Credits API
export const creditsAPI = {
  getWallet: async (): Promise<WalletInfo> => {
    const response = await api.get('/credits/wallet/me');
    return response.data;
  },

  invest: async (ideaId: string, amount: number): Promise<any> => {
    const response = await api.post('/credits/invest', { ideaId, amount });
    return response.data;
  },

  spend: async (ideaId: string, amount: number, service: string): Promise<any> => {
    const response = await api.post('/credits/spend', { ideaId, amount, service });
    return response.data;
  },

  getIdeaCredits: async (ideaId: string): Promise<any> => {
    const response = await api.get(`/credits/idea/${ideaId}`);
    return response.data;
  },
};

// Equity API
export const equityAPI = {
  getIdeaEquity: async (ideaId: string): Promise<any> => {
    const response = await api.get(`/equity/idea/${ideaId}`);
    return response.data;
  },
};

export default api;
