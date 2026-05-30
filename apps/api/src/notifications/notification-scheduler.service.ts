import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  @Cron('*/15 * * * *')
  async sendUpcomingReminders() {
    const now = new Date();
    const in60 = new Date(now.getTime() + 60 * 60 * 1000);

    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setUTCHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        date: { gte: todayStart, lte: todayEnd },
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    for (const appt of appointments) {
      const [h, m] = appt.startTime.split(':').map(Number);
      const apptTime = new Date(appt.date);
      apptTime.setHours(h, m, 0, 0);

      if (apptTime <= now || apptTime > in60) continue;

      const alreadySent = await this.prisma.notification.count({
        where: { appointmentId: appt.id, type: 'APPOINTMENT_UPCOMING' },
      });
      if (alreadySent > 0) continue;

      const timeStr = appt.startTime;

      await this.notifications.create({
        userId: appt.patient.user.id,
        appointmentId: appt.id,
        title: 'Upcoming Appointment',
        body: `Your appointment with Dr. ${appt.doctor.lastName} starts at ${timeStr} today.`,
        type: 'APPOINTMENT_UPCOMING',
      });

      await this.notifications.create({
        userId: appt.doctor.user.id,
        appointmentId: appt.id,
        title: 'Upcoming Appointment',
        body: `You have an appointment with ${appt.patient.firstName} ${appt.patient.lastName} at ${timeStr} today.`,
        type: 'APPOINTMENT_UPCOMING',
      });

      this.logger.log(`Sent upcoming reminder for appointment ${appt.id}`);
    }
  }
}
