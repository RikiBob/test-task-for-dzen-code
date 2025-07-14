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

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  private async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ email });
  }

  private async findByUserName(userName: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ userName });
  }

  private async checkAndGetUserExistsByEmail(
    email: string,
  ): Promise<UserEntity> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new BadRequestException(`User with email ${email} no exists`);
    }

    return user;
  }

  async validateUserCredentials(
    userName: string,
    email: string,
    userUuid: string,
  ): Promise<UserEntity> {
    const user = await this.checkAndGetUserExistsByEmail(email);

    if (userName !== user.userName || userUuid !== user.uuid) {
      throw new BadRequestException(
        `Username ${userName} does not match the user registered with email ${email}`,
      );
    }

    return user;
  }

  private async checkUserNotExistsByEmail(email: string): Promise<void> {
    const user = await this.findByEmail(email);

    if (user) {
      throw new BadRequestException(`User with email ${email} already exists`);
    }
  }

  private async checkUserNotExistsByUserName(userName: string): Promise<void> {
    const user = await this.findByUserName(userName);

    if (user) {
      throw new BadRequestException(
        `User with username ${userName} already exists`,
      );
    }
  }

  async createUser(data: CreateUserDto, url?: string): Promise<UserEntity> {
    try {
      const { email, userName } = data;

      await this.checkUserNotExistsByEmail(email);
      await this.checkUserNotExistsByUserName(userName);

      const user = this.userRepository.create({
        ...data,
        picture: url,
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
}
