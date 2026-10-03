import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;

  constructor(private configService: ConfigService) {
    this.from = this.configService.get<string>('EMAIL_FROM', 'noreply@skffitness.com');
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailEnabled = this.configService.get<string>('EMAIL_ENABLED', 'false') === 'true';
    
    if (!emailEnabled) {
      this.logger.warn('Email service is disabled. Set EMAIL_ENABLED=true in .env to enable.');
      return;
    }

    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP configuration incomplete. Email sending will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    this.logger.log('Email transporter initialized successfully');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`Email not sent (service disabled): ${options.subject} to ${options.to}`);
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      });

      this.logger.log(`Email sent successfully: ${options.subject} to ${options.to} (ID: ${info.messageId})`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${options.subject} to ${options.to}`, error.message);
      return false;
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}
