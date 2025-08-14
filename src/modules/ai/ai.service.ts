/* eslint-disable no-unused-vars */
// import { Injectable, BadRequestException } from '@nestjs/common';
// import { Chess } from 'chess.js';
// import Redis from 'ioredis';
// import axios from 'axios';
// import { AppConfigService } from 'src/config/config.service';
// import { GenerateMoveDto } from './dto/generate-move.dto';
// import { SuggestMovesDto } from './dto/suggest-moves.dto';

// @Injectable()
// export class AiService {
//   private redis: Redis;
//   private deepSeekApiKey: string | undefined;

//   constructor(private configService: AppConfigService) {
//     this.redis = new Redis({ host: 'localhost', port: 6379 }); // configure selon ton setup
//     this.deepSeekApiKey = configService.deepseekApiKey; // à configurer dans .env
//   }

//   private async callDeepSeek(prompt: string): Promise<any> {
//     const url = 'https://api.deepseek.com/v1/completions'; // exemple d'endpoint
//     const headers = {
//       Authorization: `Bearer ${this.deepSeekApiKey}`,
//       'Content-Type': 'application/json',
//     };
//     const response = await axios.post(
//       url,
//       {
//         prompt,
//         max_tokens: 200,
//         temperature: 0.7,
//       },
//       { headers },
//     );

//     return response.data.choices[0].text;
//   }

//   async generateMove(dto: GenerateMoveDto): Promise<string> {
//     const { fen, legalMoves, lastMoves = [], difficulty = 'medium' } = dto;

//     // Vérifier le cache Redis
//     const cacheKey = `move:${fen}:${difficulty}`;
//     const cachedMove = await this.redis.get(cacheKey);
//     if (cachedMove) return cachedMove;

//     // Construire le prompt strict
//     const prompt = `
//       Tu es une IA jouant aux échecs. Tu dois choisir UN coup valide.
//       FEN: ${fen}
//       Coups légaux: ${legalMoves.join(', ')}
//       Historique: ${lastMoves.join(', ')}
//       Niveau: ${difficulty}
//       Réponds STRICTEMENT au format JSON:
//       {"move": "e2e4", "explanation": "raison du coup"}
//     `;

//     const resultText = await this.callDeepSeek(prompt);
//     let move;
//     try {
//       const parsed = JSON.parse(resultText);
//       if (!legalMoves.includes(parsed.move)) throw new Error('Coup illégal');
//       move = parsed.move;
//     } catch (err) {
//       throw new BadRequestException('LLM a renvoyé un coup invalide');
//     }

//     // Stocker dans Redis pour cache
//     await this.redis.set(cacheKey, move, 'EX', 3600); // cache 1h

//     return move;
//   }

//   async suggestMoves(dto: SuggestMovesDto): Promise<string[]> {
//     const { fen, legalMoves, lastMoves = [], suggestionsCount = 3 } = dto;

//     const prompt = `
//       Tu es une IA d'échecs. Propose ${suggestionsCount} coups possibles parmi les coups légaux.
//       FEN: ${fen}
//       Coups légaux: ${legalMoves.join(', ')}
//       Historique: ${lastMoves.join(', ')}
//       Réponds STRICTEMENT au format JSON:
//       {"suggestions": ["e2e4", "d2d4", "g1f3"]}
//     `;

//     const resultText = await this.callDeepSeek(prompt);
//     let moves: string[];
//     try {
//       const parsed = JSON.parse(resultText);
//       moves = parsed.suggestions.filter((m: string) => legalMoves.includes(m));
//     } catch (err) {
//       throw new BadRequestException('LLM a renvoyé des coups invalides');
//     }

//     return moves;
//   }
// }

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
import { DeepSeekClient } from './llm.client';
import { movePrompt, suggestionsPrompt } from './prompts';
import { LlmMoveResponse, LlmSuggestionsResponse } from './types';
import { GenerateMoveDto } from './dto/generate-move.dto';
import { SuggestMovesDto } from './dto/suggest-moves.dto';
import { GameSchemaName, IGame, IMove, MoveSchemaName } from 'src/models';
import { AppConfigService } from 'src/config/config.service';
import { MyLoggerService } from '../my-logger/my-logger.service';

@Injectable()
export class AiService {
  private ds: DeepSeekClient;

  constructor(
    private configService: AppConfigService,
    private readonly logger: MyLoggerService,
    @Inject('REDIS') private readonly redis: Redis,
    @InjectModel(GameSchemaName) private readonly gameModel: Model<IGame>,
    @InjectModel(MoveSchemaName) private readonly moveModel: Model<IMove>,
  ) {
    const key = configService.deepseekApiKey || '';
    const baseUrl = configService.deepseekUrl;
    this.ds = new DeepSeekClient(key, baseUrl);
    if (!key) {
      console.warn('[AI] DEEPSEEK_API_KEY not set — DeepSeek calls will fail.');
    }
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

    const lastMoves = await this.getLastMoves(gameId, 10);
    const cacheKey = `llm:move:${game.fen}:d:${difficulty}`;
    const cached = await this.redis.get(cacheKey);
    if (cached)
      return this.parseJson<LlmMoveResponse>(cached, { move: '', explanation: 'cache fallback' });

    const prompt = movePrompt({
      fen: game.fen,
      legalMoves: [...legalSan, ...legalUci],
      lastMoves,
      difficulty,
    });
    const text = await this.ds.complete(prompt);
    const parsed = this.parseJson<LlmMoveResponse>(text, { move: '' });

    const moveIsLegal =
      parsed.move && (legalSan.includes(parsed.move) || legalUci.includes(parsed.move));
    if (!parsed.move || !moveIsLegal) {
      throw new BadRequestException('LLM a renvoyé un coup invalide');
    }

    const applied = chess.move(parsed.move) || chess.move(this.sanFromUci(chess, parsed.move));
    if (!applied) throw new BadRequestException('Coup invalide après validation');

    await this.redis.set(cacheKey, JSON.stringify(parsed), 'EX', 60 * 60 * 6);
    return parsed;
  }

  async suggestMoves(dto: SuggestMovesDto): Promise<LlmSuggestionsResponse> {
    const { gameId, playerId, suggestionsCount = 3, style = 'balanced' } = dto;
    const game = await this.gameModel.findById(gameId).lean();
    if (!game) throw new NotFoundException('Game not found');

    const { chess, legalSan, legalUci } = this.computeLegalMoves(game.fen);
    this.assertPlayersTurn(chess, game, playerId);

    const lastMoves = await this.getLastMoves(gameId, 10);
    const cacheKey = `llm:sugg:${game.fen}:n:${suggestionsCount}:style:${style}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return this.parseJson<LlmSuggestionsResponse>(cached, { suggestions: [] });

    const prompt = suggestionsPrompt({
      fen: game.fen,
      legalMoves: [...legalSan, ...legalUci],
      lastMoves,
      count: suggestionsCount,
      style,
    });

    const text = await this.ds.complete(prompt);
    const parsed = this.parseJson<LlmSuggestionsResponse>(text, { suggestions: [] });

    parsed.suggestions = (parsed.suggestions || []).filter(
      (m) => legalSan.includes(m) || legalUci.includes(m),
    );

    await this.redis.set(cacheKey, JSON.stringify(parsed), 'EX', 60 * 60 * 6);
    return parsed;
  }
}
