import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Res,
  Session,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CaptchaService } from './captcha.service';

@ApiTags('Captcha')
@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get()
  @ApiOperation({
    summary: 'Generate captcha image',
    description:
      'Generates a new captcha image and saves its text in the session for further validation.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns captcha image as PNG.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Filed to get captcha file.',
  })
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
  @ApiOperation({
    summary: 'Validate captcha',
    description:
      'Validates the entered captcha value against the stored session value.',
  })
  @ApiQuery({
    name: 'enteredValue',
    type: String,
    description: 'The captcha value entered by the user.',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Captcha is valid.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Captcha is not valid or not found in session.',
  })
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
