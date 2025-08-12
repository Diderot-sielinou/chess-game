import mongoose from 'mongoose';

// --- User Schema ---
const UserSchema = new mongoose.Schema({
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
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

// --- Move Schema ---
const MoveSchema = new mongoose.Schema({
  moveNumber: Number,
  san: { type: String, required: true },
  from: String,
  to: String,
  fenBefore: { type: String, required: true },
  fenAfter: { type: String, required: true },
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  aiSuggestion: String,
  aiExplanation: String,
});

// --- Game Schema ---
const GameSchema = new mongoose.Schema({
  players: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      color: { type: String, enum: ['white', 'black'], required: true },
      isAI: { type: Boolean, default: false },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  startedAt: Date,
  endedAt: Date,
  result: {
    type: String,
    enum: ['1-0', '0-1', '1/2-1/2', 'resignation', 'ongoing'],
    default: 'ongoing',
  },
  moves: [MoveSchema],
  pgn: { type: String, default: '' },
  currentFEN: { type: String, required: true },
  fenStart: { type: String, required: true },
  fenEnd: String,
  mode: { type: String, enum: ['vsAI', 'multiplayer'], required: true },
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  aiLevel: { type: Number, default: 0 },
});

// --- OTP Session Schema ---
const OTPSessionSchema = new mongoose.Schema({
  userIdentifier: { type: String, required: true }, // phone or email
  otpCode: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Move: mongoose.model('Move', MoveSchema),
  Game: mongoose.model('Game', GameSchema),
  OTPSession: mongoose.model('OTPSession', OTPSessionSchema),
};
