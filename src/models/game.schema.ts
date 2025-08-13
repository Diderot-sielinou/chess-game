// src/models/game.schema.ts
import mongoose, { Schema } from 'mongoose';
import { Document } from 'mongoose';

// Interface pour le document de jeu
export interface IGame extends Document {
  players: mongoose.Schema.Types.ObjectId[];
  whitePlayer: mongoose.Schema.Types.ObjectId;
  blackPlayer: mongoose.Schema.Types.ObjectId;
  status: 'pending' | 'active' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';
  fen: string;
  pgn?: string;
  winner?: mongoose.Schema.Types.ObjectId;
  moves: mongoose.Schema.Types.ObjectId[];
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  timeControl: string;
}

export const GameSchema = new Schema<IGame>({
  players: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  whitePlayer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  blackPlayer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'active', 'checkmate', 'stalemate', 'draw', 'resigned'],
    default: 'pending',
  },
  fen: { type: String, required: true },
  pgn: String,
  winner: { type: Schema.Types.ObjectId, ref: 'User' },
  moves: [{ type: Schema.Types.ObjectId, ref: 'Move' }],
  createdAt: { type: Date, default: Date.now },
  startedAt: Date,
  endedAt: Date,
  timeControl: { type: String, required: true },
});

export const GameSchemaName = 'Game';
export const Game = mongoose.model<IGame>(GameSchemaName, GameSchema);
