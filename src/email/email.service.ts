import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

@Injectable()
export class EmailService {
  private transporter;
  private templatesDir: string;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates
      },
    });

    this.templatesDir = this.configService.get('EMAIL_TEMPLATES_DIR') + '';
  }

  private async compileTemplate(
    templateName: string,
    context: any,
  ): Promise<string> {
    const templatePath = path.join(
      process.cwd(),
      this.templatesDir,
      `${templateName}.hbs`,
    );
    const templateSource = await fs.promises.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);
    return template(context);
  }

  async sendConfirmationEmail(
    email: string,
    token: string,
    lang: string = 'en',
  ): Promise<boolean> {
    const confirmationUrl = `${this.configService.get('FRONTEND_URL')}/auth/confirm-email?token=${token}`;

    try {
      const html = await this.compileTemplate('account_confirmation_' + lang, {
        appName: this.configService.get('APP_NAME'),
        confirmationUrl,
        currentYear: new Date().getFullYear(),
      });

      await this.transporter.sendMail({
        from: this.configService.get('SMTP_USER'),
        to: email,
        subject:
          this.configService.get('APP_NAME') + ' - ' + 'Confirm your email',
        html,
      });
      return true;
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return false;
    }
  }

  // Generic email sending method for other templates
  async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    context: any,
  ): Promise<boolean> {
    try {
      const html = await this.compileTemplate(templateName, {
        ...context,
        appName: this.configService.get('APP_NAME'),
        currentYear: new Date().getFullYear(),
      });

      await this.transporter.sendMail({
        from: this.configService.get('SMTP_USER'),
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    lang: string = 'en',
  ): Promise<boolean> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/auth/reset-password?token=${token}`;

    try {
      const html = await this.compileTemplate('password_reset_' + lang, {
        appName: this.configService.get('APP_NAME'),
        resetUrl,
        currentYear: new Date().getFullYear(),
      });

      await this.transporter.sendMail({
        from: this.configService.get('SMTP_USER'),
        to: email,
        subject:
          this.configService.get('APP_NAME') + ' - ' + 'Reset Your Password',
        html,
      });
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }
}

