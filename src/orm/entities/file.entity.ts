import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CommentEntity } from './comment.entity';

@Entity('file')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column()
  type: string;

  @Column()
  size: number;

  @Column()
  key: string;

  @Column()
  url: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => CommentEntity, (comment) => comment.file)
  comment: CommentEntity;
}
