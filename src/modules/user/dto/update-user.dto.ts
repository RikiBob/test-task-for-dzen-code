import { IsAlphanumeric, IsEmail, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsAlphanumeric()
  userName?: string;

  @IsOptional()
  @IsString()
  password?: string;
}
