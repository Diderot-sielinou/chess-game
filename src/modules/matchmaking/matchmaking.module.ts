import { forwardRef, Module } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';
import { MatchmakingController } from './matchmaking.controller';
import { GameModule } from '../game/game.module';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { MyLoggerModule } from '../my-logger/my-logger.module';
// import { SocketsModule } from '../sockets/sockets.module';

@Module({
  imports: [
    forwardRef(() => GameModule),
    // forwardRef(() => SocketsModule),
    UserModule,
    AuthModule,
    MyLoggerModule,
  ],

  providers: [MatchmakingService],
  controllers: [MatchmakingController],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}
