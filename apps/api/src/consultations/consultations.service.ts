import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultationNoteDto } from './dto/create-note.dto';

@Injectable()
export class ConsultationsService {
  constructor(private prisma: PrismaService) {}

  async startSession(appointmentId: string, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    if (!appointment) throw new NotFoundException('Appointment not found');

    if (
      appointment.patient.user.id !== userId &&
      appointment.doctor.user.id !== userId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    let session = await this.prisma.consultationSession.findUnique({
      where: { appointmentId },
    });

    if (!session) {
      session = await this.prisma.consultationSession.create({
        data: {
          appointmentId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          jitsiRoomId: appointment.jitsiRoomId || `yourkalinga-${appointmentId.slice(0, 8)}`,
          startedAt: new Date(),
        },
      });

      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CONFIRMED' },
      });
    }

    return session;
  }

  async endSession(sessionId: string, userId: string) {
    const session = await this.prisma.consultationSession.findUnique({
      where: { id: sessionId },
      include: {
        doctor: { include: { user: true } },
        appointment: true,
      },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.doctor.user.id !== userId) throw new ForbiddenException('Not authorized');

    const updated = await this.prisma.consultationSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });

    await this.prisma.appointment.update({
      where: { id: session.appointmentId },
      data: { status: 'COMPLETED' },
    });

    return updated;
  }

  async addNote(appointmentId: string, userId: string, dto: CreateConsultationNoteDto) {
    const session = await this.prisma.consultationSession.findUnique({
      where: { appointmentId },
      include: { doctor: { include: { user: true } } },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.doctor.user.id !== userId) throw new ForbiddenException('Only doctor can add notes');

    const note = await this.prisma.consultationNote.create({
      data: {
        sessionId: session.id,
        chiefComplaint: dto.chiefComplaint,
        diagnosis: dto.diagnosis,
        findings: dto.findings,
        recommendations: dto.recommendations,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
      },
    });

    if (dto.prescriptions && dto.prescriptions.length > 0) {
      await this.prisma.prescription.createMany({
        data: dto.prescriptions.map((p) => ({
          sessionId: session.id,
          ...p,
        })),
      });
    }

    // Create medical record
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true },
    });

    await this.prisma.medicalRecord.upsert({
      where: { sessionId: session.id },
      update: { description: dto.diagnosis || dto.findings },
      create: {
        patientId: session.patientId,
        sessionId: session.id,
        title: `Consultation — Dr. ${session.doctor.lastName} (${new Date().toLocaleDateString()})`,
        description: dto.diagnosis || dto.findings,
        recordType: 'CONSULTATION',
      },
    });

    return note;
  }

  async getSession(appointmentId: string) {
    const session = await this.prisma.consultationSession.findUnique({
      where: { appointmentId },
      include: {
        notes: true,
        prescriptions: true,
        patient: true,
        doctor: true,
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }
}
