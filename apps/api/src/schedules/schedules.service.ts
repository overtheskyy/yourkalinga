import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UpsertScheduleDto, BlockSlotDto } from './dto/manage-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async upsertSchedule(userId: string, dto: UpsertScheduleDto) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');

    const schedule = await this.prisma.doctorSchedule.upsert({
      where: {
        doctorId_dayOfWeek: { doctorId: doctor.id, dayOfWeek: dto.dayOfWeek },
      },
      update: {
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      create: {
        doctorId: doctor.id,
        dayOfWeek: dto.dayOfWeek,
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    // If day is deactivated, notify patients with upcoming appointments on that day
    if (dto.isActive === false) {
      const dayIndex = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'].indexOf(dto.dayOfWeek);
      const jsDay = dayIndex === 6 ? 0 : dayIndex + 1;

      const affected = await this.prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          status: { in: ['PENDING', 'CONFIRMED'] },
          date: { gte: new Date() },
        },
        include: { patient: { include: { user: true } } },
      });

      const impacted = affected.filter((a) => new Date(a.date).getDay() === jsDay);

      for (const appt of impacted) {
        await this.prisma.appointment.update({
          where: { id: appt.id },
          data: { status: 'RESCHEDULED' },
        });

        await this.notifications.create({
          userId: appt.patient.user.id,
          appointmentId: appt.id,
          title: 'Doctor Availability Changed',
          body: `Dr. ${doctor.firstName} ${doctor.lastName} is no longer available on ${dto.dayOfWeek.charAt(0) + dto.dayOfWeek.slice(1).toLowerCase()}s. Please reschedule your appointment.`,
          type: 'APPOINTMENT_RESCHEDULED',
        });
      }
    }

    return schedule;
  }

  async getMySchedules(userId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');

    return this.prisma.doctorSchedule.findMany({
      where: { doctorId: doctor.id },
      include: { blockedSlots: { orderBy: { date: 'asc' } } },
    });
  }

  async blockSlot(userId: string, dto: BlockSlotDto) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const targetDate = new Date(dto.date);
    const dayNames = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY', 'SUNDAY'];
    const dayOfWeek = dayNames[targetDate.getUTCDay()];

    const schedule = await this.prisma.doctorSchedule.findUnique({
      where: { doctorId_dayOfWeek: { doctorId: doctor.id, dayOfWeek: dayOfWeek as any } },
    });
    if (!schedule) {
      throw new NotFoundException(`No schedule found for ${dayOfWeek}. Enable this day in your weekly schedule first.`);
    }

    return this.prisma.blockedSlot.create({
      data: {
        scheduleId: schedule.id,
        date: targetDate,
        reason: dto.reason,
      },
    });
  }

  async unblockSlot(slotId: string, userId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const slot = await this.prisma.blockedSlot.findUnique({
      where: { id: slotId },
      include: { schedule: true },
    });

    if (!slot || slot.schedule.doctorId !== doctor.id) {
      throw new ForbiddenException('Not authorized');
    }

    return this.prisma.blockedSlot.delete({ where: { id: slotId } });
  }
}
