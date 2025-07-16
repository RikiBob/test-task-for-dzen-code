import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from "class-transformer";

export class LoginUserDto {
  @ApiProperty({ example: 'login', description: 'Login for authorization' })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @ApiProperty({
    example: 'password',
    description: 'Password for authorization',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
