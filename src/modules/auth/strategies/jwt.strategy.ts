import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from 'src/config/config.service';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { UserService } from 'src/modules/user/user.service';

export interface JwtPayload {
  sub: string;
  name?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: AppConfigService,
    @Inject(forwardRef(() => UserService))
    // eslint-disable-next-line no-unused-vars
    private readonly userService: UserService,
  ) {
    const jwtSecret = configService.jwtSecret;
    if (!jwtSecret) {
      throwHttpError(ErrorCode.INTERNAL_SERVER_ERROR, {
        reason: 'JWT_SECRET environment variable is not defined.',
      });
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          let token: string | null = null;

          if (request?.headers?.authorization?.startsWith('Bearer')) {
            token = request.headers.authorization.split(' ')[1];
            console.log('[JwtStrategy] Token reçu :', token);
          } else {
            console.warn('[JwtStrategy] No JWT token found in the Authorization header');
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    // console.log('JWT payload reçu  dans validate:', payload); // <--- ajouter ce log

    if (!payload?.sub) {
      throwHttpError(ErrorCode.UNAUTHORIZED, { reason: 'JWT payload missing sub' });
    }
    const user = await this.userService.getById(payload.sub);
    if (!user) {
      throwHttpError(ErrorCode.UNAUTHORIZED, { reason: 'Utilisateur inexistant' });
    }
    // console.log('info estrire du payload', JSON.stringify(payload));
    return { userId: user._id?.toString(), username: user.displayName };
  }
}
