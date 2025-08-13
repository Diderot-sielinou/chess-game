// src/email/email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { AppConfigService } from 'src/config/config.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  // eslint-disable-next-line no-unused-vars
  constructor(private configService: AppConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.emailUser,
        pass: this.configService.emailPassword,
      },
    });
  }

  async sendMail(to: string, subject: string, text: string) {
    console.log(`destinatare: ${to},from : ${this.configService.emailUser},✅✅✅`);
    try {
      await this.transporter.sendMail({
        from: `${this.configService.emailUser}`,
        to: to,
        subject: subject, // sujet de l'email
        text: text,
      });
      console.log(`✅ send to ${to}`);
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi de l'email:", error);
      throw new Error('Unable to send email');
    }
  }
}
