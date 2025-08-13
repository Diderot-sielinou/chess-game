// src/models/index.ts

import { IGame, GameSchemaName, GameSchema } from './game.schema';
import { IMove, MoveSchemaName, MoveSchema } from './move.schema';
import { IOTPSession, OTPSessionSchemaName, OTPSessionSchema } from './otp-session.schema';
import { IUser, UserSchemaName, UserSchema } from './user.schema';

export {
  IUser,
  UserSchema,
  UserSchemaName,
  IOTPSession,
  OTPSessionSchema,
  OTPSessionSchemaName,
  IMove,
  MoveSchema,
  MoveSchemaName,
  IGame,
  GameSchema,
  GameSchemaName,
};
