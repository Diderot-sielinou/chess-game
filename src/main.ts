import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MyLoggerService } from './modules/my-logger/my-logger.service';
import { AllExceptionsFilter } from './common/filter/all-exceptions.filter';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new MyLoggerService();

  const app = await NestFactory.create(AppModule, { logger });

  app.enableShutdownHooks();

  logger.log('Starting backend application...');

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Middleware cookie-parser (pour gérer les cookies)
  app.use(cookieParser());

  // Préfixe global pour toutes les routes
  app.setGlobalPrefix('api');

  // Validation globale avec transformation et whitelist des DTO
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: false, // Passe à true en production
    }),
  );

  // Filtre global des exceptions avec logger
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
