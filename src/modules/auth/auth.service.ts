import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';

import { IUser, IOTPSession, UserSchemaName, OTPSessionSchemaName } from 'src/models';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { MyLoggerService } from '../my-logger/my-logger.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    // eslint-disable-next-line no-unused-vars
    @InjectModel(UserSchemaName) private readonly userModel: Model<IUser>,
    // eslint-disable-next-line no-unused-vars
    @InjectModel(OTPSessionSchemaName) private readonly otpSessionModel: Model<IOTPSession>,
    // eslint-disable-next-line no-unused-vars
    private readonly jwtService: JwtService,
    // eslint-disable-next-line no-unused-vars
    private readonly logger: MyLoggerService,
    // eslint-disable-next-line no-unused-vars
    private readonly emailService: EmailService,
  ) {}

  async requestOTP(email: string): Promise<void> {
    const otpCode = ('' + Math.floor(100000 + Math.random() * 900000)).slice(0, 6);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.otpSessionModel.deleteMany({ userIdentifier: email });

    await this.otpSessionModel.create({
      userIdentifier: email,
      otpCode,
      expiresAt,
      attempts: 0,
    });

    await this.emailService.sendMail(
      email,
      'Your OTP code',
      `Your OTP code is : ${otpCode}\nIl will expire in 5 minutes.`,
    );
    this.logger.log(`OTP send at ${email}: ${otpCode}`);
  }

  async verifyOTP(email: string, code: string) {
    const session = await this.otpSessionModel
      .findOne({ userIdentifier: email })
      .sort({ expiresAt: -1 });

    if (!session) throwHttpError(ErrorCode.OTP_INVALID);
    if (session.expiresAt < new Date()) throwHttpError(ErrorCode.OTP_EXPIRED);
    if (session.attempts >= 5) throwHttpError(ErrorCode.ACCOUNT_LOCKED);

    if (session.otpCode !== code) {
      session.attempts++;
      this.logger.log(`using ${email} trying to log in with an incorrect OTP`);
      await session.save();
      throwHttpError(ErrorCode.OTP_INVALID);
    }

    let user = await this.userModel.findOne({
      $or: [{ email }],
    });

    if (!user) {
      this.logger.log(`creation of user ${email} in the database`);
      user = await this.userModel.create({
        displayName: `User_${crypto.randomBytes(3).toString('hex')}`,
        phone: /^\d+$/.test(email) ? email : undefined,
        email: /@/.test(email) ? email : undefined,
      });
    }

    const payload = { sub: user._id, name: user.displayName };
    const accessToken = this.jwtService.sign(payload);

    await this.otpSessionModel.deleteOne({ _id: session._id });
    this.logger.log(`delete the otp session and generate the accesToken for the user ${email}`);

    return { accessToken, user };
  }
}
