import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export enum RegisterRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(RegisterRole)
  role: RegisterRole;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}
