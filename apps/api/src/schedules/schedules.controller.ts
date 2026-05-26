import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { UpsertScheduleDto, BlockSlotDto } from './dto/manage-schedule.dto';
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

  @Post('block')
  blockSlot(@CurrentUser() user: any, @Body() dto: BlockSlotDto) {
    return this.schedulesService.blockSlot(user.id, dto);
  }

  @Delete('block/:slotId')
  unblockSlot(@Param('slotId') slotId: string, @CurrentUser() user: any) {
    return this.schedulesService.unblockSlot(slotId, user.id);
  }
}
