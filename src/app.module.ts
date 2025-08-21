import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MyLoggerModule } from './modules/my-logger/my-logger.module';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { AiModule } from './modules/ai/ai.module';
import { RedisModule } from './infa/redis.module';
import { GameModule } from './modules/game/game.module';
import { SocketsModule } from './modules/sockets/sockets.module';
import { MatchmakingModule } from './modules/matchmaking/matchmaking.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        uri: configService.LOCAL_DATABASE,
        serverSelectionTimeoutMS: 7000, // timeout 5s
      }),
    }),
    MyLoggerModule,
    AuthModule,
    UserModule,
    AiModule,
    RedisModule,
    GameModule,
    SocketsModule,
    MatchmakingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
