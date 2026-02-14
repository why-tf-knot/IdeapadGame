import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IAiCreditWallet extends Document {
  _id: ObjectId;
  userId: ObjectId;
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
