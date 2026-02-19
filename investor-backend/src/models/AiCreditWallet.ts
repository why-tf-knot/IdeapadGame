import mongoose, { Schema, Document, Types } from 'mongoose';

export const TOKEN_TYPES = ['GEMINI', 'ANTHROPIC', 'PERPLEXITY', 'CHATGPT'] as const;
export type TokenType = typeof TOKEN_TYPES[number];

export interface IAiCreditWallet extends Document {
  userId: Types.ObjectId;
  totalBalance: number;
  geminiBalance: number;
  anthropicBalance: number;
  perplexityBalance: number;
  chatgptBalance: number;
  lastGrantAt: Date | null;
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
  };
  return map[tokenType];
}

export const AiCreditWallet = mongoose.model<IAiCreditWallet>('AiCreditWallet', AiCreditWalletSchema);
