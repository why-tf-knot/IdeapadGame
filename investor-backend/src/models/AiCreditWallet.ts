import mongoose, { Schema, Document, Types } from 'mongoose';

export const TOKEN_TYPES = ['GEMINI', 'ANTHROPIC', 'PERPLEXITY', 'CHATGPT', 'MISTRAL', 'DEEPSEEK', 'GROK', 'LLAMA'] as const;
export type TokenType = typeof TOKEN_TYPES[number];

export const INVESTOR_TIERS = ['SHISHYA', 'SAARTHI', 'SHOOR'] as const;
export type InvestorTier = typeof INVESTOR_TIERS[number];

/** Per-token grant amounts for each tier (in AI credits) */
export const TIER_GRANTS: Record<InvestorTier, Record<TokenType, number>> = {
  SHISHYA: { GEMINI: 100, ANTHROPIC: 100, PERPLEXITY: 100, CHATGPT: 100, MISTRAL: 100, DEEPSEEK: 100, GROK: 100, LLAMA: 100 },   // 800 total
  SAARTHI: { GEMINI: 250, ANTHROPIC: 250, PERPLEXITY: 250, CHATGPT: 250, MISTRAL: 250, DEEPSEEK: 250, GROK: 250, LLAMA: 250 },   // 2,000 total
  SHOOR:   { GEMINI: 500, ANTHROPIC: 500, PERPLEXITY: 500, CHATGPT: 500, MISTRAL: 500, DEEPSEEK: 500, GROK: 500, LLAMA: 500 },   // 4,000 total
};

/**
 * Prana (प्राण) — the native cryptocurrency of BuildPaper.
 * Each AI credit has a market exchange rate in Prana, reflecting
 * the real-world cost of the underlying AI provider.
 * Rates float based on market conditions (API pricing tiers).
 */
export const PRANA_MARKET_RATES: Record<TokenType, number> = {
  GEMINI:     1.2,   // 1 Gemini credit = 1.2 ₽
  ANTHROPIC:  1.8,   // 1 Anthropic credit = 1.8 ₽ (premium)
  PERPLEXITY: 0.8,   // 1 Perplexity credit = 0.8 ₽
  CHATGPT:    1.5,   // 1 ChatGPT credit = 1.5 ₽
  MISTRAL:    1.0,   // 1 Mistral credit = 1.0 ₽
  DEEPSEEK:   0.6,   // 1 DeepSeek credit = 0.6 ₽ (budget)
  GROK:       1.3,   // 1 Grok credit = 1.3 ₽
  LLAMA:      0.4,   // 1 Llama credit = 0.4 ₽ (open-source)
};

export interface IAiCreditWallet extends Document {
  userId: Types.ObjectId;
  tier: InvestorTier;
  pranaBalance: number;
  totalBalance: number;
  geminiBalance: number;
  anthropicBalance: number;
  perplexityBalance: number;
  chatgptBalance: number;
  mistralBalance: number;
  deepseekBalance: number;
  grokBalance: number;
  llamaBalance: number;
  lastGrantAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AiCreditWalletSchema = new Schema<IAiCreditWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    tier: { type: String, enum: INVESTOR_TIERS, default: 'SHISHYA' },
    pranaBalance: { type: Number, default: 0, min: 0 },
    totalBalance: { type: Number, default: 0, min: 0 },
    geminiBalance: { type: Number, default: 0, min: 0 },
    anthropicBalance: { type: Number, default: 0, min: 0 },
    perplexityBalance: { type: Number, default: 0, min: 0 },
    chatgptBalance: { type: Number, default: 0, min: 0 },
    mistralBalance: { type: Number, default: 0, min: 0 },
    deepseekBalance: { type: Number, default: 0, min: 0 },
    grokBalance: { type: Number, default: 0, min: 0 },
    llamaBalance: { type: Number, default: 0, min: 0 },
    lastGrantAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export function tokenBalanceField(tokenType: TokenType): keyof IAiCreditWallet {
  const map: Record<TokenType, keyof IAiCreditWallet> = {
    GEMINI: 'geminiBalance',
    ANTHROPIC: 'anthropicBalance',
    PERPLEXITY: 'perplexityBalance',
    CHATGPT: 'chatgptBalance',
    MISTRAL: 'mistralBalance',
    DEEPSEEK: 'deepseekBalance',
    GROK: 'grokBalance',
    LLAMA: 'llamaBalance',
  };
  return map[tokenType];
}

/** Calculate total portfolio value in Prana across all token holdings */
export function calcPranaValue(wallet: IAiCreditWallet, rates = PRANA_MARKET_RATES): number {
  let total = wallet.pranaBalance || 0;
  for (const tt of TOKEN_TYPES) {
    const bal = (wallet as any)[tokenBalanceField(tt)] || 0;
    total += bal * (rates[tt] || 1);
  }
  return Math.round(total * 100) / 100;
}

export const AiCreditWallet = mongoose.model<IAiCreditWallet>('AiCreditWallet', AiCreditWalletSchema);
