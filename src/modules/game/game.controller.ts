// src/games/games.controller.ts
import { Controller, Post, Body, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { GameService } from './game.service';
// import { CreateGameDto } from './DTO/create-game.dto';
import { ListGamesDto } from './DTO/list-games.dto';
import { PlayMoveDto } from './DTO/play-move.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('games')
@UseGuards(JwtAuthGuard) // Protège tous les endpoints de ce contrôleur
export class GameController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly gamesService: GameService) {}

  @Post('create-vs-ai')
  async createVsAi(@Request() req, @Body() body: { timeControl?: string }) {
    const userId = req.user.userId; // ID du joueur extrait du jeton
    const game = await this.gamesService.createGame({
      whitePlayer: userId,
      blackPlayer: 'AI',
      timeControl: body.timeControl || '300+0',
    });
    return game;
  }

  @Post(':gameId/resign')
  async resignGame(@Request() req, @Param('gameId') gameId: string) {
    const userId = req.user.userId; // ID du joueur extrait du jeton
    await this.gamesService.resign(gameId, userId as string);
    return { message: 'Game successfully abandoned.' };
  }

  // @Post('create')
  // async create(@Body() dto: CreateGameDto, @Req() req) {
  //   const playerId = req.user.userId; // Récupérez l'ID du joueur depuis le token
  //   return this.gamesService.createGame(dto);
  // }

  @Get('list')
  async list(@Query() q: ListGamesDto) {
    const limit = q.limit ? parseInt(q.limit, 10) : 20;
    const skip = q.skip ? parseInt(q.skip, 10) : 0;
    return this.gamesService.listGames({}, limit, skip);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.gamesService.getGame(id);
  }

  @Post('move')
  async playMove(@Request() req, @Body() dto: PlayMoveDto) {
    const playerId = req.user.userId; // ID du joueur extrait du jeton

    return this.gamesService.playMove(dto.gameId, playerId as string, dto.move, dto.promotion);
  }

  @Get(':id/last-moves')
  async lastMoves(@Param('id') id: string) {
    return this.gamesService.getLastMoves(id, 10);
  }
}
