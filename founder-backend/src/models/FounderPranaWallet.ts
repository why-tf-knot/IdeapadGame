import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Prana (प्राण) — the native cryptocurrency of BuildPaper.
 * Founders receive Prana and can exchange it for any AI credit token
 * at market rates to power their idea tools.
 */

export const TOKEN_TYPES = ['GEMINI', 'ANTHROPIC', 'PERPLEXITY', 'CHATGPT', 'MISTRAL', 'DEEPSEEK', 'GROK', 'LLAMA'] as const;
export type TokenType = typeof TOKEN_TYPES[number];

/** Exchange rates: 1 AI credit of token X costs this many Prana (₽) */
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

/** Starting Prana balance for new founders */
export const FOUNDER_INITIAL_PRANA = 500;

export interface IFounderPranaWallet extends Document {
  userId: Types.ObjectId;
  pranaBalance: number;
  totalExchanged: number; // lifetime Prana spent on exchanges
  createdAt: Date;
  updatedAt: Date;
}

const FounderPranaWalletSchema = new Schema<IFounderPranaWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    pranaBalance: { type: Number, default: FOUNDER_INITIAL_PRANA, min: 0 },
    totalExchanged: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

/**
 * Calculate how many AI credits of a given token a founder can buy
 * with their current Prana balance.
 */
export function maxCreditsForPrana(pranaBalance: number, tokenType: TokenType): number {
  const rate = PRANA_MARKET_RATES[tokenType];
  return Math.floor(pranaBalance / rate);
}

/**
 * Calculate Prana cost for a given number of AI credits.
 */
export function pranaCostForCredits(credits: number, tokenType: TokenType): number {
  return Math.round(credits * PRANA_MARKET_RATES[tokenType] * 100) / 100;
}

export const FounderPranaWallet = mongoose.model<IFounderPranaWallet>(
  'FounderPranaWallet',
  FounderPranaWalletSchema
);
