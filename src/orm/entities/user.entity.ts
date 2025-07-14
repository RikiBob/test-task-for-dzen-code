import * as bcrypt from 'bcrypt';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { CommentEntity } from './comment.entity';

@Entity('user')
export class UserEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the user',
  })
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @ApiProperty({
    example: 'UserName',
    description: 'Username of the user',
  })
  @Column({ name: 'user_name' })
  userName: string;

  @ApiProperty({
    example: 'email@example.com',
    description: 'Email address of the user',
  })
  @Column()
  email: string;

  @ApiProperty({
    example: '$2b$10$DyDZCoUvsfilIO4F8szpKe9s7BIYL2/jl1fsrBpp2.AsDh4URdOdS',
    description: 'Hashed password of the user',
  })
  @Column()
  password: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'Profile picture URL',
    nullable: true,
  })
  @Column({ nullable: true })
  picture: string | null;

  @ApiProperty({
    example: '2025-07-14T10:46:36.720Z',
    description: 'Date when the user was created',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    example: '2025-07-14T12:00:00.000Z',
    description: 'Date when the user was last updated',
  })
  @UpdateDateColumn({ name: 'update_at' })
  updatedAt: Date;

  @ApiProperty({
    type: () => [CommentEntity],
    description: 'List of comments created by the user',
  })
  @OneToMany(() => CommentEntity, (comment) => comment.user)
  comments: CommentEntity[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async comparePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }
}
