import * as dotenv from 'dotenv';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './orm/entities/user.entity';
import { CommentEntity } from './orm/entities/comment.entity';
import { FileEntity } from './orm/entities/file.entity';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CommentModule } from './modules/comment/comment.module';
import { CaptchaModule } from './modules/captcha/captcha.module';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: ['dist/**/*.entity.js'],
      migrations: ['dist/orm/migrations/*.js'],
      synchronize: false,
    }),
    AuthModule,
    UserModule,
    CommentModule,
    CaptchaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
