import { ErrorCode } from './error-codes.enum';

export const SYSTEM_ERRORS = [
  ErrorCode.INTERNAL_SERVER_ERROR,
  ErrorCode.BAD_REQUEST,
  ErrorCode.UNAUTHORIZED,
  ErrorCode.FORBIDDEN,
  ErrorCode.NOT_FOUND,
  ErrorCode.VALIDATION_FAILED,
  ErrorCode.SERVICE_UNAVAILABLE,
  ErrorCode.TIMEOUT_ERROR,
  ErrorCode.DATABASE_ERROR,
] as const;

export const AUTH_ERRORS = [
  ErrorCode.EMAIL_ALREADY_USED,
  ErrorCode.USER_NOT_FOUND,
  ErrorCode.INVALID_CREDENTIALS,
  ErrorCode.ACCOUNT_LOCKED,
  ErrorCode.REFRESH_TOKEN_INVALID,
  ErrorCode.REFRESH_TOKEN_EXPIRED,
  ErrorCode.OTP_INVALID,
  ErrorCode.OTP_EXPIRED,
] as const;

export const GAME_ERRORS = [
  ErrorCode.GAME_NOT_FOUND,
  ErrorCode.GAME_ALREADY_STARTED,
  ErrorCode.GAME_ALREADY_FINISHED,
  ErrorCode.PLAYER_NOT_IN_GAME,
  ErrorCode.NOT_PLAYER_TURN,
  ErrorCode.MOVE_NOT_ALLOWED,
  ErrorCode.PGN_INVALID,
  ErrorCode.FEN_INVALID,
  ErrorCode.MOVE_HISTORY_NOT_FOUND,
] as const;

export const AI_ERRORS = [
  ErrorCode.AI_SERVICE_ERROR,
  ErrorCode.AI_SUGGESTION_FAILED,
  ErrorCode.AI_MOVE_GENERATION_ERROR,
] as const;

export const LLM_ERRORS = [ErrorCode.LLM_REQUEST_FAILED, ErrorCode.LLM_RESPONSE_INVALID] as const;
