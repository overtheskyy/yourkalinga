import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class UpdatePatientDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsDateString() birthday?: string;
  @IsOptional() @IsNumber() weight?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsString() contactNumber?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() bloodType?: string;
  @IsOptional() @IsString() allergies?: string;
  @IsOptional() @IsString() medications?: string;
  @IsOptional() @IsString() medicalHistory?: string;
}
