import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  @Min(10) @Max(100)
  age?: number;

  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  gender?: string;

  @IsOptional()
  @IsNumber()
  height_cm?: number;

  @IsOptional()
  @IsNumber()
  weight_kg?: number;

  @IsOptional()
  @IsEnum(['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general_fitness'])
  fitness_goal?: string;

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  experience?: string;

  @IsOptional()
  @IsString()
  health_notes?: string;

  @IsOptional()
  @IsString()
  emergency_contact?: string;

  @IsOptional()
  @IsString()
  emergency_phone?: string;
}
