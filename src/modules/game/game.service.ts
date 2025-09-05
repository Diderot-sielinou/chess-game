/* eslint-disable no-unused-vars */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chess, Move } from 'chess.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AiService } from '../ai/ai.service';
import { UserService } from '../user/user.service';
import { GameSchemaName, IGame, IMove, IUser, MoveSchemaName, UserSchemaName } from '../../models';
import { MyLoggerService } from '../my-logger/my-logger.service';

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

  /** Crée une partie */
  async createGame(payload: { whitePlayer?: string; blackPlayer?: string; timeControl?: string }) {
    const chess = new Chess();
    const doc = await this.gameModel.create({
      players: [payload.whitePlayer, payload.blackPlayer].filter(Boolean),
      whitePlayer: payload.whitePlayer || null,
      blackPlayer: payload.blackPlayer || null,
      fen: chess.fen(),
      turn: chess.turn(),
      timeControl: payload.timeControl || 'unrated',
      status: 'pending',
    });
    console.log(`game created successfully`);
    this.logger.log(`Game created: ${doc._id}`);
    return doc.toObject();
  }

  async getGame(gameId: string) {
    const game = await this.gameModel.findById(gameId).populate('moves').lean();
    if (!game) throw new NotFoundException('Game not found');
    return game;
  }

  async listGames(filter = {}, limit = 20, skip = 0) {
    return this.gameModel.find(filter).sort({ createdAt: -1 }).limit(limit).skip(skip).lean();
  }

  /** Applique un coup */
  async playMove(gameId: string, playerId: string, moveStr: string, promotion?: string) {
    console.log(`appele de playMode avec move ${moveStr} playerId: ${playerId}`);
    const game = await this.gameModel.findById(gameId);
    if (!game) throw new NotFoundException('Game not found');

    if (['checkmate', 'stalemate', 'draw', 'resigned'].includes(game.status)) {
      throw new BadRequestException('Game already finished');
    }

    const chess = new Chess(game.fen);

    // 🔧 Vérifier que le joueur est bien dans la partie
    if (!game.players.includes(playerId) && playerId !== 'AI') {
      throw new ForbiddenException('Player not in this game');
    }

    const turnColor = chess.turn();
    const playerTurn = turnColor === 'w' ? String(game.whitePlayer) : String(game.blackPlayer);

    if (playerTurn === 'AI' && playerId !== 'AI') {
      throw new ForbiddenException("It's AI's turn");
    }
    if (playerTurn !== playerId) {
      throw new ForbiddenException("It's not this player's turn");
    }

    if (game.status === 'pending') {
      game.status = 'active';
      game.startedAt = new Date();
    }

    const applied: Move | null = promotion
      ? chess.move({ from: moveStr.slice(0, 2), to: moveStr.slice(2, 4), promotion })
      : chess.move(moveStr);

    if (!applied) throw new BadRequestException('Invalid move');

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

    game.moves = game.moves || [];
    game.moves.push(moveDoc._id as Types.ObjectId);
    game.fen = chess.fen();
    game.pgn = chess.pgn();

    // 🔧 Corriger attribution du joueur suivant
    game.turn = chess.turn() === 'w' ? String(game.whitePlayer) : String(game.blackPlayer);

    await game.save();

    // 🔧 Émettre l’événement après mise à jour correcte du tour
    this.eventEmitter.emit('game.nextTurn', {
      gameId: game._id,
      nextPlayerId: game.turn,
      lastMove: moveDoc.toObject(),
      game: game.toObject(),
    });

    this.logger.log(
      `emition de l'evennement apres un coup jouer gameId ${game._id} nextPlayerId: ${game.turn}`,
    );

    // Vérifier si AI doit jouer
    if (game.turn === 'AI') await this._handleAiTurn(gameId, game);

    // Vérifier si la partie est terminée
    if (chess.isGameOver()) await this._handleGameOver(game, chess, applied);

    return { move: moveDoc.toObject(), game: game.toObject() };
  }

  private async _handleAiTurn(gameId: string, game: any) {
    const aiMove = await this.aiService.generateMove({ gameId, difficulty: 'medium' });
    console.log(`movement generer par l'ia ${JSON.stringify(aiMove)}}`);
    console.log(`ia move ${JSON.stringify(aiMove)}`);
    if (!aiMove?.move) {
      game.status = 'draw';
      game.endedAt = new Date();
      await game.save();
      return;
    }
    const result = await this.playMove(gameId, 'AI', aiMove.move, aiMove.promotion);
    // ⚡ MAIS on émet explicitement un event IA → front
    this.eventEmitter.emit('game.aiPlayed', {
      gameId,
      lastMove: result.move, // contient { from, to, fen, ... }
      game: result.game,
    });

    this.logger.log(`♟️ IA a joué ${result.move.from} → ${result.move.to}`);
  }

  private async _handleGameOver(game: any, chess: Chess, lastMove: Move) {
    game.endedAt = new Date();

    let whiteResult: 'win' | 'loss' | 'draw' = 'draw';
    let blackResult: 'win' | 'loss' | 'draw' = 'draw';

    // 🔧 Gérer plusieurs cas de fin de partie
    if (chess.isCheckmate()) {
      game.status = 'checkmate';
      if (lastMove.color === 'w') {
        game.winner = game.whitePlayer;
        whiteResult = 'win';
        blackResult = 'loss';
      } else {
        game.winner = game.blackPlayer;
        whiteResult = 'loss';
        blackResult = 'win';
      }
    } else if (chess.isStalemate()) {
      game.status = 'stalemate';
    } else if (chess.isDraw() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
      game.status = 'draw';
    }

    const whitePlayer = await this.userModel.findById(game.whitePlayer);
    const blackPlayer = await this.userModel.findById(game.blackPlayer);

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

    await game.save();

    // Exemple dans _handleGameOver
    this.eventEmitter.emit('game.gameOver', {
      gameId: game._id,
      result: game.status,
      winnerId: game.winner,
      fen: chess.fen(),
      pgn: chess.pgn(),
    });
  }

  /** Abandon */
  async resign(gameId: string, playerId: string) {
    const game = await this.gameModel.findById(gameId);
    if (!game) throw new NotFoundException('Game not found');
    if (!game.players.includes(playerId)) throw new BadRequestException('Player not in this game');
    if (['checkmate', 'stalemate', 'draw', 'resigned'].includes(game.status))
      throw new BadRequestException('Game already finished');

    game.status = 'resigned';
    game.winner = String(game.whitePlayer) === playerId ? game.blackPlayer : game.whitePlayer;
    game.endedAt = new Date();
    await game.save();

    // 🔧 Même contre IA : enregistrer la défaite du joueur humain
    if (playerId !== 'AI') {
      const loser = await this.userModel.findById(playerId);
      const loserRating = loser?.rating || 0;

      if (game.winner && game.winner !== 'AI') {
        await this.userService.updateStatsAndRating(game.winner.toString(), 'win', loserRating);
      }
      if (loser) {
        await this.userService.updateStatsAndRating(playerId, 'loss', loserRating);
      }
    }

    this.eventEmitter.emit('game.playerResigned', {
      gameId,
      winnerId: game.winner,
      playerId,
    });

    return game.toObject();
  }
}
