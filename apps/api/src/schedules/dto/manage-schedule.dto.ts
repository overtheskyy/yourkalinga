import { IsEnum, IsOptional, IsBoolean, IsString, IsDateString } from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class UpsertScheduleDto {
  @IsEnum(DayOfWeek) dayOfWeek: DayOfWeek;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class BlockSlotDto {
  @IsDateString() date: string;
  @IsOptional() @IsString() reason?: string;
}
