import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertScheduleDto, BlockSlotDto } from './dto/manage-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async upsertSchedule(userId: string, dto: UpsertScheduleDto) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');

    return this.prisma.doctorSchedule.upsert({
      where: {
        doctorId_dayOfWeek: { doctorId: doctor.id, dayOfWeek: dto.dayOfWeek },
      },
      update: {
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDuration: dto.slotDuration,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      create: {
        doctorId: doctor.id,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDuration: dto.slotDuration || 30,
        isActive: true,
      },
    });
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

    const schedule = await this.prisma.doctorSchedule.findUnique({
      where: { id: dto.scheduleId },
    });
    if (!schedule || schedule.doctorId !== doctor.id) {
      throw new ForbiddenException('Not your schedule');
    }

    return this.prisma.blockedSlot.create({
      data: {
        scheduleId: dto.scheduleId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
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
