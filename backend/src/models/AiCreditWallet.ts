import mongoose, { Schema, Document, Types } from 'mongoose';

export const TOKEN_TYPES = ['GEMINI', 'ANTHROPIC', 'PERPLEXITY', 'CHATGPT'] as const;
export type TokenType = typeof TOKEN_TYPES[number];

export interface TokenBalances {
  gemini: number;
  anthropic: number;
  perplexity: number;
  chatgpt: number;
}

export interface IAiCreditWallet extends Document {
  userId: Types.ObjectId;
  /** @deprecated Use per-token balances instead */
  totalBalance: number;
  geminiBalance: number;
  anthropicBalance: number;
  perplexityBalance: number;
  chatgptBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const AiCreditWalletSchema = new Schema<IAiCreditWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    totalBalance: { type: Number, default: 0, min: 0 },
    geminiBalance: { type: Number, default: 0, min: 0 },
    anthropicBalance: { type: Number, default: 0, min: 0 },
    perplexityBalance: { type: Number, default: 0, min: 0 },
    chatgptBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

/** Helper: get the balance field name for a token type */
export function tokenBalanceField(tokenType: TokenType): keyof IAiCreditWallet {
  const map: Record<TokenType, keyof IAiCreditWallet> = {
    GEMINI: 'geminiBalance',
    ANTHROPIC: 'anthropicBalance',
    PERPLEXITY: 'perplexityBalance',
    CHATGPT: 'chatgptBalance',
  };
  return map[tokenType];
}

export const AiCreditWallet = mongoose.model<IAiCreditWallet>('AiCreditWallet', AiCreditWalletSchema);
