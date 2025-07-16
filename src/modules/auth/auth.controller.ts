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
import {
  ApiBearerAuth,
  ApiBody, ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags
} from "@nestjs/swagger";

import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthenticatedRequest } from '../../strategies/jwt.strategy';
import { JwtAuthGuard } from '../../guards/jwt.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Sing in',
    description: 'Starting a session and setting access and refresh tokens',
  })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to generate JWT',
  })
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
      maxAge: +process.env.COOKIE_MAX_AGE_IN_ACCESS,
      sameSite: true,
      secure: false,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: +process.env.COOKIE_MAX_AGE_IN_REFRESH,
      sameSite: true,
      secure: false,
    });

    return res.sendStatus(HttpStatus.OK);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Access token renewal',
    description: 'Updates access token via refresh token passed in cookies',
  })
  @ApiCookieAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'Access token renewal' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Refresh token missing or invalid',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to refresh token',
  })
  async refresh(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const newTokens =
      await this.authService.generateAccessTokenFromRefreshToken(
        refreshToken,
        req,
      );

    res.cookie('accessToken', newTokens.accessToken, {
      httpOnly: true,
      maxAge: +process.env.COOKIE_MAX_AGE_IN_ACCESS,
      sameSite: true,
      secure: false,
    });

    return res.sendStatus(HttpStatus.OK);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Sign out',
    description:
      'Clears access token and refresh token from cookies and ends the session',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully logged out',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No access or user is not authorized',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Logout failed',
  })
  async logout(
    @Res() res: Response,
    @Req() req: AuthenticatedRequest,
  ): Promise<Response> {
    const userUuid = req.user.uuid;
    await this.authService.logout(userUuid, req);

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    return res.sendStatus(HttpStatus.OK);
  }
}
