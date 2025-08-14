import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { MyLoggerModule } from '../my-logger/my-logger.module';
import { AppConfigModule } from 'src/config/config.module';
import { AuthModule } from '../auth/auth.module';
import { GameSchema, GameSchemaName, MoveSchema, MoveSchemaName } from 'src/models';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from 'src/infa/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GameSchemaName, schema: GameSchema },
      { name: MoveSchemaName, schema: MoveSchema },
    ]),
    MyLoggerModule,
    AppConfigModule,
    AuthModule,
    RedisModule,
  ],
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
