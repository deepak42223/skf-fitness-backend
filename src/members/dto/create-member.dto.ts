import {
  IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, Matches,
} from 'class-validator';

export enum MembershipPlan {
  BASIC = 'basic',
  PRO   = 'pro',
  ELITE = 'elite',
}

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @Matches(/^[0-9+\-\s]{7,15}$/, { message: 'Invalid phone number format' })
  phone: string;

  @IsEnum(MembershipPlan, { message: 'Plan must be basic, pro, or elite' })
  membershipPlan: MembershipPlan;
}
