import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^([^\s@]+@[^\s@]+\.[^\s@]+)$/, {
    message: 'Identifier must be a valid email',
  })
  email: string;
}
