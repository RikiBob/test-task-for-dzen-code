import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { UserEntity } from './user.entity';
import { FileEntity } from './file.entity';

@Entity('comment')
export class CommentEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the comment',
  })
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @ApiProperty({
    example: 'https://example.com',
    description: 'Home page URL of the commenter',
    nullable: true,
  })
  @Column({ nullable: true, name: 'home_page' })
  homePage: string;

  @ApiProperty({
    example: 'This is a comment',
    description: 'Text content of the comment',
  })
  @Column()
  text: string;

  @ApiProperty({
    example: '2025-07-14T10:46:36.720Z',
    description: 'Date when the comment was created',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    type: () => CommentEntity,
    description: 'Parent comment if this is a reply',
    nullable: true,
  })
  @ManyToOne(() => CommentEntity, (comment) => comment.childComments, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_comment' })
  parentComment: CommentEntity | null;

  @ApiProperty({
    type: () => [CommentEntity],
    description: 'List of child comments (replies)',
  })
  @OneToMany(() => CommentEntity, (comment) => comment.parentComment)
  @JoinColumn({ name: 'children_comment' })
  childComments: CommentEntity[];

  @ApiProperty({
    type: () => UserEntity,
    description: 'User who created the comment',
  })
  @ManyToOne(() => UserEntity, (user) => user.comments)
  @JoinColumn({ name: 'user_uuid' })
  user: UserEntity;

  @ApiProperty({
    type: () => FileEntity,
    description: 'Attached file (if any)',
    nullable: true,
  })
  @OneToOne(() => FileEntity, (file) => file.comment, { nullable: true })
  @JoinColumn({ name: 'file_uuid' })
  file: FileEntity | null;
}
