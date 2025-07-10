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
import { UserEntity } from './user.entity';
import { FileEntity } from './file.entity';

@Entity('comment')
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column()
  homePage: string;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => CommentEntity, (comment) => comment.childComments, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parentComment: CommentEntity | null;

  @OneToMany(() => CommentEntity, (comment) => comment.parentComment)
  childComments: CommentEntity[];

  @ManyToOne(() => UserEntity, (user) => user.comments)
  @JoinColumn({ name: 'user_uuid' })
  user: UserEntity;

  @OneToOne(() => FileEntity, (file) => file.comment, { nullable: true })
  @JoinColumn({ name: 'file_uuid' })
  file: FileEntity | null;
}
