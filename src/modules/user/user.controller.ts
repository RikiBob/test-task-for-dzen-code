import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from '../auth/auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from "../../file/file.service";
import { UserPictureValidationPipe } from "../../pipes/user-picture-validation.pipe";

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('picture'))
  @UsePipes(UserPictureValidationPipe)
  async createUser(
    @Body() data: CreateUserDto,
    @UploadedFile() fileForm: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const { email, password } = data;

    if (fileForm) {
      const file = await this.fileService.upload({
        fileName: fileForm.originalname,
        fileType: fileForm.mimetype,
        fileSize: fileForm.size,
        file: fileForm.buffer,
      });

      await this.userService.createUser(data, file.url);
    } else {
      await this.userService.createUser(data);
    }

    const { accessToken, refreshToken } = await this.authService.signIn(
      {
        email,
        password,
      },
      req,
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      maxAge: +process.env.COOKIE_MAX_AGE_IN_ACCESS,
      sameSite: true,
      secure: true,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: +process.env.COOKIE_MAX_AGE_IN_REFRESH,
      sameSite: true,
      secure: true,
    });

    return res.sendStatus(HttpStatus.OK);
  }
}
