import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class UpsertScheduleDto {
  @IsEnum(DayOfWeek) dayOfWeek: DayOfWeek;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
