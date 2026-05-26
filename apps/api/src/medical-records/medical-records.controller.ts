import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Get('my-records')
  getMyRecords(@CurrentUser() user: any) {
    return this.medicalRecordsService.getPatientRecords(user.id);
  }

  @Get('history')
  getHistory(@CurrentUser() user: any) {
    return this.medicalRecordsService.getAppointmentHistory(user.id, user.role);
  }

  @Get('patient/:patientId')
  getDoctorView(@CurrentUser() user: any, @Param('patientId') patientId: string) {
    return this.medicalRecordsService.getDoctorPatientRecords(user.id, patientId);
  }
}
