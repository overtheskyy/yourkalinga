import { IsString, IsOptional, IsNumber, IsArray, IsBoolean } from 'class-validator';

export class UpdateDoctorDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() specialization?: string;
  @IsOptional() @IsString() licenseNumber?: string;
  @IsOptional() @IsNumber() yearsExperience?: number;
  @IsOptional() @IsArray() languages?: string[];
  @IsOptional() @IsNumber() consultationFee?: number;
  @IsOptional() @IsString() avatarUrl?: string;
}
