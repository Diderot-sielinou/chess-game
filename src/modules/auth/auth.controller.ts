// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { ErrorCode } from 'src/common/errors/error-codes.enum';

@Controller('auth')
export class AuthController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  async requestOtp(@Body() body: RequestOtpDto) {
    const userIdentifier = body.email;
    if (!userIdentifier) throwHttpError(ErrorCode.BAD_REQUEST, { message: 'Email is required' });

    await this.authService.requestOTP(userIdentifier);
    return { message: 'OTP send', userIdentifier }; // <-- return userIdentifier
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: VerifyOtpDto) {
    return await this.authService.verifyOTP(body.email, body.code);
  }
}
