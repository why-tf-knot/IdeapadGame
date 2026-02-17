import mongoose, { Schema, Document, Types } from 'mongoose';
import { TOKEN_TYPES, TokenType } from './AiCreditWallet';

export interface IAiCreditAllocation extends Document {
  ideaId: Types.ObjectId;
  investorId: Types.ObjectId;
  tokenType: TokenType;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AiCreditAllocationSchema = new Schema<IAiCreditAllocation>(
  {
    ideaId: { type: Schema.Types.ObjectId, ref: 'Idea', required: true },
    investorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenType: { type: String, enum: TOKEN_TYPES, required: true },
    amount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Compound index to ensure one allocation per investor-idea-tokenType triple
AiCreditAllocationSchema.index({ investorId: 1, ideaId: 1, tokenType: 1 }, { unique: true });

export const AiCreditAllocation = mongoose.model<IAiCreditAllocation>(
  'AiCreditAllocation',
  AiCreditAllocationSchema
);
