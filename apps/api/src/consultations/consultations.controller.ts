import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationNoteDto } from './dto/create-note.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Post(':appointmentId/start')
  startSession(@Param('appointmentId') id: string, @CurrentUser() user: any) {
    return this.consultationsService.startSession(id, user.id);
  }

  @Patch(':sessionId/end')
  endSession(@Param('sessionId') id: string, @CurrentUser() user: any) {
    return this.consultationsService.endSession(id, user.id);
  }

  @Post(':appointmentId/notes')
  addNote(
    @Param('appointmentId') id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateConsultationNoteDto,
  ) {
    return this.consultationsService.addNote(id, user.id, dto);
  }

  @Get(':appointmentId')
  getSession(@Param('appointmentId') id: string) {
    return this.consultationsService.getSession(id);
  }
}
