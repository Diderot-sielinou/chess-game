import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { UserSchema, UserSchemaName, OTPSessionSchema, OTPSessionSchemaName } from 'src/models';

import { AppConfigService } from 'src/config/config.service';
import { AppConfigModule } from 'src/config/config.module';
import { MyLoggerModule } from '../my-logger/my-logger.module';
import { EmailModule } from 'src/email/email.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserModule } from '../user/user.module';
import { WsAuthGuard } from './guards/ws-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSchemaName, schema: UserSchema },
      { name: OTPSessionSchemaName, schema: OTPSessionSchema },
    ]),
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: config.jwtExpiresIn },
      }),
    }),
    MyLoggerModule,
    EmailModule,
    AppConfigModule,
    forwardRef(() => UserModule), // <-- ici
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, WsAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, WsAuthGuard, JwtModule],
})
export class AuthModule {}
