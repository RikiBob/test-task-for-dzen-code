import { Body, Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/creat-user.dto';
import { AuthService } from '../auth/auth.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async createUser(
    @Body() data: CreateUserDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const { email, password } = data;
    await this.userService.createUser(data);
    const { accessToken, refreshToken } = await this.authService.signIn(
      {
        email,
        password,
      },
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
}
