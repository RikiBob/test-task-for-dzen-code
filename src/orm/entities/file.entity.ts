import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { CommentEntity } from './comment.entity';

@Entity('file')
export class FileEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the file',
  })
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @ApiProperty({
    example: 'profile-picture.jpg',
    description: 'Original name of the uploaded file',
  })
  @Column({ name: 'original_name' })
  originalName: string;

  @ApiProperty({
    example: 'image/jpeg',
    description: 'MIME type of the file',
  })
  @Column()
  type: string;

  @ApiProperty({
    example: 204800,
    description: 'Size of the file in bytes',
  })
  @Column()
  size: number;

  @ApiProperty({
    example: '28828aef-f06a-49e8-9c71-a1f351b3ee98-image/jpeg',
    description: 'S3 key or internal storage key of the file',
  })
  @Column()
  key: string;

  @ApiProperty({
    example:
      'https://example-bucket.s3.amazonaws.com/28828aef-f06a-49e8-9c71-a1f351b3ee98-image/jpeg',
    description: 'Public URL of the file',
  })
  @Column()
  url: string;

  @ApiProperty({
    example: '2025-07-14T10:46:36.720Z',
    description: 'Date when the file was uploaded',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    type: () => CommentEntity,
    description: 'Comment associated with this file',
  })
  @OneToOne(() => CommentEntity, (comment) => comment.file)
  comment: CommentEntity;
}
