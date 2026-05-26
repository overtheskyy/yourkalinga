import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(JwtAuthGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get('me/profile')
  getMyProfile(@CurrentUser() user: any) {
    return this.patientsService.findByUserId(user.id);
  }

  @Patch('me/profile')
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(user.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('DOCTOR')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientsService.findById(id);
  }
}
