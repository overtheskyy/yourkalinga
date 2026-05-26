import { IsEnum, IsString, IsOptional, IsBoolean, IsNumber, IsDateString } from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class UpsertScheduleDto {
  @IsEnum(DayOfWeek) dayOfWeek: DayOfWeek;
  @IsString() startTime: string;
  @IsString() endTime: string;
  @IsOptional() @IsNumber() slotDuration?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class BlockSlotDto {
  @IsString() scheduleId: string;
  @IsDateString() date: string;
  @IsString() startTime: string;
  @IsString() endTime: string;
  @IsOptional() @IsString() reason?: string;
}
