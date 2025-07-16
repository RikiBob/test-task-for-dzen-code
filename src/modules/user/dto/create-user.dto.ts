import { IsNotEmpty, IsAlphanumeric, IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({
    example: 'UserName',
    description: 'Username of the user. Only alphanumeric characters allowed.',
  })
  @IsNotEmpty()
  @IsString()
  @IsAlphanumeric()
  userName: string;

  @ApiProperty({
    example: 'email@example.com',
    description: 'Email address of the user.',
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @ApiProperty({
    example: 'password',
    description: 'Password for the user account.',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
