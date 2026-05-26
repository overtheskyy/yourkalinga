import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @IsString() doctorId: string;
  @IsDateString() date: string;
  @IsString() startTime: string;
  @IsString() endTime: string;
  @IsOptional() @IsString() reason?: string;
}
