import { IsNumber, Min, IsEnum, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsEnum(['membership', 'class', 'trainer'])
  purpose: 'membership' | 'class' | 'trainer';

  @IsString()
  @IsOptional()
  notes?: string;

  @IsObject()
  @IsOptional()
  metadata?: any;
}
