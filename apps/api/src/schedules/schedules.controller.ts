import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { UpsertScheduleDto } from './dto/manage-schedule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('my')
  getMySchedules(@CurrentUser() user: any) {
    return this.schedulesService.getMySchedules(user.id);
  }

  @Post()
  upsertSchedule(@CurrentUser() user: any, @Body() dto: UpsertScheduleDto) {
    return this.schedulesService.upsertSchedule(user.id, dto);
  }
}
