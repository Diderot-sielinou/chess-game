// src/ai/dto/generate-move.dto.ts
import { IsString, IsOptional, IsIn } from 'class-validator';

export class GenerateMoveDto {
  @IsString()
  gameId: string;

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard', 'coach'])
  difficulty?: 'easy' | 'medium' | 'hard' | 'coach';
}
