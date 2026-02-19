// Founder App Types

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'FOUNDER';
}

export type TokenType = 'GEMINI' | 'ANTHROPIC' | 'PERPLEXITY' | 'CHATGPT';
export const TOKEN_TYPES: TokenType[] = ['GEMINI', 'ANTHROPIC', 'PERPLEXITY', 'CHATGPT'];

export const TOKEN_META: Record<TokenType, { label: string; icon: string; color: string; provider: string }> = {
  GEMINI:     { label: 'Gemini',     icon: '💎', color: '#4285F4', provider: 'Google' },
  ANTHROPIC:  { label: 'Anthropic',  icon: '🧠', color: '#D97706', provider: 'Anthropic' },
  PERPLEXITY: { label: 'Perplexity', icon: '🔍', color: '#22D3EE', provider: 'Perplexity' },
  CHATGPT:    { label: 'ChatGPT',    icon: '🤖', color: '#10A37F', provider: 'OpenAI' },
};

export interface TokenBalances {
  gemini: number;
  anthropic: number;
  perplexity: number;
  chatgpt: number;
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

export interface WizardAnswers {
  step1: string;
  step2: string;
  step3: string;
  step4: string;
}

export interface GeneratedPitch {
  pitchTitle: string;
  pitchIdea: string;
  pitchTarget: string;
  pitchSolves: string;
  pitchHow: string;
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
