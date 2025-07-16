import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';

import { CommentEntity } from '../../orm/entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SortCommentsDto } from './dto/sort-comments.dto';
import { WSGateway } from '../../ws/ws.gateway';
import { UserEntity } from '../../orm/entities/user.entity';

export type PaginatedResult<T> = {
  data: T[];
  count: number;
  page: number;
  totalPages: number;
};

type RenameParentComment<T> = {
  [K in keyof T as K extends 'parentComment' ? 'parent_comment' : K]: T[K];
};

type RawComment = RenameParentComment<CommentEntity>;

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly webSocketGateway: WSGateway,
  ) {}

  private buildCommentTree(flatComments: RawComment[]): CommentEntity[] {
    const map = new Map();
    const roots = [];

    flatComments.forEach((comment) => {
      comment.childComments = [];
      map.set(comment.uuid, comment);
    });

    flatComments.forEach((comment) => {
      if (comment.parent_comment) {
        const parent = map.get(comment.parent_comment);
        if (parent) {
          parent.childComments.push(comment);
        } else {
          roots.push(comment);
        }
      } else {
        roots.push(comment);
      }
    });

    return roots;
  }

  private async readSql(fileName: string): Promise<string> {
    const basePath = join(__dirname, '..', '..', 'orm', 'sql');

    const fullPath = join(basePath, fileName);
    return fs.readFile(fullPath, 'utf-8');
  }

  async getAllMain(
    data: SortCommentsDto,
  ): Promise<PaginatedResult<CommentEntity>> {
    type sortKey = 'userName' | 'email' | 'createdAt';

    const sortFieldMap: Record<sortKey, string> = {
      userName: 'user_name',
      email: 'email',
      createdAt: 'created_at',
    };

    try {
      const { sortBy, sortOrder, page } = data;
      const validSortField = sortFieldMap[sortBy] || 'created_at';
      const validSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
      const pageNumber = page || 1;
      const take = 25;
      const skip = (pageNumber - 1) * take;
      let sql = await this.readSql('getMainComments.sql');

      sql = sql
        .replace('__SORT_FIELD__', validSortField)
        .replace('__SORT_ORDER__', validSortOrder);

      const allComments = await this.commentRepository.query(sql, [take, skip]);
      const [{ count }] = await this.commentRepository.query(
        'SELECT COUNT(*) FROM comment WHERE parent_comment IS NULL',
      );

      const treeComments = this.buildCommentTree(allComments);

      return {
        data: treeComments,
        count,
        page: pageNumber,
        totalPages: Math.ceil(count / take),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve main comments',
      );
    }
  }

  async getByUuid(uuid: string): Promise<CommentEntity> {
    try {
      const sql = await this.readSql('getCommentByUuid.sql');
      const comment = await this.commentRepository.query(sql, [uuid]);

      return this.buildCommentTree(comment)[0];
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve comment by uuid',
      );
    }
  }

  private async checkAndGetUserExistsByEmail(
    email: string,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new BadRequestException(`User with email ${email} no exists`);
    }

    return user;
  }

  private async validateUserCredentials(
    userName: string,
    email: string,
    userUuid: string,
  ): Promise<UserEntity> {
    const user = await this.checkAndGetUserExistsByEmail(email);

    if (userName !== user.userName || userUuid !== user.uuid) {
      throw new BadRequestException(
        `Username ${userName} does not match the user registered with email ${email}`,
      );
    }

    return user;
  }

  async createComment(
    data: CreateCommentDto,
    userUuid: string,
  ): Promise<CommentEntity> {
    try {
      const { parentCommentUuid, userName, email, ...otherData } = data;

      const user = await this.validateUserCredentials(
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
