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

  @Column({ nullable: true, name: 'home_page' })
  homePage: string;

  @Column()
  text: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => CommentEntity, (comment) => comment.childComments, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_comment' })
  parentComment: CommentEntity | null;

  @OneToMany(() => CommentEntity, (comment) => comment.parentComment)
  @JoinColumn({ name: 'children_comment' })
  childComments: CommentEntity[];

  @ManyToOne(() => UserEntity, (user) => user.comments)
  @JoinColumn({ name: 'user_uuid' })
  user: UserEntity;

  @OneToOne(() => FileEntity, (file) => file.comment, { nullable: true })
  @JoinColumn({ name: 'file_uuid' })
  file: FileEntity | null;
}
