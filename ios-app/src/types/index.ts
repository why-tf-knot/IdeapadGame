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
  status: 'PENDING_REVIEW' | 'ACTIVE' | 'ARCHIVED';
  aiCredits?: number;
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
  };
  transactions: any[];
}
