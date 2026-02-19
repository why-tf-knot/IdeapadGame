import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Cross-service credit transfer ledger.
 * Records every credit movement between investor wallets and idea balances,
 * providing an immutable audit trail that both services can verify.
 */

export type TransferType =
  | 'INVESTOR_TO_IDEA'      // Investor invests tokens in a founder's idea
  | 'IDEA_TO_AI_SERVICE'    // Founder spends idea tokens on AI
  | 'MONTHLY_GRANT'         // System grants tokens to investor
  | 'REFUND';               // Reversed/refunded transfer

export type TransferStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';

export const TOKEN_TYPES = ['GEMINI', 'ANTHROPIC', 'PERPLEXITY', 'CHATGPT'] as const;
export type TokenType = typeof TOKEN_TYPES[number];

export interface ICreditTransfer extends Document {
  /** Unique idempotency key to prevent double-processing */
  transferId: string;
  type: TransferType;
  status: TransferStatus;
  tokenType: TokenType;
  amount: number;

  // Participants
  fromUserId?: Types.ObjectId | null;
  toUserId?: Types.ObjectId | null;
  ideaId?: Types.ObjectId | null;

  // Service tracking
  initiatedBy: 'founder-backend' | 'investor-backend' | 'system';
  /** Correlation ID for distributed tracing */
  correlationId: string;

  memo: string;
  metadata?: Record<string, any>;

  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CreditTransferSchema = new Schema<ICreditTransfer>(
  {
    transferId: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ['INVESTOR_TO_IDEA', 'IDEA_TO_AI_SERVICE', 'MONTHLY_GRANT', 'REFUND'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED'],
      default: 'PENDING',
    },
    tokenType: { type: String, enum: TOKEN_TYPES, required: true },
    amount: { type: Number, required: true, min: 1 },

    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    ideaId: { type: Schema.Types.ObjectId, default: null },

    initiatedBy: {
      type: String,
      enum: ['founder-backend', 'investor-backend', 'system'],
      required: true,
    },
    correlationId: { type: String, required: true },

    memo: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed },

    completedAt: { type: Date },
  },
  { timestamps: true }
);

CreditTransferSchema.index({ transferId: 1 }, { unique: true });
CreditTransferSchema.index({ fromUserId: 1, createdAt: -1 });
CreditTransferSchema.index({ toUserId: 1, createdAt: -1 });
CreditTransferSchema.index({ ideaId: 1, createdAt: -1 });
CreditTransferSchema.index({ status: 1, createdAt: -1 });

export const CreditTransfer = mongoose.model<ICreditTransfer>(
  'CreditTransfer',
  CreditTransferSchema
);
