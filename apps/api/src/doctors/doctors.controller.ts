import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Public } from '../auth/public.decorator';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Public()
  @Get()
  findAll(@Query('search') search?: string, @Query('specialization') specialization?: string) {
    return this.doctorsService.findAll(search, specialization);
  }

  @Public()
  @Get('specializations')
  getSpecializations() {
    return this.doctorsService.getSpecializations();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Public()
  @Get(':id/slots')
  getSlots(@Param('id') id: string, @Query('date') date: string) {
    return this.doctorsService.getAvailableSlots(id, date);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  getMyProfile(@CurrentUser() user: any) {
    return this.doctorsService.findByUserId(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(user.id, dto);
  }
}
