import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IAiCreditAllocation extends Document {
  _id: ObjectId;
  ideaId: ObjectId;
  investorId: ObjectId;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AiCreditAllocationSchema = new Schema<IAiCreditAllocation>(
  {
    ideaId: { type: Schema.Types.ObjectId, ref: 'Idea', required: true },
    investorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Compound index to ensure one allocation per investor-idea pair
AiCreditAllocationSchema.index({ investorId: 1, ideaId: 1 }, { unique: true });

export const AiCreditAllocation = mongoose.model<IAiCreditAllocation>(
  'AiCreditAllocation',
  AiCreditAllocationSchema
);
