// Investor App Types

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'INVESTOR';
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

// ─── Investor Tiers ──────────────────────────────────────

export type InvestorTier = 'SHISHYA' | 'SAARTHI' | 'SHOOR';
export const INVESTOR_TIERS: InvestorTier[] = ['SHISHYA', 'SAARTHI', 'SHOOR'];

export interface TierMeta {
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  gradientStart: string;
  gradientEnd: string;
  perToken: number;
  totalGrant: number;
  description: string;
}

export const TIER_META: Record<InvestorTier, TierMeta> = {
  SHISHYA: {
    label: 'Shishya',
    subtitle: 'शिष्य · Disciple',
    icon: '🌱',
    color: '#00B894',
    gradientStart: '#00B894',
    gradientEnd: '#00D2D3',
    perToken: 100,
    totalGrant: 400,
    description: 'Start your journey. 100 of each AI token monthly — perfect for exploring ideas.',
  },
  SAARTHI: {
    label: 'Saarthi',
    subtitle: 'सारथी · Guide',
    icon: '⚡',
    color: '#6C5CE7',
    gradientStart: '#6C5CE7',
    gradientEnd: '#A29BFE',
    perToken: 250,
    totalGrant: 1000,
    description: 'Lead the way. 250 of each AI token monthly — invest in multiple promising ideas.',
  },
  SHOOR: {
    label: 'Shoor',
    subtitle: 'शूर · Warrior',
    icon: '🔥',
    color: '#FDCB6E',
    gradientStart: '#FDCB6E',
    gradientEnd: '#E17055',
    perToken: 500,
    totalGrant: 2000,
    description: 'Dominate the arena. 500 of each AI token monthly — back bold visions at scale.',
  },
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

export interface Idea {
  _id: string;
  founderId: string;
  title: string;
  oneLineSummary: string;
  category: string;
  stage: string;
  targetUser: string;
  problem: string;
  solution: string;
  differentiation: string;
  monetization: string;
  roadmap: string;
  deckSlides: string[];
  status: string;
  pitchTitle?: string;
  pitchIdea?: string;
  pitchTarget?: string;
  pitchSolves?: string;
  pitchHow?: string;
  pitchImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface WalletInfo {
  wallet: {
    tier: InvestorTier;
    balance: number;
    balances: TokenBalances;
  };
  transactions: Transaction[];
}

export interface Transaction {
  _id: string;
  fromUserId?: string;
  toUserId?: string;
  ideaId?: string;
  type: 'INVEST_IN_IDEA' | 'SPEND_ON_AI_SERVICE' | 'MONTHLY_GRANT';
  tokenType: TokenType;
  amount: number;
  memo?: string;
  createdAt: string;
}

export interface InvestResponse {
  message: string;
  newBalance: number;
  newBalances: TokenBalances;
  ideaBalance: number;
  ideaBalances: TokenBalances;
}

export interface CreditAllocation {
  investor: { _id: string; name: string; email: string };
  tokenType: TokenType;
  amount: number;
}

export interface IdeaCreditInfo {
  balance: number;
  balances: TokenBalances;
  allocations: CreditAllocation[];
}

export interface EquityMapping {
  investorId: string;
  investorName: string;
  creditsAllocated: number;
  tokenAllocations?: { tokenType: TokenType; amount: number }[];
  estimatedEquityPercent: number;
}

export interface TokenBreakdown {
  invested: number;
  spent: number;
}

export interface IdeaEquityInfo {
  ideaId: string;
  totalCreditsInvested: number;
  totalCreditsSpent: number;
  totalEquityPercent: number;
  tokenBreakdown?: Record<TokenType, TokenBreakdown>;
  investorEquity: EquityMapping[];
}

export interface EnrichedIdea extends Idea {
  myCredits?: number;
  totalCredits?: number;
  tokenBalances?: TokenBalances;
  equityPercent?: number;
  totalAllocated?: number;
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
