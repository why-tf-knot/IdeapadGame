// Founder App Types

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'FOUNDER';
  pranaBalance?: number;
  totalExchanged?: number;
  pranaRates?: Record<TokenType, number>;
}

export type TokenType = 'GEMINI' | 'ANTHROPIC' | 'PERPLEXITY' | 'CHATGPT' | 'MISTRAL' | 'DEEPSEEK' | 'GROK' | 'LLAMA';
export const TOKEN_TYPES: TokenType[] = ['GEMINI', 'ANTHROPIC', 'PERPLEXITY', 'CHATGPT', 'MISTRAL', 'DEEPSEEK', 'GROK', 'LLAMA'];

export const TOKEN_META: Record<TokenType, { label: string; icon: string; color: string; provider: string }> = {
  GEMINI:     { label: 'Gemini',     icon: '💎', color: '#4285F4', provider: 'Google' },
  ANTHROPIC:  { label: 'Anthropic',  icon: '🧠', color: '#D97706', provider: 'Anthropic' },
  PERPLEXITY: { label: 'Perplexity', icon: '🔍', color: '#22D3EE', provider: 'Perplexity' },
  CHATGPT:    { label: 'ChatGPT',    icon: '🤖', color: '#10A37F', provider: 'OpenAI' },
  MISTRAL:    { label: 'Mistral',    icon: '🌀', color: '#FF6F00', provider: 'Mistral AI' },
  DEEPSEEK:   { label: 'DeepSeek',   icon: '🔭', color: '#1E88E5', provider: 'DeepSeek' },
  GROK:       { label: 'Grok',       icon: '⚡', color: '#9C27B0', provider: 'xAI' },
  LLAMA:      { label: 'Llama',      icon: '🦙', color: '#0467DF', provider: 'Meta' },
};

export interface TokenBalances {
  gemini: number;
  anthropic: number;
  perplexity: number;
  chatgpt: number;
  mistral: number;
  deepseek: number;
  grok: number;
  llama: number;
}

/** Prana (₽) exchange rates per AI credit */
export const PRANA_MARKET_RATES: Record<TokenType, number> = {
  GEMINI:     1.2,
  ANTHROPIC:  1.8,
  PERPLEXITY: 0.8,
  CHATGPT:    1.5,
  MISTRAL:    1.0,
  DEEPSEEK:   0.6,
  GROK:       1.3,
  LLAMA:      0.4,
};

export interface PranaBalanceResponse {
  pranaBalance: number;
  totalExchanged: number;
  rates: Record<TokenType, number>;
  affordability: Record<TokenType, number>;
}

export interface PranaExchangeResponse {
  message: string;
  pranaSpent: number;
  pranaRemaining: number;
  creditsAdded: number;
  tokenType: TokenType;
  ideaBalances: TokenBalances;
}

export interface Idea {
  _id: string;
  founderId: string;
  title: string;
  oneLineSummary: string;
  category: 'App' | 'Website' | 'SaaS' | 'AI Tool' | 'Content/Productized Service' | 'Other';
  stage: 'Idea' | 'Prototype' | 'MVP' | 'Launched';
  targetUser: string;
  problem: string;
  solution: string;
  differentiation: string;
  monetization: string;
  roadmap: string;
  deckSlides: string[];
  status: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'ARCHIVED';
  aiCredits?: number;
  wizardStep1?: string;
  wizardStep2?: string;
  wizardStep3?: string;
  wizardStep4?: string;
  pitchTitle?: string;
  pitchIdea?: string;
  pitchTarget?: string;
  pitchSolves?: string;
  pitchHow?: string;
  pitchImageUrl?: string;
  pitchStatus?: 'DRAFT' | 'GENERATED' | 'FINALIZED';
  createdAt: string;
  updatedAt: string;
}

// Now supports an array of answers for flexible wizard length
export type WizardAnswers = string[];

// Expanded for richer visual Idea Paper
export interface GeneratedPitch {
  pitchTitle: string;
  pitchIdea: string;
  pitchTarget: string;
  pitchSolves: string;
  pitchHow: string;
  pitchDesign?: string;
  pitchGoToMarket?: string;
  pitchBusinessModel?: string;
  pitchRoadmap?: string;
  pitchImageUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SpendResponse {
  message: string;
  newBalance: number;
  newBalances: TokenBalances;
  result: string;
  tokensUsed: number;
  tokenType: TokenType;
  cached: boolean;
}

// ─── Messaging Types ─────────────────────────────────────

export interface ChatMessage {
  _id: string;
  senderId: string;
  senderRole: 'FOUNDER' | 'INVESTOR';
  text: string;
  read: boolean;
  createdAt: string;
}

export interface ChatThread {
  _id: string;
  ideaId: string;
  founderId: string | { _id: string; name: string };
  investorId: string | { _id: string; name: string };
  messageCount?: number;
  founderUnread: number;
  investorUnread: number;
  lastActivity: string;
  isActive: boolean;
}
