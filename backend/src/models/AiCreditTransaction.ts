import mongoose, { Schema, Document, Types } from 'mongoose';

export type AiCreditTransactionType = 
  | 'GRANT_TO_INVESTOR' 
  | 'INVEST_IN_IDEA' 
  | 'SPEND_ON_AI_SERVICE';

export interface IAiCreditTransaction extends Document {
  fromUserId?: Types.ObjectId | null;
  toUserId?: Types.ObjectId | null;
  ideaId?: Types.ObjectId | null;
  type: AiCreditTransactionType;
  amount: number;
  memo?: string;
  createdAt: Date;
}

const AiCreditTransactionSchema = new Schema<IAiCreditTransaction>(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    ideaId: { type: Schema.Types.ObjectId, ref: 'Idea', default: null },
    type: { 
      type: String, 
      enum: ['GRANT_TO_INVESTOR', 'INVEST_IN_IDEA', 'SPEND_ON_AI_SERVICE'], 
      required: true 
    },
    amount: { type: Number, required: true, min: 0 },
    memo: { type: String },
  },
  { timestamps: true }
);

export const AiCreditTransaction = mongoose.model<IAiCreditTransaction>(
  'AiCreditTransaction',
  AiCreditTransactionSchema
);
