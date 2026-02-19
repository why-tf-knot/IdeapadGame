// Investor App Types

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'INVESTOR';
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
