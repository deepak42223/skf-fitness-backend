import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class ProgressDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsNumber()
  weight_kg?: number;

  @IsOptional()
  @IsNumber()
  body_fat?: number;

  @IsOptional()
  @IsNumber()
  muscle_mass?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
