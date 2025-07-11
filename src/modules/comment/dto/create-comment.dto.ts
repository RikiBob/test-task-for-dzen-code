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

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  @IsAlphanumeric()
  userName: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @Transform(({ value }) => (value === '' ? undefined : String(value)))
  @IsString()
  @IsOptional()
  @IsUrl()
  homePage?: string;

  @IsNotEmpty()
  @IsString()
  text: string;

  @Transform(({ value }) => (value === '' ? null : String(value)))
  @IsOptional()
  @IsUUID()
  parentCommentUuid: string | null = null;
}
