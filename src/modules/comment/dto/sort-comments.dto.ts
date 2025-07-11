import { IsIn, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class SortCommentsDto {
  @IsIn(['userName', 'email', 'createdAt'])
  sortBy?: string;

  @IsIn(['ASC', 'DESC'])
  sortOrder?: string;

  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  page?: number = 1;
}
