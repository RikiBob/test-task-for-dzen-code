import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserEntity } from '../../orm/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { FileService } from "../../file/file.service";
import { FileEntity } from "../../orm/entities/file.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, FileEntity]), AuthModule],
  controllers: [UserController],
  providers: [UserService, FileService],
  exports: [UserService],
})
export class UserModule {}
