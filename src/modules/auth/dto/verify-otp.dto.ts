// src/auth/dto/verify-otp.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  userIdentifier: string;

  @IsNotEmpty()
  @IsString()
  code: string;
}
