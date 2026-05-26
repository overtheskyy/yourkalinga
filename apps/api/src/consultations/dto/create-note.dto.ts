import { IsString, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PrescriptionDto {
  @IsString() medication: string;
  @IsString() dosage: string;
  @IsString() frequency: string;
  @IsString() duration: string;
  @IsOptional() @IsString() instructions?: string;
}

export class CreateConsultationNoteDto {
  @IsOptional() @IsString() chiefComplaint?: string;
  @IsOptional() @IsString() diagnosis?: string;
  @IsOptional() @IsString() findings?: string;
  @IsOptional() @IsString() recommendations?: string;
  @IsOptional() @IsDateString() followUpDate?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PrescriptionDto)
  prescriptions?: PrescriptionDto[];
}
