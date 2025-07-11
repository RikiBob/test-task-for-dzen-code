import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
    const { sortBy, sortOrder, page } = data;
    const pageNumber = page || 1;
    const take = 25;
    const skip = (pageNumber - 1) * take;
    const [allComments, total] = await this.commentRepository.findAndCount({
      relations: ['parentComment'],
      skip,
      take,
      order: { [sortBy || 'createdAt']: sortOrder || 'DESC' },
    });

    return {
      data: allComments,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / take),
    };
  }

  async getByUuid(uuid: string): Promise<CommentEntity> {
    return await this.commentRepository.findOne({
      where: { uuid },
      relations: ['childComments'],
    });
  }

  async createComment(data: CreateCommentDto): Promise<CommentEntity> {
    try {
      const { parentCommentUuid, userName, email, ...otherData } = data;

      await this.userService.checkUserExistsByUserName(userName);
      await this.userService.checkUserExistsByEmail(email);

      let parentComment = null;

      if (parentCommentUuid) {
        parentComment = await this.getByUuid(parentCommentUuid);
      }

      const comment = this.commentRepository.create({
        ...otherData,
        parentComment,
      });

      await this.commentRepository.save(comment);

      this.webSocketGateway.emitEventToClients(`comments`, comment);

      return comment;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create comment');
    }
  }
}
