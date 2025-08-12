import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly config: NestConfigService) {}

  get DATABASE_URL(): string | undefined {
    return this.config.get<string>('DATABASE_URL');
  }
}
