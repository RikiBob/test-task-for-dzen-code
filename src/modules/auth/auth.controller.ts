import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthenticatedRequest } from '../../strategies/jwt.strategy';
import { JwtAuthGuard } from '../../guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() data: LoginUserDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const { accessToken, refreshToken } = await this.authService.signIn(
      data,
      req,
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      maxAge: 60 * 30 * 1000,
      sameSite: true,
      secure: true,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 2592000000,
      sameSite: true,
      secure: true,
    });

    return res.sendStatus(HttpStatus.OK);
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.['refresh-token'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const newTokens = await this.authService.refreshToken(refreshToken, req);

    res.cookie('access-token', newTokens.accessToken, {
      httpOnly: true,
      maxAge: 60 * 30 * 1000,
      sameSite: true,
      secure: true,
    });

    return res.sendStatus(HttpStatus.OK);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Res() res: Response,
    @Req() req: AuthenticatedRequest,
  ): Promise<Response> {
    const userUuid = req.user.uuid;
    await this.authService.logout(userUuid, req);

    res.clearCookie('access-token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    res.clearCookie('refresh-token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    return res.sendStatus(HttpStatus.OK);
  }
}
