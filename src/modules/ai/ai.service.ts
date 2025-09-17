/* eslint-disable no-unused-vars */

import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import Redis from 'ioredis';
import { Chess } from 'chess.js';
// import { DeepSeekClient } from './llm.client';
import { GeminiClient } from './llm.client';

import { movePrompt, suggestionsPrompt } from './prompts';
import { LlmMoveResponse, LlmSuggestionsResponse } from './types';
import { GenerateMoveDto } from './dto/generate-move.dto';
import { SuggestMovesDto } from './dto/suggest-moves.dto';
import { GameSchemaName, IGame, IMove, MoveSchemaName } from 'src/models';
import { AppConfigService } from 'src/config/config.service';
import { MyLoggerService } from '../my-logger/my-logger.service';

@Injectable()
export class AiService {
  private ds: GeminiClient;

  constructor(
    private configService: AppConfigService,
    private readonly logger: MyLoggerService,
    @Inject('REDIS') private readonly redis: Redis,
    @InjectModel(GameSchemaName) private readonly gameModel: Model<IGame>,
    @InjectModel(MoveSchemaName) private readonly moveModel: Model<IMove>,
  ) {
    this.ds = new GeminiClient();
  }

  private async getLastMoves(gameId: string, limit = 10): Promise<string[]> {
    const moves = await this.moveModel.find({ gameId }).sort({ createdAt: -1 }).limit(limit).lean();
    return moves.reverse().map((m) => `${m.from}${m.to}`);
  }

  private computeLegalMoves(fen: string) {
    const chess = new Chess(fen);
    const legalSan = chess.moves();
    const legalVerbose = chess.moves({ verbose: true });
    const legalUci = legalVerbose.map(
      (m: any) => `${m.from}${m.to}${m.promotion ? m.promotion : ''}`,
    );
    return { chess, legalSan, legalUci };
  }

  private assertPlayersTurn(chess: Chess, game: any, playerId: string) {
    const turn = chess.turn();
    const isWhite = String(game.whitePlayer) === String(playerId);
    const isBlack = String(game.blackPlayer) === String(playerId);
    if ((turn === 'w' && !isWhite) || (turn === 'b' && !isBlack)) {
      this.logger.log(``);
      throw new ForbiddenException("It's not this player's turn");
    }
  }

  private parseJson<T>(text: string, fallback: T): T {
    try {
      return JSON.parse(text) as T;
    } catch {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(text.slice(start, end + 1)) as T;
          // eslint-disable-next-line no-empty
        } catch {}
      }
      return fallback;
    }
  }

  private sanFromUci(chess: Chess, uci: string): string | null {
    const verbose = chess.moves({ verbose: true });
    const found = verbose.find((m: any) => `${m.from}${m.to}${m.promotion ?? ''}` === uci);
    return found?.san || null;
  }

  async generateMove(dto: GenerateMoveDto): Promise<LlmMoveResponse> {
    const { gameId, difficulty = 'medium' } = dto;
    const game = await this.gameModel.findById(gameId).lean();
    if (!game) throw new NotFoundException('Game not found');

    const { chess, legalSan, legalUci } = this.computeLegalMoves(game.fen);
    if (game.status !== 'active') {
      throw new BadRequestException('The game is not active');
    }

    // ✅ VÉRIFIER SI IL N'Y A PLUS DE COUPS LÉGAUX
    if (legalUci.length === 0) {
      this.logger.log(`No legal moves available for AI in game ${gameId}`);
      // Renvoyer un objet vide pour signaler la fin de la partie
      return { move: '', explanation: 'No legal moves available' };
    }

    const lastMoves = await this.getLastMoves(gameId, 10);
    const cacheKey = `llm:move:${game.fen}${gameId}:d:${difficulty}`;
    const cached = await this.redis.get(cacheKey);
    if (cached)
      return this.parseJson<LlmMoveResponse>(cached, { move: '', explanation: 'cache fallback' });

    // Demande au LLM
    const prompt = movePrompt({
      fen: game.fen,
      legalMoves: [...legalSan, ...legalUci],
      lastMoves,
      difficulty,
    });
    const text = await this.ds.complete(prompt);
    const parsed = this.parseJson<LlmMoveResponse>(text, { move: '' });

    // Vérifie si le coup est légal
    const moveIsLegal =
      parsed.move && (legalSan.includes(parsed.move) || legalUci.includes(parsed.move));

    let applied: any = null;
    if (moveIsLegal) {
      applied = chess.move(parsed.move) || chess.move(this.sanFromUci(chess, parsed.move));
    }

    // ⚡️ Fallback : si l’IA échoue, choisir un coup aléatoire parmi legalUci
    if (!applied) {
      this.logger.warn(`⚠️ LLM move invalid → fallback to random legal move`);
      const randomMove = legalUci[Math.floor(Math.random() * legalUci.length)];
      applied = chess.move(randomMove);
      parsed.move = randomMove;
      parsed.explanation = 'Fallback random legal move';
    }

    await this.redis.set(cacheKey, JSON.stringify(parsed), 'EX', 60 * 60 * 6);
    return parsed;
  }

  async suggestMoves(dto: SuggestMovesDto): Promise<LlmSuggestionsResponse> {
    const { gameId, playerId, suggestionsCount = 3, style = 'balanced' } = dto;
    const game = await this.gameModel.findById(gameId).lean();
    this.logger.log(`game trouver ${JSON.stringify(game)}`);
    if (!game) throw new NotFoundException('Game not found');

    const { chess, legalSan, legalUci } = this.computeLegalMoves(game.fen);
    this.assertPlayersTurn(chess, game, playerId as string);

    const lastMoves = await this.getLastMoves(gameId, 10);
    const cacheKey = `llm:sugg:${game.fen}${gameId}:n:${suggestionsCount}:style:${style}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return this.parseJson<LlmSuggestionsResponse>(cached, { suggestions: [] });

    const prompt = suggestionsPrompt({
      fen: game.fen,
      legalMoves: [...legalSan, ...legalUci],
      lastMoves,
      count: suggestionsCount,
      style,
    });

    this.logger.log(`PROMPT genere pour la demande de suggestion a l'IA ${prompt}`);

    const text = await this.ds.complete(prompt);
    const parsed = this.parseJson<LlmSuggestionsResponse>(text, { suggestions: [] });

    parsed.suggestions = (parsed.suggestions || []).filter(
      (m) => legalSan.includes(m) || legalUci.includes(m),
    );

    await this.redis.set(cacheKey, JSON.stringify(parsed), 'EX', 60 * 60 * 6);
    return parsed;
  }
}
