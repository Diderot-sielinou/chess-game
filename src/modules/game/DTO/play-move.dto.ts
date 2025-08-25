// src/games/dto/play-move.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class PlayMoveDto {
  @IsString()
  @IsNotEmpty()
  gameId: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  playerId?: string;

  @IsString()
  @IsNotEmpty()
  move: string; // SAN or UCI like 'e2e4' or 'Nf3' (we'll accept both)

  @IsOptional()
  @IsString()
  promotion?: string;
}
