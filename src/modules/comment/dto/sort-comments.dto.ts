import { IsIn, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class SortCommentsDto {
  @IsOptional()
  @IsIn(['userName', 'email', 'createdAt'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  page?: number = 1;
}
