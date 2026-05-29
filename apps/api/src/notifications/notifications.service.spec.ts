import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ───────────────────────────────────────────────────────────────────

  describe('create — persist and push notification', () => {
    const dto = {
      userId: 'user-1',
      appointmentId: 'appt-1',
      title: 'Appointment Confirmed',
      body: 'Your appointment is confirmed.',
      type: 'BOOKING_CONFIRMED',
    };

    it('persists the notification to the database', async () => {
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1', ...dto });

      await service.create(dto);

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: dto.userId,
          appointmentId: dto.appointmentId,
          title: dto.title,
          body: dto.body,
          type: dto.type,
        },
      });
    });

    it('pushes the notification to the user socket when gateway is set', async () => {
      const mockNotif = { id: 'notif-1', ...dto };
      mockPrisma.notification.create.mockResolvedValue(mockNotif);

      const mockGateway = { sendToUser: jest.fn() };
      service.setGateway(mockGateway);

      await service.create(dto);

      expect(mockGateway.sendToUser).toHaveBeenCalledWith(dto.userId, mockNotif);
    });

    it('does not throw if no gateway is set', async () => {
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1', ...dto });
      await expect(service.create(dto)).resolves.not.toThrow();
    });

    it('returns the created notification', async () => {
      const mockNotif = { id: 'notif-1', ...dto };
      mockPrisma.notification.create.mockResolvedValue(mockNotif);

      const result = await service.create(dto);
      expect(result).toHaveProperty('id', 'notif-1');
    });
  });

  // ─── findByUser ───────────────────────────────────────────────────────────────

  describe('findByUser — retrieve notifications', () => {
    it('returns up to 50 notifications for the user', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      await service.findByUser('user-1');
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });

    it('orders notifications by createdAt descending (newest first)', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      await service.findByUser('user-1');
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });

    it('scopes results to the requesting user only', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      await service.findByUser('user-1');
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });
  });

  // ─── markRead ─────────────────────────────────────────────────────────────────

  describe('markRead — mark a single notification as read', () => {
    it('marks the notification as read only when both id and userId match', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });
      await service.markRead('notif-1', 'user-1');
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
        data: { isRead: true },
      });
    });

    it('cannot mark another user\'s notification as read (userId mismatch yields 0 updates)', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });
      const result = await service.markRead('notif-1', 'wrong-user');
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'notif-1', userId: 'wrong-user' } }),
      );
      expect(result).toEqual({ count: 0 });
    });
  });

  // ─── markAllRead ──────────────────────────────────────────────────────────────

  describe('markAllRead — mark all unread notifications as read', () => {
    it('marks only unread notifications for the user', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });
      await service.markAllRead('user-1');
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true },
      });
    });

    it('does not affect other users notifications', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });
      await service.markAllRead('user-1');
      const call = mockPrisma.notification.updateMany.mock.calls[0][0];
      expect(call.where.userId).toBe('user-1');
    });
  });

  // ─── getUnreadCount ───────────────────────────────────────────────────────────

  describe('getUnreadCount — unread badge count', () => {
    it('returns { count: N } for unread notifications belonging to the user', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);
      const result = await service.getUnreadCount('user-1');
      expect(result).toEqual({ count: 5 });
    });

    it('counts only unread notifications for the user', async () => {
      mockPrisma.notification.count.mockResolvedValue(0);
      await service.getUnreadCount('user-1');
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
      });
    });

    it('returns { count: 0 } when all notifications are read', async () => {
      mockPrisma.notification.count.mockResolvedValue(0);
      const result = await service.getUnreadCount('user-1');
      expect(result).toEqual({ count: 0 });
    });
  });
});
