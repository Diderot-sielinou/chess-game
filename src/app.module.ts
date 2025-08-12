import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MyLoggerModule } from './modules/my-logger/my-logger.module';

@Module({
  imports: [MyLoggerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
