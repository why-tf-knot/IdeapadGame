export interface User {
  id: string;
  name: string;
  email: string;
  role: 'FOUNDER' | 'INVESTOR';
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
  amount: number;
  memo?: string;
  createdAt: string;
}

export interface CreditAllocation {
  investor: { _id: string; name: string; email: string };
  amount: number;
}

export interface IdeaCreditInfo {
  balance: number;
  allocations: CreditAllocation[];
}

export interface InvestResponse {
  message: string;
  newBalance: number;
  ideaBalance: number;
}

export interface SpendResponse {
  message: string;
  newBalance: number;
  result: string;
  tokensUsed: number;
  cached: boolean;
}

export interface EquityMapping {
  investorId: string;
  investorName: string;
  creditsAllocated: number;
  estimatedEquityPercent: number;
}

export interface IdeaEquityInfo {
  ideaId: string;
  totalCreditsInvested: number;
  totalCreditsSpent: number;
  totalEquityPercent: number;
  investorEquity: EquityMapping[];
}

// ─── Enriched Idea (from batch API) ─────────────────────

export interface EnrichedIdea extends Idea {
  myCredits?: number;
  totalCredits?: number;
  equityPercent?: number;
  totalAllocated?: number;
}

