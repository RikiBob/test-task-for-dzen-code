import { PassportStrategy } from '@nestjs/passport';
import { Repository } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserEntity } from '../orm/entities/user.entity';

export type JwtPayload = {
  sub: string;
  login: string;
};

export interface AuthenticatedRequest extends Request {
  user: UserEntity;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJwt,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<UserEntity> {
    const user = await this.userRepository.findOneBy({
      uuid: payload.sub,
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  private static extractJwt(req: Request): string | null {
    if (
      req.cookies &&
      'accessToken' in req.cookies &&
      req.cookies.accessToken.length > 0
    ) {
      return req.cookies.accessToken;
    }

    return null;
  }
}
