import {
  IsString, IsNotEmpty, IsDateString,
} from 'class-validator';

export class CreateClassBookingDto {
  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  className: string;

  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  timeSlot: string;
}
