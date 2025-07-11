import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { CommentEntity } from '../../orm/entities/comment.entity';
import { WSModule } from '../ws/ws.module';
import { FileModule } from '../file/file.module';
import { FileEntity } from '../../orm/entities/file.entity';
import { UserEntity } from '../../orm/entities/user.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentEntity, FileEntity, UserEntity]),
    FileModule,
    WSModule,
    UserModule,
  ],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
