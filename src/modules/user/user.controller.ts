import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from '../auth/auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from '../../file/file.service';
import { UserPictureValidationPipe } from '../../pipes/user-picture-validation.pipe';
import { JwtAuthGuard } from '../../guards/jwt.guard';
import { AuthenticatedRequest } from '../../strategies/jwt.strategy';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from '../../orm/entities/user.entity';

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
    const { email, password, userName } = data;

    await this.userService.checkUserNotExistsByEmail(email);
    await this.userService.checkUserNotExistsByUserName(userName);

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

  @Put()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('picture'))
  @UsePipes(UserPictureValidationPipe)
  async updateUser(
    @Body() data: UpdateUserDto,
    @UploadedFile() fileForm: Express.Multer.File,
    @Res() res: Response,
    @Req() req: AuthenticatedRequest,
  ): Promise<Response> {
    const userUuid = req.user.uuid;
    const { userName } = data;

    const user = await this.userService.checkAndGetUserNameAvailableForUpdate(
      userName,
      userUuid,
    );

    if (fileForm) {
      const file = await this.fileService.upload({
        fileName: fileForm.originalname,
        fileType: fileForm.mimetype,
        fileSize: fileForm.size,
        file: fileForm.buffer,
        pictureUrl: user.picture,
      });

      await this.userService.updateUser(userUuid, data, file.url);
    } else {
      await this.userService.updateUser(userUuid, data);
    }

    return res.sendStatus(HttpStatus.OK);
  }

  @Get(':uuid')
  @UseGuards(JwtAuthGuard)
  async getUserByUuid(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<UserEntity> {
    return await this.userService.getUserByUuid(uuid);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async deleteUser(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<Response> {
    const userUuid = req.user.uuid;

    await this.userService.deleteUser(userUuid, req);

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
