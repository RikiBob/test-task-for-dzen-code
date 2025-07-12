import { Injectable } from '@nestjs/common';
import * as Canvas from 'canvas';

@Injectable()
export class CaptchaService {
  generateCaptcha(): { image: Buffer; text: string } {
    const canvas = Canvas.createCanvas(150, 50);
    const ctx = canvas.getContext('2d');

    const text = this.generateRandomString();

    ctx.font = '30px Arial';
    ctx.fillText(text, 10, 40);

    const buffer = canvas.toBuffer();

    return { image: buffer, text };
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

  isCaptchaValid(enteredValue: string, captchaText: string): boolean {
    return enteredValue === captchaText;
  }
}
