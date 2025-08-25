// src/models/otp-session.schema.ts
import mongoose, { Schema } from 'mongoose';
import { Document } from 'mongoose';

// Interface pour le document de session OTP
export interface IOTPSession extends Document {
  userIdentifier: string;
  otpCode: string;
  expiresAt: Date;
  attempts: number;
}

export const OTPSessionSchema = new Schema<IOTPSession>({
  userIdentifier: { type: String, required: true },
  otpCode: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
});

export const OTPSessionSchemaName = 'OTPSession';
export const OTPSession = mongoose.model<IOTPSession>(OTPSessionSchemaName, OTPSessionSchema);
