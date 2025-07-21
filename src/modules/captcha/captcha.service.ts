import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as Canvas from 'canvas';
import { sign, verify } from 'jsonwebtoken';

@Injectable()
export class CaptchaService {
  generateCaptcha(): { image: Buffer; token: string } {
    try {
      const { image, text } = this.generateCaptchaImage();
      const token = this.generateCaptchaToken(text);

      return { image, token };
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate captcha');
    }
  }

  validateCaptcha(token: string, enteredValue: string): boolean {
    try {
      const { captchaText } = verify(token, process.env.JWT_SECRET) as {
        captchaText: string;
      };
      return this.isCaptchaValid(enteredValue, captchaText);
    } catch (error) {
      return false;
    }
  }

  private generateCaptchaToken(captchaText: string): string {
    return sign({ captchaText }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN_CAPTCHA,
    });
  }

  private generateCaptchaImage(): { image: Buffer; text: string } {
    const canvas = Canvas.createCanvas(150, 50);
    const ctx = canvas.getContext('2d');
    const text = this.generateRandomString();

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '30px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(text, 10, 40);

    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 10,
        Math.random() * 10,
      );
    }

    return { image: canvas.toBuffer(), text };
  }

  private generateRandomString(): string {
    const chars = [
      ...'0123456789',
      ...'abcdefghijklmnopqrstuvwxyz',
      ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    ];
    const length = 6;
    return Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('');
  }

  private isCaptchaValid(enteredValue: string, captchaText: string): boolean {
    return enteredValue.toLowerCase() === captchaText.toLowerCase();
  }
}
