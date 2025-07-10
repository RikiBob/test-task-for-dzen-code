import {
  IsNotEmpty,
  IsAlphanumeric,
  IsEmail,
  IsUrl,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsAlphanumeric()
  userName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsAlphanumeric()
  password: string;

  @IsOptional()
  @IsUrl()
  picture?: string;
}
