import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'FOUNDER' | 'INVESTOR';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['FOUNDER', 'INVESTOR'], required: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
