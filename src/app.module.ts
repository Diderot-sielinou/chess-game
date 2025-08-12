import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MyLoggerModule } from './modules/my-logger/my-logger.module';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        uri: configService.DATABASE_URL,
      }),
    }),
    MyLoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
