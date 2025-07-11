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

  async checkUserExistsByEmail(email: string): Promise<void> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new BadRequestException(`User with email ${email} no exists`);
    }
  }

  async checkUserExistsByUserName(userName: string): Promise<void> {
    const user = await this.findByUserName(userName);

    if (!user) {
      throw new BadRequestException(`User with username ${userName} no exists`);
    }
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

  async createUser(data: CreateUserDto): Promise<UserEntity> {
    try {
      const { email, userName } = data;

      await this.checkUserNotExistsByEmail(email);
      await this.checkUserNotExistsByUserName(userName);

      const user = this.userRepository.create({
        ...data,
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
