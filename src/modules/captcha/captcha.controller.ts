import { Controller, Get, Query, Res, Session } from '@nestjs/common';
import { Response } from 'express';
import { CaptchaService } from './captcha.service';

@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get()
  async getCaptcha(
    @Res() res: Response,
    @Session() session: Record<string, string>,
  ): Promise<void> {
    const { image, text } = this.captchaService.generateCaptcha();

    session.captchaText = text;

    res.set({ 'Content-Type': 'image/png' });

    res.send(image);
  }

  @Get('/validate')
  validateCaptcha(
    @Query('enteredValue') enteredValue: string,
    @Res() res: Response,
    @Session() session: Record<string, string>,
  ): Response {
    const captchaText = session.captchaText;

    if (!captchaText) {
      return res.status(400).json({ message: 'Captcha text not found.' });
    }

    const isValid = this.captchaService.isCaptchaValid(
      enteredValue,
      captchaText,
    );

    if (isValid) {
      return res.status(200).json({ message: 'Captcha is valid.' });
    } else {
      return res.status(400).json({ message: 'Captcha is not valid.' });
    }
  }
}
