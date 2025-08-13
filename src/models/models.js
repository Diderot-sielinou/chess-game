import mongoose from 'mongoose';

// --- User Schema ---
const UserSchema = new mongoose.Schema({
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
  players: {
    type: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        color: { type: String, enum: ['white', 'black'], required: true },
        isAI: { type: Boolean, default: false },
      },
    ],
    validate: {
      validator: function (players) {
        // 1️⃣ Vérifier nombre exact de joueurs
        if (!Array.isArray(players) || players.length !== 2) {
          throw new Error('A game must have exactly two players.');
        }

        // 2️⃣ Vérifier qu’on a un blanc et un noir
        const colors = players.map((p) => p.color);
        if (!(colors.includes('white') && colors.includes('black'))) {
          throw new Error('One player must have color "white" and the other "black".');
        }

        // 3️⃣ Vérifier userId distincts
        const ids = players.map((p) => p.userId.toString());
        if (new Set(ids).size !== ids.length) {
          throw new Error('Players must have distinct userId values.');
        }

        // 4️⃣ Si mode vsAI → exactement un joueur IA
        if (this.mode === 'vsAI') {
          const aiCount = players.filter((p) => p.isAI).length;
          if (aiCount !== 1) {
            throw new Error('In vsAI mode, exactly one player must have isAI === true.');
          }
        }

        return true;
      },
      message: (props) => props.reason?.message || 'Invalid players array.',
    },
  },

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

// const GameSchema = new mongoose.Schema({
//   players: [
//     {
//       userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//       color: { type: String, enum: ['white', 'black'], required: true },
//       isAI: { type: Boolean, default: false },
//     },
//   ],
//   createdAt: { type: Date, default: Date.now },
//   startedAt: Date,
//   endedAt: Date,
//   result: {
//     type: String,
//     enum: ['1-0', '0-1', '1/2-1/2', 'resignation', 'ongoing'],
//     default: 'ongoing',
//   },
//   moves: [MoveSchema],
//   pgn: { type: String, default: '' },
//   currentFEN: { type: String, required: true },
//   fenStart: { type: String, required: true },
//   fenEnd: String,
//   mode: { type: String, enum: ['vsAI', 'multiplayer'], required: true },
//   winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
//   aiLevel: { type: Number, default: 0 },
// });

// --- OTP Session Schema ---
const OTPSessionSchema = new mongoose.Schema({
  userIdentifier: { type: String, required: true }, // phone or email
  otpCode: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
});

export const User = mongoose.model('User', UserSchema);
export const Move = mongoose.model('Move', MoveSchema);
export const Game = mongoose.model('Game', GameSchema);
export const OTPSession = mongoose.model('OTPSession', OTPSessionSchema);
