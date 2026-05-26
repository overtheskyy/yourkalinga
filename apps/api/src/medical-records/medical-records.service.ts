import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MedicalRecordsService {
  constructor(private prisma: PrismaService) {}

  async getPatientRecords(userId: string) {
    const patient = await this.prisma.patientProfile.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException('Patient not found');

    return this.prisma.medicalRecord.findMany({
      where: { patientId: patient.id },
      include: {
        session: {
          include: {
            notes: true,
            prescriptions: true,
            doctor: { select: { firstName: true, lastName: true, specialization: true, avatarUrl: true } },
            appointment: { select: { date: true, startTime: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDoctorPatientRecords(doctorUserId: string, patientId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { userId: doctorUserId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const hadAppointment = await this.prisma.appointment.findFirst({
      where: { doctorId: doctor.id, patientId },
    });
    if (!hadAppointment) throw new ForbiddenException('No appointment history with this patient');

    return this.prisma.medicalRecord.findMany({
      where: { patientId },
      include: {
        session: {
          include: {
            notes: true,
            prescriptions: true,
            doctor: { select: { firstName: true, lastName: true, specialization: true } },
            appointment: { select: { date: true, startTime: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAppointmentHistory(userId: string, role: string) {
    if (role === 'PATIENT') {
      const patient = await this.prisma.patientProfile.findUnique({ where: { userId } });
      if (!patient) throw new NotFoundException('Not found');
      return this.prisma.appointment.findMany({
        where: { patientId: patient.id },
        include: {
          doctor: { select: { firstName: true, lastName: true, specialization: true, avatarUrl: true } },
          consultation: { include: { notes: true, prescriptions: true } },
        },
        orderBy: [{ date: 'desc' }],
      });
    } else {
      const doctor = await this.prisma.doctorProfile.findUnique({ where: { userId } });
      if (!doctor) throw new NotFoundException('Not found');
      return this.prisma.appointment.findMany({
        where: { doctorId: doctor.id },
        include: {
          patient: { select: { firstName: true, lastName: true, avatarUrl: true } },
          consultation: { include: { notes: true, prescriptions: true } },
        },
        orderBy: [{ date: 'desc' }],
      });
    }
  }
}
