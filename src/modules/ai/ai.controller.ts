// src/ai/ai.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateMoveDto } from './dto/generate-move.dto';
import { SuggestMovesDto } from './dto/suggest-moves.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Importez votre guard JWT ici

@Controller('ai')
export class AiController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly aiService: AiService) {}

  /**
   * Génère un coup (mode Vs Machine).
   * Body: { gameId, difficulty? }
   */
  @UseGuards(JwtAuthGuard)
  @Post('generate-move')
  async generateMove(@Body() dto: GenerateMoveDto) {
    const res = await this.aiService.generateMove(dto);
    return res; // { move, explanation }
  }

  /**
   * Propose des suggestions pour le joueur dont c'est le tour.
   * Body: { gameId, suggestionsCount?, style? }
   */
  @UseGuards(JwtAuthGuard)
  @Post('suggest-moves')
  async suggestMoves(@Body() dto: SuggestMovesDto, @Req() req) {
    const playerId = req.user.userId; // Récupérez l'ID du joueur depuis le token
    const res = await this.aiService.suggestMoves({ ...dto, playerId });
    return res; // { suggestions, explanations? }
  }
}
