import { IsNumber, IsString, IsEnum, IsOptional, IsObject, Min } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsEnum(['membership', 'class', 'trainer', 'other'])
  purpose: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
