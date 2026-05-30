import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, specialization?: string) {
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (specialization) {
      where.specialization = { contains: specialization, mode: 'insensitive' };
    }

    return this.prisma.doctorProfile.findMany({
      where,
      include: {
        user: { select: { email: true, id: true } },
        schedules: { where: { isActive: true } },
      },
      orderBy: { rating: 'desc' },
    });
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, id: true } },
        schedules: {
          where: { isActive: true },
          include: { blockedSlots: true },
        },
        reviews: {
          include: {
            patient: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async findByUserId(userId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, id: true } },
        schedules: { where: { isActive: true } },
      },
    });
    if (!doctor) throw new NotFoundException('Doctor profile not found');
    return doctor;
  }

  async update(userId: string, dto: UpdateDoctorDto) {
    const profile = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Doctor profile not found');

    return this.prisma.doctorProfile.update({
      where: { userId },
      data: dto,
    });
  }

  async getAvailableSlots(doctorId: string, date: string) {
    const targetDate = new Date(date);
    const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][
      targetDate.getUTCDay()
    ];

    const schedule = await this.prisma.doctorSchedule.findUnique({
      where: { doctorId_dayOfWeek: { doctorId, dayOfWeek: dayOfWeek as any } },
      include: { blockedSlots: { where: { date: targetDate } } },
    });

    if (!schedule || !schedule.isActive) return [];

    // Entire day is blocked
    if (schedule.blockedSlots.length > 0) return [];

    const slots = this.generateSlots(
      schedule.startTime,
      schedule.endTime,
      schedule.slotDuration,
    );

    const booked = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        date: targetDate,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { startTime: true },
    });

    const bookedTimes = new Set(booked.map((a) => a.startTime));
    const available = slots.filter((s) => !bookedTimes.has(s));

    const now = new Date();
    const isToday = targetDate.toDateString() === now.toDateString();
    if (isToday) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      return available.filter((s) => {
        const [h, m] = s.split(':').map(Number);
        return h * 60 + m > currentMinutes;
      });
    }

    return available;
  }

  private generateSlots(start: string, end: string, duration: number): string[] {
    const slots: string[] = [];
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let current = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    while (current + duration <= endMin) {
      const h = Math.floor(current / 60).toString().padStart(2, '0');
      const m = (current % 60).toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
      current += duration;
    }
    return slots;
  }

  async getSpecializations() {
    const docs = await this.prisma.doctorProfile.findMany({
      select: { specialization: true },
      distinct: ['specialization'],
      orderBy: { specialization: 'asc' },
    });
    return docs.map((d) => d.specialization);
  }
}
