// src/models/ts
import mongoose, { Schema } from 'mongoose';
import { Document } from 'mongoose';

// Interface pour le document de mouvement de jeu
export interface IMove extends Document {
  gameId: mongoose.Schema.Types.ObjectId;
  player: mongoose.Schema.Types.ObjectId;
  from: string;
  to: string;
  fen: string;
  moveNumber: number;
  createdAt: Date;
}

export const MoveSchema = new Schema<IMove>({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  player: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  fen: { type: String, required: true }, // FEN après le mouvement
  moveNumber: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const MoveSchemaName = 'Move';
export const Move = mongoose.model<IMove>(MoveSchemaName, MoveSchema);
