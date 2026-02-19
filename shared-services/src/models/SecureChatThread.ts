import mongoose, { Schema, Document, Types } from 'mongoose';

// ─── Secure Chat with end-to-end encryption ────────────

export interface IEncryptedMessage {
  senderId: Types.ObjectId;
  senderRole: 'FOUNDER' | 'INVESTOR';
  /** AES-256 encrypted message body */
  encryptedText: string;
  /** Initialization vector for decryption */
  iv: string;
  /** SHA-256 hash of plaintext for integrity verification */
  hash: string;
  read: boolean;
  createdAt: Date;
}

export interface ISecureChatThread extends Document {
  ideaId: Types.ObjectId;
  founderId: Types.ObjectId;
  investorId: Types.ObjectId;
  /** Thread-level encryption key (encrypted with master key) */
  threadKey: string;
  messages: IEncryptedMessage[];
  lastActivity: Date;
  founderUnread: number;
  investorUnread: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EncryptedMessageSchema = new Schema<IEncryptedMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['FOUNDER', 'INVESTOR'], required: true },
  encryptedText: { type: String, required: true },
  iv: { type: String, required: true },
  hash: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const SecureChatThreadSchema = new Schema<ISecureChatThread>(
  {
    ideaId: { type: Schema.Types.ObjectId, required: true },
    founderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    investorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    threadKey: { type: String, required: true },
    messages: [EncryptedMessageSchema],
    lastActivity: { type: Date, default: Date.now },
    founderUnread: { type: Number, default: 0 },
    investorUnread: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One thread per founder-investor-idea combination
SecureChatThreadSchema.index({ ideaId: 1, founderId: 1, investorId: 1 }, { unique: true });
SecureChatThreadSchema.index({ founderId: 1, lastActivity: -1 });
SecureChatThreadSchema.index({ investorId: 1, lastActivity: -1 });

export const SecureChatThread = mongoose.model<ISecureChatThread>(
  'SecureChatThread',
  SecureChatThreadSchema
);
