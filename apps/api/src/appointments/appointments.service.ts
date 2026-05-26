import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateAppointmentDto) {
    const patient = await this.prisma.patientProfile.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException('Patient profile not found');

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorId },
      include: { user: true },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const date = new Date(dto.date);

    const conflict = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        date,
        startTime: dto.startTime,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });
    if (conflict) throw new BadRequestException('Time slot already booked');

    const jitsiRoomId = `yourkalinga-${uuidv4().slice(0, 8)}`;

    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: dto.doctorId,
        date,
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason,
        status: 'CONFIRMED',
        jitsiRoomId,
      },
      include: {
        patient: true,
        doctor: { include: { user: { select: { id: true, email: true } } } },
      },
    });

    // Notify both parties
    await this.notifications.create({
      userId,
      appointmentId: appointment.id,
      title: 'Appointment Confirmed',
      body: `Your appointment with Dr. ${doctor.lastName} on ${dto.date} at ${dto.startTime} is confirmed.`,
      type: 'BOOKING_CONFIRMED',
    });

    await this.notifications.create({
      userId: doctor.user.id,
      appointmentId: appointment.id,
      title: 'New Appointment',
      body: `${patient.firstName} ${patient.lastName} booked an appointment for ${dto.date} at ${dto.startTime}.`,
      type: 'NEW_BOOKING',
    });

    return appointment;
  }

  async findPatientAppointments(userId: string) {
    const patient = await this.prisma.patientProfile.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException('Patient not found');

    return this.prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: true,
        consultation: { include: { notes: true, prescriptions: true } },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    });
  }

  async findDoctorAppointments(userId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    return this.prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: {
        patient: true,
        consultation: { include: { notes: true, prescriptions: true } },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    });
  }

  async findOne(id: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: { select: { email: true } } } },
        doctor: { include: { user: { select: { email: true, id: true } } } },
        consultation: {
          include: { notes: true, prescriptions: true },
        },
      },
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    return appt;
  }

  async reschedule(id: string, userId: string, dto: UpdateAppointmentDto) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });
    if (!appt) throw new NotFoundException('Appointment not found');

    if (appt.patient.user.id !== userId && appt.doctor.user.id !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        date: dto.date ? new Date(dto.date) : undefined,
        startTime: dto.startTime,
        endTime: dto.endTime,
        status: 'CONFIRMED',
      },
    });

    // Notify both parties
    const otherUserId =
      appt.patient.user.id === userId ? appt.doctor.user.id : appt.patient.user.id;
    await this.notifications.create({
      userId: otherUserId,
      appointmentId: id,
      title: 'Appointment Rescheduled',
      body: `Your appointment has been rescheduled to ${dto.date} at ${dto.startTime}.`,
      type: 'RESCHEDULED',
    });

    return updated;
  }

  async cancel(id: string, userId: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });
    if (!appt) throw new NotFoundException('Appointment not found');

    if (appt.patient.user.id !== userId && appt.doctor.user.id !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    const otherUserId =
      appt.patient.user.id === userId ? appt.doctor.user.id : appt.patient.user.id;
    await this.notifications.create({
      userId: otherUserId,
      appointmentId: id,
      title: 'Appointment Cancelled',
      body: `An appointment scheduled for ${appt.date.toDateString()} at ${appt.startTime} was cancelled.`,
      type: 'CANCELLED',
    });

    return updated;
  }
}
