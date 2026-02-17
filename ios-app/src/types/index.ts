export interface User {
  id: string;
  name: string;
  email: string;
  role: 'FOUNDER' | 'INVESTOR';
}

// ─── Token Types ─────────────────────────────────────────

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
  // Wizard step answers
  wizardStep1?: string; // Your idea in one sentence (250 chars)
  wizardStep2?: string; // Who benefits from your idea (400 chars)
  wizardStep3?: string; // What challenges does it solve (400 chars)
  wizardStep4?: string; // How will you bring it to life (400 chars)
  // AI-generated pitch fields
  pitchTitle?: string;       // AI-generated name (editable)
  pitchIdea?: string;        // AI-generated "The Idea" card
  pitchTarget?: string;      // AI-generated "The Target" card
  pitchSolves?: string;      // AI-generated "What it Solves" card
  pitchHow?: string;         // AI-generated "How it Works" card
  pitchImageUrl?: string;    // AI-generated pitch card image
  pitchStatus?: 'DRAFT' | 'GENERATED' | 'FINALIZED';
  createdAt: string;
  updatedAt: string;
}

export interface WizardAnswers {
  step1: string; // Your idea in one sentence
  step2: string; // Who benefits
  step3: string; // What challenges solved
  step4: string; // How to bring to life
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

export interface WalletInfo {
  wallet: {
    balance: number;
    balances: TokenBalances;
  };
  transactions: Transaction[];
}

// ─── Credit & Equity Types ──────────────────────────────

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

export interface InvestResponse {
  message: string;
  newBalance: number;
  newBalances: TokenBalances;
  ideaBalance: number;
  ideaBalances: TokenBalances;
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

// ─── Enriched Idea (from batch API) ─────────────────────

export interface EnrichedIdea extends Idea {
  myCredits?: number;
  totalCredits?: number;
  tokenBalances?: TokenBalances;
  equityPercent?: number;
  totalAllocated?: number;
}

