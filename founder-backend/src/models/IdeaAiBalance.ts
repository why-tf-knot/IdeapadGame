import mongoose, { Schema, Document, Types } from 'mongoose';

export const TOKEN_TYPES = ['GEMINI', 'ANTHROPIC', 'PERPLEXITY', 'CHATGPT'] as const;
export type TokenType = typeof TOKEN_TYPES[number];

export interface IIdeaAiBalance extends Document {
  ideaId: Types.ObjectId;
  balance: number;
  geminiBalance: number;
  anthropicBalance: number;
  perplexityBalance: number;
  chatgptBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const IdeaAiBalanceSchema = new Schema<IIdeaAiBalance>(
  {
    ideaId: { type: Schema.Types.ObjectId, ref: 'Idea', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    geminiBalance: { type: Number, default: 0, min: 0 },
    anthropicBalance: { type: Number, default: 0, min: 0 },
    perplexityBalance: { type: Number, default: 0, min: 0 },
    chatgptBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export function ideaTokenField(tokenType: TokenType): string {
  const map: Record<TokenType, string> = {
    GEMINI: 'geminiBalance',
    ANTHROPIC: 'anthropicBalance',
    PERPLEXITY: 'perplexityBalance',
    CHATGPT: 'chatgptBalance',
  };
  return map[tokenType];
}

export const IdeaAiBalance = mongoose.model<IIdeaAiBalance>('IdeaAiBalance', IdeaAiBalanceSchema);
