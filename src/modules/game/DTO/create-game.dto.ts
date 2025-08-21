// src/games/dto/create-game.dto.ts
import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateGameDto {
  @IsOptional()
  @IsString()
  whitePlayer?: string; // ObjectId string or 'AI'

  @IsOptional()
  @IsString()
  blackPlayer?: string; // ObjectId string or 'AI'

  @IsOptional()
  @IsIn(['blitz', 'rapid', 'bullet', 'correspondence'])
  timeControl?: string; // ex '5+0' or predef key
}
