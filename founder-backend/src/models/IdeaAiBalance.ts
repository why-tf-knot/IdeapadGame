import mongoose, { Schema, Document, Types } from 'mongoose';

export const TOKEN_TYPES = ['GEMINI', 'ANTHROPIC', 'PERPLEXITY', 'CHATGPT', 'MISTRAL', 'DEEPSEEK', 'GROK', 'LLAMA'] as const;
export type TokenType = typeof TOKEN_TYPES[number];

export interface IIdeaAiBalance extends Document {
  ideaId: Types.ObjectId;
  balance: number;
  geminiBalance: number;
  anthropicBalance: number;
  perplexityBalance: number;
  chatgptBalance: number;
  mistralBalance: number;
  deepseekBalance: number;
  grokBalance: number;
  llamaBalance: number;
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
    mistralBalance: { type: Number, default: 0, min: 0 },
    deepseekBalance: { type: Number, default: 0, min: 0 },
    grokBalance: { type: Number, default: 0, min: 0 },
    llamaBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export function ideaTokenField(tokenType: TokenType): string {
  const map: Record<TokenType, string> = {
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

/** Build a { gemini: N, anthropic: N, ... } object from an IdeaAiBalance doc */
export function buildIdeaBalances(doc: IIdeaAiBalance | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const tt of TOKEN_TYPES) {
    out[tt.toLowerCase()] = doc ? (doc as any)[ideaTokenField(tt)] || 0 : 0;
  }
  return out;
}

export const IdeaAiBalance = mongoose.model<IIdeaAiBalance>('IdeaAiBalance', IdeaAiBalanceSchema);
