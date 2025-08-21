import { forwardRef, Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { AuthModule } from '../auth/auth.module';
import { MyLoggerModule } from '../my-logger/my-logger.module';
import { AppConfigModule } from 'src/config/config.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GameSchemaName,
  GameSchema,
  MoveSchemaName,
  MoveSchema,
  UserSchemaName,
  UserSchema,
} from 'src/models';
import { AiModule } from '../ai/ai.module';
import { UserModule } from '../user/user.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GameSchemaName, schema: GameSchema },
      { name: MoveSchemaName, schema: MoveSchema },
      { name: UserSchemaName, schema: UserSchema },
    ]),

    forwardRef(() => AuthModule), // <-- pour injecter WsAuthGuard et JwtService
    MyLoggerModule,
    AppConfigModule,
    AiModule,
    UserModule,
    EventEmitterModule.forRoot(),
  ],
  providers: [GameService],
  controllers: [GameController],
  exports: [GameService],
})
export class GameModule {}
