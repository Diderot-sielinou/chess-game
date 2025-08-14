import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly config: NestConfigService) {}

  get DATABASE_URL(): string | undefined {
    return this.config.get<string>('DATABASE_URL');
  }

  get jwtSecret(): string | undefined {
    return this.config.get<string>('JWT_SECRET');
  }

  get jwtExpiresIn(): string | undefined {
    return this.config.get<string>('JWT_ACCESS_TOKEN_EXPIRATION');
  }
  get emailUser(): string | undefined {
    return this.config.get<string>('EMAIL_USER');
  }
  get emailPassword(): string | undefined {
    return this.config.get<string>('EMAIL_PASSWORD');
  }
  get deepseekApiKey(): string | undefined {
    return this.config.get<string>('DEEPSEEK_API_KEY');
  }

  get deepseekUrl(): string | undefined {
    return this.config.get<string>('DEEPSEEK_API_URL');
  }
}
