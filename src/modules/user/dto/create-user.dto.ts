import {
  IsNotEmpty,
  IsAlphanumeric,
  IsEmail,
  IsUrl,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @IsAlphanumeric()
  userName: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsUrl()
  picture?: string;
}
