import { IsString, MinLength, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Length(64, 64)
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
