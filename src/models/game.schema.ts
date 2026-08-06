// src/models/game.schema.ts
import mongoose, { Schema } from 'mongoose';
import { Document, Types } from 'mongoose';

// Interface pour le document de jeu
export interface IGame extends Document {
  players: (Types.ObjectId | string)[];
  whitePlayer: Types.ObjectId | string;
  blackPlayer: Types.ObjectId | string;
  status: 'pending' | 'active' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';
  fen: string;
  pgn?: string;
  turn?: Types.ObjectId | string;
  winner?: Types.ObjectId | string;
  moves: Types.ObjectId[];
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  timeControl: string;
}

export const GameSchema = new Schema<IGame>({
  players: [{ type: Schema.Types.Mixed, ref: 'User' }], // Mixed accepte ObjectId et String
  whitePlayer: { type: Schema.Types.Mixed, ref: 'User' },
  blackPlayer: { type: Schema.Types.Mixed, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'active', 'checkmate', 'stalemate', 'draw', 'resigned'],
    default: 'pending',
  },
  fen: { type: String, required: true },
  pgn: String,
  turn: { type: Schema.Types.Mixed, ref: 'User', default: null },
  winner: { type: Schema.Types.Mixed, ref: 'User' },
  moves: [{ type: Schema.Types.ObjectId, ref: 'Move' }],
  createdAt: { type: Date, default: Date.now },
  startedAt: Date,
  endedAt: Date,
  timeControl: { type: String, required: true },
});

export const GameSchemaName = 'Game';
export const Game = mongoose.model<IGame>(GameSchemaName, GameSchema);
