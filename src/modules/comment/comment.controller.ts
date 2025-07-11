import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CommentService, PaginatedResult } from './comment.service';
import { CommentEntity } from '../../orm/entities/comment.entity';
import { FileEntity } from '../../orm/entities/file.entity';
import { JwtAuthGuard } from '../../guards/jwt.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SortCommentsDto } from './dto/sort-comments.dto';
import { FileService } from '../file/file.service';

@Controller('comment')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly fileService: FileService,
  ) {}
  @Get('/main')
  @UseGuards(JwtAuthGuard)
  getAllMain(
    @Query() data: SortCommentsDto,
  ): Promise<PaginatedResult<CommentEntity>> {
    return this.commentService.getAllMain(data);
  }

  @Get(':uuid')
  @UseGuards(JwtAuthGuard)
  getById(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<CommentEntity> {
    return this.commentService.getByUuid(uuid);
  }

  @Get('/file/:uuid')
  @UseGuards(JwtAuthGuard)
  async fetchFileUrlFromDatabase(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Res() res: Response,
  ): Promise<void> {
    const fileUrl = await this.fileService.getFileUrlByUuid(uuid);

    res.redirect(fileUrl);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async createComment(
    @Body() data: CreateCommentDto,
    @UploadedFile() fileForm: Express.Multer.File,
  ): Promise<CommentEntity | { file: FileEntity; comment: CommentEntity }> {
    const comment = await this.commentService.createComment(data);

    if (fileForm) {
      const file = await this.fileService.upload({
        fileName: fileForm.originalname,
        fileType: fileForm.mimetype,
        fileSize: fileForm.size,
        file: fileForm.buffer,
        comment,
      });

      return { file, comment };
    }

    return comment;
  }
}
