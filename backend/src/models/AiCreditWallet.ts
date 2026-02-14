import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAiCreditWallet extends Document {
  userId: Types.ObjectId;
  totalBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const AiCreditWalletSchema = new Schema<IAiCreditWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    totalBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const AiCreditWallet = mongoose.model<IAiCreditWallet>('AiCreditWallet', AiCreditWalletSchema);
