import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const mockPrisma = {
  doctorProfile: { findUnique: jest.fn() },
  doctorSchedule: {
    upsert: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  appointment: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  blockedSlot: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
};

const mockNotifications = { create: jest.fn() };

describe('SchedulesService', () => {
  let service: SchedulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── upsertSchedule ───────────────────────────────────────────────────────────

  describe('upsertSchedule — manage weekly availability', () => {
    const userId = 'doctor-user-1';
    const mockDoctor = { id: 'doc-1', firstName: 'Maria', lastName: 'Reyes' };

    const baseDto = {
      dayOfWeek: 'MONDAY' as any,
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30,
    };

    beforeEach(() => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
      mockPrisma.doctorSchedule.upsert.mockResolvedValue({ id: 'sched-1', ...baseDto });
      mockPrisma.appointment.findMany.mockResolvedValue([]);
    });

    it('throws NotFoundException if doctor profile not found', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(null);
      await expect(service.upsertSchedule(userId, baseDto)).rejects.toThrow(NotFoundException);
    });

    it('upserts schedule using doctorId + dayOfWeek as unique key', async () => {
      await service.upsertSchedule(userId, baseDto);
      expect(mockPrisma.doctorSchedule.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { doctorId_dayOfWeek: { doctorId: 'doc-1', dayOfWeek: 'MONDAY' } },
        }),
      );
    });

    it('defaults slotDuration to 30 on create if not provided', async () => {
      const { slotDuration, ...dtoWithout } = baseDto;
      await service.upsertSchedule(userId, dtoWithout as any);
      expect(mockPrisma.doctorSchedule.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ slotDuration: 30 }),
        }),
      );
    });

    it('defaults isActive to true on update if not specified', async () => {
      await service.upsertSchedule(userId, baseDto);
      expect(mockPrisma.doctorSchedule.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('does not query or notify when isActive is true', async () => {
      await service.upsertSchedule(userId, { ...baseDto, isActive: true });
      expect(mockPrisma.appointment.findMany).not.toHaveBeenCalled();
      expect(mockNotifications.create).not.toHaveBeenCalled();
    });

    it('marks affected PENDING/CONFIRMED appointments as RESCHEDULED when day is deactivated', async () => {
      // 2026-06-01 is a Monday — getDay() === 1
      const mondayDate = new Date('2026-06-01');
      mockPrisma.appointment.findMany.mockResolvedValue([
        { id: 'appt-1', date: mondayDate, patient: { user: { id: 'patient-user-1' } } },
      ]);

      await service.upsertSchedule(userId, { ...baseDto, isActive: false });

      expect(mockPrisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'appt-1' },
          data: { status: 'RESCHEDULED' },
        }),
      );
    });

    it('sends APPOINTMENT_RESCHEDULED notification to each affected patient', async () => {
      const mondayDate = new Date('2026-06-01');
      mockPrisma.appointment.findMany.mockResolvedValue([
        { id: 'appt-1', date: mondayDate, patient: { user: { id: 'patient-user-1' } } },
      ]);

      await service.upsertSchedule(userId, { ...baseDto, isActive: false });

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'patient-user-1',
          type: 'APPOINTMENT_RESCHEDULED',
          appointmentId: 'appt-1',
        }),
      );
    });

    it('does not affect appointments on other days when Monday is deactivated', async () => {
      // 2026-06-02 is a Tuesday — getDay() === 2
      const tuesdayDate = new Date('2026-06-02');
      mockPrisma.appointment.findMany.mockResolvedValue([
        { id: 'appt-tuesday', date: tuesdayDate, patient: { user: { id: 'patient-user-1' } } },
      ]);

      await service.upsertSchedule(userId, { ...baseDto, isActive: false });

      expect(mockPrisma.appointment.update).not.toHaveBeenCalled();
      expect(mockNotifications.create).not.toHaveBeenCalled();
    });

    it('sends zero notifications when no upcoming appointments are affected', async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([]);
      await service.upsertSchedule(userId, { ...baseDto, isActive: false });
      expect(mockNotifications.create).not.toHaveBeenCalled();
    });

    it('notifies multiple patients when multiple appointments are affected', async () => {
      const mondayDate = new Date('2026-06-01');
      mockPrisma.appointment.findMany.mockResolvedValue([
        { id: 'appt-1', date: mondayDate, patient: { user: { id: 'patient-1' } } },
        { id: 'appt-2', date: mondayDate, patient: { user: { id: 'patient-2' } } },
      ]);

      await service.upsertSchedule(userId, { ...baseDto, isActive: false });

      expect(mockNotifications.create).toHaveBeenCalledTimes(2);
      expect(mockNotifications.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'patient-1' }));
      expect(mockNotifications.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'patient-2' }));
    });
  });

  // ─── getMySchedules ───────────────────────────────────────────────────────────

  describe('getMySchedules', () => {
    it('throws NotFoundException if doctor profile not found', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(null);
      await expect(service.getMySchedules('user-1')).rejects.toThrow(NotFoundException);
    });

    it('returns schedules with blocked slots ordered by date ascending', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doc-1' });
      mockPrisma.doctorSchedule.findMany.mockResolvedValue([]);

      await service.getMySchedules('user-1');

      expect(mockPrisma.doctorSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { doctorId: 'doc-1' },
          include: { blockedSlots: { orderBy: { date: 'asc' } } },
        }),
      );
    });
  });

  // ─── blockSlot ────────────────────────────────────────────────────────────────

  describe('blockSlot — restrict a specific time slot', () => {
    const userId = 'doctor-user-1';
    const dto = {
      scheduleId: 'sched-1',
      date: '2026-06-10',
      startTime: '10:00',
      endTime: '10:30',
      reason: 'Personal',
    };

    it('throws NotFoundException if doctor profile not found', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(null);
      await expect(service.blockSlot(userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if schedule not found', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doc-1' });
      mockPrisma.doctorSchedule.findUnique.mockResolvedValue(null);
      await expect(service.blockSlot(userId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException if schedule belongs to a different doctor', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doc-1' });
      mockPrisma.doctorSchedule.findUnique.mockResolvedValue({ id: 'sched-1', doctorId: 'doc-OTHER' });
      await expect(service.blockSlot(userId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('creates a blocked slot with date, startTime, endTime, and reason', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doc-1' });
      mockPrisma.doctorSchedule.findUnique.mockResolvedValue({ id: 'sched-1', doctorId: 'doc-1' });
      mockPrisma.blockedSlot.create.mockResolvedValue({ id: 'slot-1' });

      await service.blockSlot(userId, dto);

      expect(mockPrisma.blockedSlot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            scheduleId: 'sched-1',
            startTime: '10:00',
            endTime: '10:30',
            reason: 'Personal',
          }),
        }),
      );
    });

    it('converts date string to Date object when creating blocked slot', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doc-1' });
      mockPrisma.doctorSchedule.findUnique.mockResolvedValue({ id: 'sched-1', doctorId: 'doc-1' });
      mockPrisma.blockedSlot.create.mockResolvedValue({ id: 'slot-1' });

      await service.blockSlot(userId, dto);

      const createData = mockPrisma.blockedSlot.create.mock.calls[0][0].data;
      expect(createData.date).toBeInstanceOf(Date);
    });
  });

  // ─── unblockSlot ──────────────────────────────────────────────────────────────

  describe('unblockSlot — remove a blocked slot', () => {
    const userId = 'doctor-user-1';
    const slotId = 'slot-1';

    it('throws NotFoundException if doctor profile not found', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(null);
      await expect(service.unblockSlot(slotId, userId)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if blocked slot not found', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doc-1' });
      mockPrisma.blockedSlot.findUnique.mockResolvedValue(null);
      await expect(service.unblockSlot(slotId, userId)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException if the slot belongs to a different doctor', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doc-1' });
      mockPrisma.blockedSlot.findUnique.mockResolvedValue({
        id: slotId,
        schedule: { doctorId: 'doc-OTHER' },
      });
      await expect(service.unblockSlot(slotId, userId)).rejects.toThrow(ForbiddenException);
    });

    it('deletes the blocked slot when authorized', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doc-1' });
      mockPrisma.blockedSlot.findUnique.mockResolvedValue({
        id: slotId,
        schedule: { doctorId: 'doc-1' },
      });
      mockPrisma.blockedSlot.delete.mockResolvedValue({ id: slotId });

      await service.unblockSlot(slotId, userId);

      expect(mockPrisma.blockedSlot.delete).toHaveBeenCalledWith({ where: { id: slotId } });
    });
  });
});
