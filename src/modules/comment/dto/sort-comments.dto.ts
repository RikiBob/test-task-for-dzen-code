import { IsIn, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SortCommentsDto {
  @ApiPropertyOptional({
    example: 'createdAt',
    description:
      'Field to sort by. Possible values: userName, email, createdAt.',
    enum: ['userName', 'email', 'createdAt'],
  })
  @IsOptional()
  @IsIn(['userName', 'email', 'createdAt'])
  sortBy?: string;

  @ApiPropertyOptional({
    example: 'DESC',
    description: 'Sort order direction.',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination. Must be positive integer.',
    default: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  page?: number = 1;
}
