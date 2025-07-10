import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { UserEntity } from '../../orm/entities/user.entity';
import { JwtPayload } from '../../strategies/jwt.strategy';
import { LoginUserDto } from './dto/login-user.dto';

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private async generateJwt(
    payload: JwtPayload,
    req: Request,
  ): Promise<TokenPair> {
    try {
      const userAgent = req.headers['user-agent'] ?? 'unknown-agent';

      const tokenPair = {
        accessToken: this.jwtService.sign(payload, {
          secret: process.env.JWT_SECRET,
          expiresIn: process.env.JWT_EXPIRES_IN_ACCESS,
        }),
        refreshToken: this.jwtService.sign(payload, {
          secret: process.env.JWT_SECRET,
          expiresIn: process.env.JWT_EXPIRES_IN_REFRESH,
        }),
      };

      await this.cacheManager.set(
        `refresh-token-${payload.sub}-${userAgent}`,
        tokenPair.refreshToken,
        2592000000,
      );

      return tokenPair;
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate JWT');
    }
  }

  private async checkUserExists(email: string): Promise<UserEntity> {
    const existingUser = await this.userRepository.findOneBy({
      email,
    });

    if (!existingUser) {
      throw new BadRequestException('Invalid email');
    }

    return existingUser;
  }

  private async isPasswordValid(
    password: string,
    user: UserEntity,
  ): Promise<boolean> {
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }

    return isPasswordValid;
  }

  async signIn(data: LoginUserDto, req: Request): Promise<TokenPair> {
    const existingUser = await this.checkUserExists(data.email);
    await this.isPasswordValid(data.password, existingUser);

    return this.generateJwt(
      {
        sub: existingUser.uuid,
        login: existingUser.email,
      },
      req,
    );
  }

  private async validateRefreshTokenFromCache(
    adminId: number,
    userAgent: string,
    refreshToken: string,
  ): Promise<void> {
    const storedRefreshToken = await this.cacheManager.get<string | null>(
      `refresh-token-${adminId}-${userAgent}`,
    );

    if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
  }

  async refreshToken(
    refreshToken: string,
    req: Request,
  ): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });

      const userAgent = req.headers['user-agent'] ?? 'unknown-agent';

      const { sub, login } = payload;

      await this.validateRefreshTokenFromCache(sub, userAgent, refreshToken);

      const newAccessToken = this.jwtService.sign(
        { sub, login },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: process.env.JWT_EXPIRES_IN_ACCESS,
        },
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to refresh token');
    }
  }

  async logout(uuid: string, req: Request): Promise<void> {
    try {
      const userAgent = req.headers['user-agent'] ?? 'unknown-agent';
      await this.cacheManager.del(`refresh-token-${uuid}-${userAgent}`);
    } catch (error) {
      throw new InternalServerErrorException('Logout failed');
    }
  }
}
