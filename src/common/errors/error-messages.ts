import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes.enum';

export const ErrorMessages: Record<ErrorCode, { message: string; status: HttpStatus }> = {
  // --- Erreurs Système & HTTP ---
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    message: 'An internal server error has occurred.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.BAD_REQUEST]: {
    message: 'The request is invalid.',
    status: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.UNAUTHORIZED]: {
    message: 'Authentication required or invalid.',
    status: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCode.FORBIDDEN]: {
    message: 'You do not have permission to access this resource.',
    status: HttpStatus.FORBIDDEN,
  },
  [ErrorCode.NOT_FOUND]: {
    message: 'The requested resource was not found.',
    status: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.VALIDATION_FAILED]: {
    message: 'Data validation failed.',
    status: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    message: 'The service is currently unavailable.',
    status: HttpStatus.SERVICE_UNAVAILABLE,
  },
  [ErrorCode.TIMEOUT_ERROR]: {
    message: 'The request timed out.',
    status: HttpStatus.REQUEST_TIMEOUT,
  },
  [ErrorCode.DATABASE_ERROR]: {
    message: 'A database error occurred.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // --- Authentification & Utilisateur ---
  [ErrorCode.EMAIL_ALREADY_USED]: {
    message: 'This email is already in use.',
    status: HttpStatus.CONFLICT,
  },
  [ErrorCode.USER_NOT_FOUND]: {
    message: 'User not found.',
    status: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.INVALID_CREDENTIALS]: {
    message: 'Invalid credentials (incorrect email or password).',
    status: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCode.ACCOUNT_LOCKED]: {
    message: 'Your account is locked due to too many failed attempts.',
    status: HttpStatus.FORBIDDEN,
  },
  [ErrorCode.REFRESH_TOKEN_INVALID]: {
    message: 'Invalid refresh token.',
    status: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCode.REFRESH_TOKEN_EXPIRED]: {
    message: 'Refresh token has expired. Please log in again.',
    status: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCode.OTP_INVALID]: {
    message: 'Invalid one-time password.',
    status: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCode.OTP_EXPIRED]: {
    message: 'The one-time password has expired.',
    status: HttpStatus.UNAUTHORIZED,
  },

  // --- Gestion des Parties ---
  [ErrorCode.GAME_NOT_FOUND]: {
    message: 'The requested game was not found.',
    status: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.GAME_ALREADY_STARTED]: {
    message: 'The game has already started.',
    status: HttpStatus.CONFLICT,
  },
  [ErrorCode.GAME_ALREADY_FINISHED]: {
    message: 'The game has already finished.',
    status: HttpStatus.CONFLICT,
  },
  [ErrorCode.PLAYER_NOT_IN_GAME]: {
    message: 'You are not a participant in this game.',
    status: HttpStatus.FORBIDDEN,
  },
  [ErrorCode.NOT_PLAYER_TURN]: {
    message: 'It is not your turn to play.',
    status: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.MOVE_NOT_ALLOWED]: {
    message: 'The move is not allowed.',
    status: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.PGN_INVALID]: {
    message: 'The provided PGN is invalid.',
    status: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.FEN_INVALID]: {
    message: 'The provided FEN is invalid.',
    status: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.MOVE_HISTORY_NOT_FOUND]: {
    message: 'No move history found for this game.',
    status: HttpStatus.NOT_FOUND,
  },

  // --- Mode IA & Suggestions ---
  [ErrorCode.AI_SERVICE_ERROR]: {
    message: 'An error occurred while communicating with the AI service.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.AI_SUGGESTION_FAILED]: {
    message: 'The AI could not provide a suggestion.',
    status: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.AI_MOVE_GENERATION_ERROR]: {
    message: 'The AI failed to generate a move.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // --- Intégrations & Services Externes ---
  [ErrorCode.LLM_REQUEST_FAILED]: {
    message: 'The request to the language model service failed.',
    status: HttpStatus.SERVICE_UNAVAILABLE,
  },
  [ErrorCode.LLM_RESPONSE_INVALID]: {
    message: 'The response from the language model service was invalid.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
};
