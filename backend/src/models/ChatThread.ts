import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IChatMessage {
  senderId: ObjectId;
  text: string;
  createdAt: Date;
}

export interface IChatThread extends Document {
  _id: ObjectId;
  ideaId: ObjectId;
  founderId: ObjectId;
  investorId: ObjectId;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ChatThreadSchema = new Schema<IChatThread>(
  {
    ideaId: { type: Schema.Types.ObjectId, ref: 'Idea', required: true },
    founderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    investorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [ChatMessageSchema],
  },
  { timestamps: true }
);

// Compound index to ensure one thread per founder-investor-idea combination
ChatThreadSchema.index({ ideaId: 1, founderId: 1, investorId: 1 }, { unique: true });

export const ChatThread = mongoose.model<IChatThread>('ChatThread', ChatThreadSchema);
