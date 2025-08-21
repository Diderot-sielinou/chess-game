// src/games/dto/list-games.dto.ts
import { IsOptional, IsNumberString } from 'class-validator';

export class ListGamesDto {
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsNumberString()
  skip?: string;
}
