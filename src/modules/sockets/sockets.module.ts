import { forwardRef, Module } from '@nestjs/common';
import { SocketsService } from './sockets.service';
import { SocketsController } from './sockets.controller';
import { GameModule } from '../game/game.module';
import { MatchmakingModule } from '../matchmaking/matchmaking.module';
import { AiModule } from '../ai/ai.module';
import { GameGateway } from './game.gateway';
import { AuthModule } from '../auth/auth.module';
import { MyLoggerModule } from '../my-logger/my-logger.module';

@Module({
  imports: [
    forwardRef(() => GameModule),
    forwardRef(() => MatchmakingModule), // <- avec forwardRef pour gérer la circularité
    AiModule,
    MyLoggerModule,
    forwardRef(() => AuthModule), // <-- donne accès à WsAuthGuard, JwtService, MyLoggerService
  ],

  providers: [SocketsService, GameGateway],
  controllers: [SocketsController],
  exports: [GameGateway],
})
export class SocketsModule {}
