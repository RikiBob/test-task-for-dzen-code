import { Controller, Get, HttpStatus, Query, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';
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
  async getCaptcha(@Res() res: Response): Promise<void> {
    const { image, token } = this.captchaService.generateCaptcha();

    res.cookie('captcha_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: +process.env.COOKIE_MAX_AGE_IN_CAPTCHA,
    });

    res.setHeader('Content-Type', 'image/png');
    res.send(image);
  }

  @Get('/validate')
  @ApiOperation({
    summary: 'Validate captcha',
    description:
      'Validates the entered captcha value against the jwt token value.',
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
    description: 'Captcha is not valid or not found token.',
  })
  validateCaptcha(
    @Query('enteredValue') enteredValue: string,
    @Res() res: Response,
    @Req() req: Request,
  ): Response {
    const token = req.cookies?.['captcha_token'];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Captcha token missing',
      });
    }

    const isValid = this.captchaService.validateCaptcha(token, enteredValue);

    res.clearCookie('captcha_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    if (isValid) {
      return res.status(200).json({ message: 'Captcha is valid.' });
    } else {
      return res.status(400).json({ message: 'Captcha is not valid.' });
    }
  }
}
