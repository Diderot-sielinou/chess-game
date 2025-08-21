// src/ai/dto/suggest-moves.dto.ts
import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class SuggestMovesDto {
  @IsString()
  gameId: string;

  @IsString()
  @IsOptional()
  playerId?: string;

  @IsOptional()
  @IsNumber()
  suggestionsCount?: number;

  @IsOptional()
  @IsIn(['balanced', 'aggressive', 'defensive'])
  style?: 'balanced' | 'aggressive' | 'defensive';
}
