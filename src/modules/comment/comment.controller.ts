import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CommentService, PaginatedResult } from './comment.service';
import { CommentEntity } from '../../orm/entities/comment.entity';
import { FileEntity } from '../../orm/entities/file.entity';
import { JwtAuthGuard } from '../../guards/jwt.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SortCommentsDto } from './dto/sort-comments.dto';
import { FileService } from '../../file/file.service';
import { AuthenticatedRequest } from '../../strategies/jwt.strategy';
import { CommentTextValidationPipe } from '../../pipes/comment-text-validation.pipe';
import { CommentFileValidationPipe } from '../../pipes/comment-file-validation.pipe';

@ApiTags('Comment')
@ApiBearerAuth()
@Controller('comment')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly fileService: FileService,
  ) {}

  @Get('/main')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all main comments with pagination and sorting',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated list of main comments',
    type: CommentEntity,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve main comments',
  })
  getAllMain(
    @Query() data: SortCommentsDto,
  ): Promise<PaginatedResult<CommentEntity>> {
    return this.commentService.getAllMain(data);
  }

  @Get(':uuid')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get comment by UUID with its nested structure' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the comment with all its child comments',
    type: CommentEntity,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve comment by uuid',
  })
  getById(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<CommentEntity> {
    return this.commentService.getByUuid(uuid);
  }

  @Get('/file/:uuid')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Fetch file URL by UUID and redirect' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to the file URL stored in the database',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to fetch file',
  })
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
  @UsePipes(CommentFileValidationPipe, CommentTextValidationPipe)
  @ApiOperation({ summary: 'Create a new comment with optional file upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Comment data with optional file',
    type: CreateCommentDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Returns the created comment and optionally its file',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Incorrect name or email address',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to create comment',
  })
  async createComment(
    @Body() data: CreateCommentDto,
    @UploadedFile() fileForm: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<CommentEntity | { file: FileEntity; comment: CommentEntity }> {
    const userUuid = req.user.uuid;
    const comment = await this.commentService.createComment(data, userUuid);

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
