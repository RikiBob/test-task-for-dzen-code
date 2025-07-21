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
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from '../auth/auth.service';
import { FileService } from '../../file/file.service';
import { UserPictureValidationPipe } from '../../pipes/user-picture-validation.pipe';
import { JwtAuthGuard } from '../../guards/jwt.guard';
import { AuthenticatedRequest } from '../../strategies/jwt.strategy';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from '../../orm/entities/user.entity';
import { MultipartValidationPipe } from '../../pipes/parse-form-data.pipe';

@ApiTags('User')
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
  @ApiOperation({ summary: 'Create a new user with optional profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User created successfully and tokens returned as cookies',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'User name or email already exists',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to create user',
  })
  async createUser(
    @Body(new MultipartValidationPipe(CreateUserDto)) data: CreateUserDto,
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
      sameSite: 'none',
      secure: true,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: +process.env.COOKIE_MAX_AGE_IN_REFRESH,
      sameSite: 'none',
      secure: true,
    });

    return res.sendStatus(HttpStatus.OK);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('picture'))
  @UsePipes(UserPictureValidationPipe)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user data and/or profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'User with user name already exists',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to update user',
  })
  async updateUser(
    @Body(new MultipartValidationPipe(UpdateUserDto)) data: UpdateUserDto,
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

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns user data',
    type: UserEntity,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to get current user',
  })
  async getUser(@Req() req: AuthenticatedRequest): Promise<UserEntity> {
    return await this.userService.getCurrentUser(req.user.uuid);
  }

  @Get(':uuid')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by UUID' })
  @ApiParam({
    name: 'uuid',
    type: String,
    description: 'UUID of the user',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns user data',
    type: UserEntity,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to get user by uuid',
  })
  async getUserByUuid(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<UserEntity> {
    return await this.userService.getUserByUuid(uuid);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete current user and clear auth cookies' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted and cookies cleared',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to delete user',
  })
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
