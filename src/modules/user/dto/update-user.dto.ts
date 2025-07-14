import { IsAlphanumeric, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'NewUserName',
    description:
      'New username for the user. Only alphanumeric characters allowed.',
  })
  @IsOptional()
  @IsString()
  @IsAlphanumeric()
  userName?: string;

  @ApiPropertyOptional({
    example: 'newPassword',
    description: 'New password for the user.',
  })
  @IsOptional()
  @IsString()
  password?: string;
}
