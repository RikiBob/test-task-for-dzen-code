import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommentEntity } from '../../orm/entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SortCommentsDto } from './dto/sort-comments.dto';
import { WSGateway } from '../ws/ws.gateway';
import { UserService } from '../user/user.service';

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
};

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    private readonly userService: UserService,
    private readonly webSocketGateway: WSGateway,
  ) {}

  async getAllMain(
    data: SortCommentsDto,
  ): Promise<PaginatedResult<CommentEntity>> {
    type sortKey = 'userName' | 'email' | 'createdAt';

    const sortFieldMap: Record<sortKey, string> = {
      userName: 'user.userName',
      email: 'user.email',
      createdAt: 'comment.createdAt',
    };

    try {
      const { sortBy, sortOrder, page } = data;
      const validSortField = sortFieldMap[sortBy] || 'comment.createdAt';
      const pageNumber = page || 1;
      const take = 25;
      const skip = (pageNumber - 1) * take;
      const [allComments, total] = await this.commentRepository
        .createQueryBuilder('comment')
        .leftJoinAndSelect('comment.childComments', 'child')
        .leftJoinAndSelect('comment.file', 'file')
        .leftJoin('comment.user', 'user')
        .addSelect(['user.userName', 'user.email', 'user.picture'])
        .where('comment.parentComment IS NULL')
        .orderBy(validSortField, sortOrder || 'DESC')
        .skip(skip)
        .take(take)
        .getManyAndCount();

      return {
        data: allComments,
        total,
        page: pageNumber,
        totalPages: Math.ceil(total / take),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve main comments',
      );
    }
  }

  async getByUuid(uuid: string): Promise<CommentEntity> {
    try {
      return await this.commentRepository.findOne({
        where: { uuid },
        relations: ['childComments'],
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve comment by uuid',
      );
    }
  }

  async createComment(
    data: CreateCommentDto,
    userUuid: string,
  ): Promise<CommentEntity> {
    try {
      const { parentCommentUuid, userName, email, ...otherData } = data;

      const user = await this.userService.validateUserCredentials(
        userName,
        email,
        userUuid,
      );

      let parentComment = null;

      if (parentCommentUuid) {
        parentComment = await this.getByUuid(parentCommentUuid);
      }

      const comment = this.commentRepository.create({
        ...otherData,
        parentComment,
        user,
      });

      await this.commentRepository.save(comment);

      this.webSocketGateway.emitEventToClients(`comments`, comment);

      return comment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create comment');
    }
  }
}
