import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'registration', enum: ['registration', 'email_change'] })
  @IsEnum(['registration', 'email_change'])
  @IsOptional()
  purpose?: string = 'registration';
}
