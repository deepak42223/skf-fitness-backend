import {
  IsString, IsNotEmpty, IsDateString, IsNumber, Min, IsOptional, Matches,
} from 'class-validator';

export class CreateTrainerBookingDto {
  @IsString()
  @IsNotEmpty()
  trainerId: string;

  @IsString()
  @IsNotEmpty()
  trainerName: string;

  @IsDateString()
  date: string; // YYYY-MM-DD

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @IsNumber()
  @Min(30)
  duration: number; // minutes

  @IsNumber()
  @Min(0)
  hourlyRate: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
