import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(user.id, dto);
  }

  @Get('patient')
  getPatientAppointments(@CurrentUser() user: any) {
    return this.appointmentsService.findPatientAppointments(user.id);
  }

  @Get('doctor')
  getDoctorAppointments(@CurrentUser() user: any) {
    return this.appointmentsService.findDoctorAppointments(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(id, user.id, dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.appointmentsService.cancel(id, user.id);
  }
}
