import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserEntity } from '../../orm/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthenticatedRequest } from '../../strategies/jwt.strategy';
import { AuthService } from '../auth/auth.service';
import { FileService } from '../../file/file.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly authService: AuthService,
    private readonly fileService: FileService,
  ) {}

  private async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ email });
  }

  private async findByUserName(userName: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ userName });
  }

  private async findByUuid(uuid: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ uuid });
  }

  async checkUserNotExistsByEmail(email: string): Promise<void> {
    const user = await this.findByEmail(email);

    if (user) {
      throw new BadRequestException(`User with email ${email} already exists`);
    }
  }

  async checkUserNotExistsByUserName(userName: string): Promise<void> {
    const user = await this.findByUserName(userName);

    if (user) {
      throw new BadRequestException(
        `User with username ${userName} already exists`,
      );
    }
  }

  async checkAndGetUserNameAvailableForUpdate(
    userName: string,
    uuid: string,
  ): Promise<UserEntity> {
    const user = await this.findByUserName(userName);

    if (user?.userName === userName && user?.uuid !== uuid) {
      throw new BadRequestException(
        `User with user name ${userName} already exists`,
      );
    }

    return user;
  }

  async createUser(data: CreateUserDto, picture?: string): Promise<UserEntity> {
    try {
      const user = this.userRepository.create({
        ...data,
        picture,
      });

      await this.userRepository.save(user);

      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async updateUser(
    uuid: string,
    data: UpdateUserDto,
    picture?: string,
  ): Promise<UserEntity> {
    try {
      const user = this.userRepository.create({
        uuid,
        ...data,
        picture,
      });

      return await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async getUserByUuid(uuid: string): Promise<UserEntity> {
    return await this.findByUuid(uuid);
  }

  async deleteUser(uuid: string, req: AuthenticatedRequest): Promise<void> {
    try {
      const user = await this.getUserByUuid(uuid);

      await this.fileService.checkAndDeleteExistsByUrl(user.picture);
      await this.userRepository.delete(uuid);
      await this.authService.logout(uuid, req);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to delete user');
    }
  }
}
