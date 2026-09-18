import {
  IsOptional, IsString, IsNumber, IsEnum, Min, Max, Matches,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-\s]{7,15}$/, { message: 'Invalid phone number format' })
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
  @Min(50) @Max(300)
  height_cm?: number;

  @IsOptional()
  @IsNumber()
  @Min(20) @Max(500)
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
  @Matches(/^[0-9+\-\s]{7,15}$/, { message: 'Invalid emergency phone format' })
  emergency_phone?: string;
}
