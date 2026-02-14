import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IIdeaAiBalance extends Document {
  ideaId: Types.ObjectId;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const IdeaAiBalanceSchema = new Schema<IIdeaAiBalance>(
  {
    ideaId: { type: Schema.Types.ObjectId, ref: 'Idea', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const IdeaAiBalance = mongoose.model<IIdeaAiBalance>('IdeaAiBalance', IdeaAiBalanceSchema);
