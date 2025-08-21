// scripts/init-indexes.ts
// import { Move } from 'chess.js';
import mongoose from 'mongoose';
import { Game } from 'src/models/game.schema';
import { Move } from 'src/models/move.schema';
import { OTPSession } from 'src/models/otp-session.schema';
import { User } from 'src/models/user.schema';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chess-app';

async function initIndexes() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log('📌 Connexion MongoDB établie.');

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    await User.collection.createIndex({ phone: 1 }, { unique: true, sparse: true });
    console.log('✅ Indexes User créés.');

    // Game indexes
    await Game.collection.createIndex({ status: 1 });
    await Game.collection.createIndex({ createdAt: -1 });
    console.log('✅ Indexes Game créés.');

    // Move indexes
    await Move.collection.createIndex({ gameId: 1, moveNumber: 1 });
    console.log('✅ Indexes Move créés.');

    // OTP indexes
    await OTPSession.collection.createIndex({ userIdentifier: 1 });
    await OTPSession.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log('✅ Indexes OTP créés.');

    console.log('🎉 Tous les indexes ont été initialisés avec succès.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la création des indexes:', err);
    process.exit(1);
  }
}

void initIndexes();
