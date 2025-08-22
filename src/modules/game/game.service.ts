/* eslint-disable no-unused-vars */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Chess } from 'chess.js';
import { GameSchemaName, IGame, IMove, IUser, MoveSchemaName, UserSchemaName } from '../../models';
import type { FilterQuery } from 'mongoose';
import type { Move } from 'chess.js';
import { Types } from 'mongoose';
import { AiService } from '../ai/ai.service';
import { UserService } from '../user/user.service';
import { MyLoggerService } from '../my-logger/my-logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(GameSchemaName) private readonly gameModel: Model<IGame>,
    @InjectModel(MoveSchemaName) private readonly moveModel: Model<IMove>,
    @InjectModel(UserSchemaName) private readonly userModel: Model<IUser>,
    private readonly aiService: AiService,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: MyLoggerService,
  ) {}

  /** Create a new game record. Use whitePlayer/blackPlayer = userId or 'AI' */
  async createGame(payload: { whitePlayer?: string; blackPlayer?: string; timeControl?: string }) {
    const fenStart = new Chess().fen();
    const doc = await this.gameModel.create({
      players: [payload.whitePlayer, payload.blackPlayer].filter(Boolean),
      whitePlayer: payload.whitePlayer || null,
      blackPlayer: payload.blackPlayer || null,
      fen: fenStart,
      timeControl: payload.timeControl || 'unrated',
      status: 'pending',
    });
    this.logger.log(
      `New game created: ${doc.toObject} for ${payload.whitePlayer} and ${payload.blackPlayer}`,
    );
    return doc.toObject();
  }

  async getGame(gameId: string) {
    const g = await this.gameModel.findById(gameId).populate('moves').lean();
    if (!g) throw new NotFoundException('Game not found');
    return g;
  }

  async listGames(filter: FilterQuery<IGame> = {}, limit = 20, skip = 0) {
    return this.gameModel.find(filter).sort({ createdAt: -1 }).limit(limit).skip(skip).lean();
  }

  /** Apply a move to a game: validate via chess.js, create Move doc, update game fen/pgn/status */
  async playMove(gameId: string, playerId: string, moveStr: string, promotion?: string) {
    const game = await this.gameModel.findById(gameId);
    if (!game) throw new NotFoundException('Game not found');
    // Check game status
    if (['checkmate', 'stalemate', 'draw', 'resigned'].includes(game.status)) {
      throw new BadRequestException('Game already finished');
    }

    // Init chess from current FEN
    const chess = new Chess(game.fen);
    this.logger.log(`\n========== NEW MOVE ==========\n`);
    this.logger.log(`Initial FEN: ${game.fen}`);
    this.logger.log(`Current PGN: ${chess.pgn()}`);
    this.logger.log(`Current turn: ${chess.turn() === 'w' ? 'White' : 'Black'}`);

    const turnColor = chess.turn();
    const playerTurn = turnColor === 'w' ? String(game.whitePlayer) : String(game.blackPlayer);

    // Check if it's AI's turn
    if (playerTurn === 'AI' && playerId !== 'AI') {
      this.logger.warn(`⚠️ Attempt to play while it's AI's turn`);
      throw new ForbiddenException("It's AI's turn, a player can't play.");
    }

    // Check if it's the expected player's turn
    if (playerTurn !== playerId) {
      this.logger.warn(`⚠️ Wrong player: expected=${playerTurn}, got=${playerId}`);
      throw new ForbiddenException("It's not this player's turn");
    }

    // If the game is pending → activate it
    if (game.status === 'pending') {
      game.status = 'active';
      game.startedAt = new Date();
    }

    // Apply the move
    let applied: null | Move = null;
    try {
      if (promotion) {
        applied = chess.move({
          from: moveStr.slice(0, 2),
          to: moveStr.slice(2, 4),
          promotion,
        });
      } else {
        applied = chess.move(moveStr);
      }
    } catch (e) {
      this.logger.error(`❌ Error applying move: ${e}`);
      throw new BadRequestException('Invalid move');
    }

    if (!applied) {
      this.logger.error(`❌ Move not applied: ${moveStr}`);
      throw new BadRequestException('Invalid move');
    }

    this.logger.log(`✅ Move applied: ${applied.san}`);
    this.logger.log(`FEN after move: ${chess.fen()}`);
    this.logger.log(`PGN after move: ${chess.pgn()}`);

    // Create Move in database
    const moveDoc = await this.moveModel.create({
      gameId: game._id,
      player: playerId !== 'AI' ? playerId : null,
      isAI: playerId === 'AI',
      from: applied.from,
      to: applied.to,
      fen: chess.fen(),
      moveNumber: (game.moves?.length || 0) + 1,
      promotion: applied.promotion,
    });
    this.logger.log(`📝 Move created in DB: ${moveDoc._id}`);

    // Update game
    game.moves = game.moves || [];
    game.moves.push(moveDoc._id as Types.ObjectId);
    game.fen = chess.fen();
    game.pgn = chess.pgn();

    // Determine next player turn
    const nextTurnColor1 = chess.turn();
    const nextPlayerId =
      nextTurnColor1 === 'w' ? String(game.whitePlayer) : String(game.blackPlayer);

    // Update game turn
    game.turn = nextPlayerId;
    await game.save();

    // Émettre un événement pour notifier l’adversaire
    if (nextPlayerId !== 'AI' && nextPlayerId !== playerId) {
      this.eventEmitter.emit('game.nextTurn', {
        gameId: game._id,
        nextPlayerId,
        lastMove: moveDoc.toObject(),
        game: game.toObject(),
      });
    }

    // Check game over
    // ==================== GAME OVER HANDLING ====================
    if (chess.isGameOver()) {
      this.logger.warn(`⚠️ GAME OVER detected`);
      this.logger.log(`isCheckmate: ${chess.isCheckmate()}`);
      this.logger.log(`isStalemate: ${chess.isStalemate()}`);
      this.logger.log(`isThreefoldRepetition: ${chess.isThreefoldRepetition()}`);
      this.logger.log(`isInsufficientMaterial: ${chess.isInsufficientMaterial()}`);
      this.logger.log(`isDraw: ${chess.isDraw()}`);
      game.endedAt = new Date();

      // Determine results for each player
      let whiteResult: 'win' | 'loss' | 'draw' = 'draw';
      let blackResult: 'win' | 'loss' | 'draw' = 'draw';

      if (chess.isCheckmate()) {
        // If last move delivered checkmate
        game.status = 'checkmate';
        if (applied.color === 'w') {
          game.winner = game.whitePlayer;
          whiteResult = 'win';
          blackResult = 'loss';
        } else {
          game.winner = game.blackPlayer;
          whiteResult = 'loss';
          blackResult = 'win';
        }
      } else if (
        chess.isStalemate() ||
        chess.isDraw() ||
        chess.isInsufficientMaterial() ||
        chess.isThreefoldRepetition()
      ) {
        // Draw
        game.status = 'draw';
        whiteResult = 'draw';
        blackResult = 'draw';
      }

      // ==================== UPDATE PLAYER STATS AND RATING ====================
      const whitePlayer = await this.userModel.findById(game.whitePlayer);
      const blackPlayer = await this.userModel.findById(game.blackPlayer);

      // Only if human players (ignore AI)
      if (whitePlayer && blackPlayer) {
        await this.userService.updateStatsAndRating(
          String(whitePlayer._id),
          whiteResult,
          blackPlayer.rating,
        );
        await this.userService.updateStatsAndRating(
          String(blackPlayer._id),
          blackResult,
          whitePlayer.rating,
        );
      }
    } else {
      game.status = 'active';
    }

    await game.save();

    // Check if it's AI's turn next
    const nextTurnColor = chess.turn();
    const nextPlayerTurn =
      nextTurnColor === 'w' ? String(game.whitePlayer) : String(game.blackPlayer);
    this.logger.log(
      `➡️ Next player: ${nextTurnColor === 'w' ? 'White' : 'Black'} (${nextPlayerTurn})`,
    );

    if (nextPlayerTurn === 'AI') {
      this.logger.log(`🤖 Triggering AI move...`);
      await this._handleAiTurn(gameId, game);
    }

    return {
      move: moveDoc.toObject(),
      game: game.toObject(),
    };
  }

  /**
   * Private method to handle the AI's turn.
   * Called internally by playMove when it's AI's turn.
   */
  private async _handleAiTurn(gameId: string, game: any) {
    try {
      const aiMove = await this.aiService.generateMove({
        gameId,
        difficulty: 'medium',
      });

      this.logger.log(`🤖 AI proposes: ${JSON.stringify(aiMove)}`);

      if (!aiMove || !aiMove.move) {
        this.logger.warn(`⚠️ No AI move generated, ending game`);
        game.status = 'draw';
        game.endedAt = new Date();
        await game.save();
        return;
      }

      // Apply AI move via playMove
      const result = await this.playMove(gameId, 'AI', aiMove.move, aiMove.promotion);

      this.logger.log(`✅ AI move applied: ${aiMove.move} ${aiMove.promotion ?? ''}`);
      return result;
    } catch (e) {
      this.logger.error(`❌ Error during AI move: ${e}`);
      game.status = 'draw';
      game.endedAt = new Date();
      await game.save();
    }
  }

  /** Resign a game */
  async resign(gameId: string, playerId: string) {
    const game = await this.gameModel.findById(gameId);
    if (!game) throw new NotFoundException('Game not found');

    if (!game.players.includes(playerId)) {
      throw new BadRequestException('Player not in this game');
    }

    if (['checkmate', 'stalemate', 'draw', 'resigned'].includes(game.status)) {
      throw new BadRequestException('Game already finished');
    }

    game.status = 'resigned';
    const winnerId =
      String(game.whitePlayer) === String(playerId) ? game.blackPlayer : game.whitePlayer;
    game.winner = winnerId;
    game.endedAt = new Date();

    await game.save();

    // ==================== Update stats and rating (as before) ====================
    if (winnerId !== 'AI') {
      const loser = await this.userModel.findById(playerId);
      const loserRating = loser ? loser.rating : 0;
      await this.userService.updateStatsAndRating(winnerId.toString(), 'win', loserRating);
      if (loser) await this.userService.updateStatsAndRating(playerId, 'loss', loserRating);
    }

    // ==================== WebSocket notification ====================
    if (winnerId !== 'AI') {
      this.eventEmitter.emit('game.playerResigned', {
        gameId,
        winnerId,
        playerId,
      });
    }

    return game.toObject();
  }

  /** Return last N moves (as objects) */
  async getLastMoves(gameId: string, limit = 10) {
    return this.moveModel.find({ gameId }).sort({ createdAt: -1 }).limit(limit).lean();
  }
}
