import mongoose, { Schema } from 'mongoose';
import { Document } from 'mongoose';

// Interface pour le document utilisateur Mongoose
export interface IUser extends Document {
  phone?: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;
  lastLogin?: Date;
  rating: number;
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
  };
}

export const UserSchema = new Schema<IUser>({
  phone: { type: String, unique: true, sparse: true, trim: true },
  email: { type: String, unique: true, sparse: true, index: true, lowercase: true, trim: true },
  displayName: { type: String, required: true },
  avatarUrl: String,
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  rating: { type: Number, default: 1200 },
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
  },
});

export const UserSchemaName = 'User';
export const User = mongoose.model<IUser>(UserSchemaName, UserSchema);
