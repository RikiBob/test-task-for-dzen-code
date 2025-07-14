import {
  IsAlphanumeric,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    example: 'UserName',
    description:
      'Username of the commenter. Only alphanumeric characters allowed.',
  })
  @IsNotEmpty()
  @IsString()
  @IsAlphanumeric()
  userName: string;

  @ApiProperty({
    example: 'email@example.com',
    description: 'Email of the commenter.',
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    example: 'https://example.com',
    description: 'Optional personal homepage URL of the commenter.',
  })
  @Transform(({ value }) => (value === '' ? undefined : String(value)))
  @IsString()
  @IsOptional()
  @IsUrl()
  homePage?: string;

  @ApiProperty({
    example: 'This is your comment!',
    description: 'The text content of the comment.',
  })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Optional UUID of the parent comment if this is a reply.',
    nullable: true,
  })
  @Transform(({ value }) => (value === '' ? null : String(value)))
  @IsOptional()
  @IsUUID()
  parentCommentUuid: string | null = null;
}
