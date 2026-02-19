import mongoose, { Schema, Document, Types } from 'mongoose';

export type InvestorIdeaStatusType = 'UNSEEN' | 'SAVED' | 'REJECTED';

export interface IInvestorIdeaStatus extends Document {
  investorId: Types.ObjectId;
  ideaId: Types.ObjectId;
  status: InvestorIdeaStatusType;
  createdAt: Date;
  updatedAt: Date;
}

const InvestorIdeaStatusSchema = new Schema<IInvestorIdeaStatus>(
  {
    investorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ideaId: { type: Schema.Types.ObjectId, ref: 'Idea', required: true },
    status: {
      type: String,
      enum: ['UNSEEN', 'SAVED', 'REJECTED'],
      default: 'UNSEEN',
    },
  },
  { timestamps: true }
);

InvestorIdeaStatusSchema.index({ investorId: 1, ideaId: 1 }, { unique: true });

export const InvestorIdeaStatus = mongoose.model<IInvestorIdeaStatus>(
  'InvestorIdeaStatus',
  InvestorIdeaStatusSchema
);
