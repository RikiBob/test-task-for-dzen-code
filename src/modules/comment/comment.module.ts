import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { CommentEntity } from '../../orm/entities/comment.entity';
import { FileEntity } from '../../orm/entities/file.entity';
import { UserEntity } from '../../orm/entities/user.entity';
import { FileService } from '../../file/file.service';
import { WSGateway } from '../../ws/ws.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity, FileEntity, UserEntity])],
  controllers: [CommentController],
  providers: [CommentService, FileService, WSGateway],
})
export class CommentModule {}
