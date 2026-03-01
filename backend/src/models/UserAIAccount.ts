import mongoose, { Schema, Document, Types } from 'mongoose';

export type AIProvider = 'GEMINI' | 'ANTHROPIC' | 'PERPLEXITY' | 'CHATGPT';

export interface IUserAIAccount {
  provider: AIProvider;
  apiKey: string;
  accountEmail?: string;
  linkedAt: Date;
}

export interface IUserAIAccountDoc extends IUserAIAccount, Document {}

const UserAIAccountSchema = new Schema<IUserAIAccountDoc>({
  provider: { type: String, enum: ['GEMINI', 'ANTHROPIC', 'PERPLEXITY', 'CHATGPT'], required: true },
  apiKey: { type: String, required: true },
  accountEmail: { type: String },
  linkedAt: { type: Date, default: Date.now },
});

export const UserAIAccount = mongoose.model<IUserAIAccountDoc>('UserAIAccount', UserAIAccountSchema);
