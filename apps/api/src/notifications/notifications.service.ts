import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateNotificationDto {
  userId: string;
  appointmentId?: string;
  title: string;
  body: string;
  type: string;
}

@Injectable()
export class NotificationsService {
  private gateway: any;

  constructor(private prisma: PrismaService) {}

  setGateway(gateway: any) {
    this.gateway = gateway;
  }

  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        appointmentId: dto.appointmentId,
        title: dto.title,
        body: dto.body,
        type: dto.type,
      },
    });

    if (this.gateway) {
      this.gateway.sendToUser(dto.userId, notification);
    }

    return notification;
  }

  async findByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }
}
