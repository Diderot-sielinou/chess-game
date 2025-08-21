// src/matchmaking/matchmaking.controller.ts
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('matchmaking')
export class MatchmakingController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly matchmakingService: MatchmakingService) {}

  @Post('join')
  @UseGuards(JwtAuthGuard)
  async joinQueue(@Request() req, @Body() body: { timeControl?: string }) {
    const userId = req.user.userId; // ID du joueur extrait du jeton
    const game = await this.matchmakingService.enqueue(userId as string, body.timeControl);
    return game || { message: 'Waiting for another player...' };
  }

  @Get('queue')
  getQueue() {
    return this.matchmakingService.getQueue();
  }
}
