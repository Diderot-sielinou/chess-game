// src/auth/ws-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { MyLoggerService } from 'src/modules/my-logger/my-logger.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly jwtService: JwtService,
    // eslint-disable-next-line no-unused-vars
    private readonly logger: MyLoggerService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = client.handshake.auth?.token;

    if (!token) {
      throw new UnauthorizedException('Token manquant');
    }

    try {
      // Vérifie et décode le token
      const payload = this.jwtService.verify(token as string);
      client.data.userId = payload.sub; // On stocke l'ID utilisateur
      return true;
    } catch (err) {
      this.logger.log(`token not found in socket request${err}`);
      throw new UnauthorizedException('Token not found');
    }
  }
}
