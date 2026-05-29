import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  doctorProfile: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  doctorSchedule: {
    findUnique: jest.fn(),
  },
  appointment: {
    findMany: jest.fn(),
  },
};

describe('DoctorsService', () => {
  let service: DoctorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DoctorsService>(DoctorsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findAll ──────────────────────────────────────────────────────────────────

  describe('findAll — browse & filter doctors', () => {
    it('returns all doctors ordered by rating descending when no filters applied', async () => {
      mockPrisma.doctorProfile.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(mockPrisma.doctorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { rating: 'desc' } }),
      );
    });

    it('includes only active schedules', async () => {
      mockPrisma.doctorProfile.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(mockPrisma.doctorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            schedules: { where: { isActive: true } },
          }),
        }),
      );
    });

    it('searches firstName, lastName, and bio with case-insensitive OR logic', async () => {
      mockPrisma.doctorProfile.findMany.mockResolvedValue([]);
      await service.findAll('reyes');
      expect(mockPrisma.doctorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { firstName: { contains: 'reyes', mode: 'insensitive' } },
              { lastName: { contains: 'reyes', mode: 'insensitive' } },
              { bio: { contains: 'reyes', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('filters by specialization using case-insensitive contains', async () => {
      mockPrisma.doctorProfile.findMany.mockResolvedValue([]);
      await service.findAll(undefined, 'Cardiology');
      expect(mockPrisma.doctorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            specialization: { contains: 'Cardiology', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('applies both search and specialization filters together', async () => {
      mockPrisma.doctorProfile.findMany.mockResolvedValue([]);
      await service.findAll('reyes', 'Cardiology');
      const callArgs = mockPrisma.doctorProfile.findMany.mock.calls[0][0];
      expect(callArgs.where).toHaveProperty('OR');
      expect(callArgs.where).toHaveProperty('specialization');
    });
  });

  // ─── getAvailableSlots ────────────────────────────────────────────────────────

  describe('getAvailableSlots — slot generation and conflict detection', () => {
    const doctorId = 'doc-1';
    const monday = '2026-06-01'; // a Monday

    it('returns empty array if no schedule exists for that day', async () => {
      mockPrisma.doctorSchedule.findUnique.mockResolvedValue(null);
      const result = await service.getAvailableSlots(doctorId, monday);
      expect(result).toEqual([]);
    });

    it('returns empty array if schedule is inactive', async () => {
      mockPrisma.doctorSchedule.findUnique.mockResolvedValue({
        isActive: false,
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30,
        blockedSlots: [],
      });
      const result = await service.getAvailableSlots(doctorId, monday);
      expect(result).toEqual([]);
    });

    it('generates correct 30-minute slots from startTime to endTime', async () => {
      mockPrisma.doctorSchedule.findUnique.mockResolvedValue({
        isActive: true,
        startTime: '09:00',
        endTime: '10:30',
        slotDuration: 30,
        blockedSlots: [],
      });
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSlots(doctorId, monday);
      expect(result).toEqual(['09:00', '09:30', '10:00']);
    });

    it('does not include the last slot if it would exceed endTime', async () => {
      mockPrisma.doctorSchedule.findUnique.mockResolvedValue({
        isActive: true,
        startTime: '10:30',
        endTime: '11:00',
        slotDuration: 30,
        blockedSlots: [],
      });
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSlots(doctorId, monday);
      expect(result).toEqual(['10:30']);
      expect(result).not.toContain('11:00');
    });

    it('excludes slots already booked (PENDING or CONFIRMED)', async () => {
      mockPrisma.doctorSchedule.findUnique.mockResolvedValue({
        isActive: true,
        startTime: '09:00',
        endTime: '10:30',
        slotDuration: 30,
        blockedSlots: [],
      });
      mockPrisma.appointment.findMany.mockResolvedValue([{ startTime: '09:30' }]);

      const result = await service.getAvailableSlots(doctorId, monday);
      expect(result).not.toContain('09:30');
      expect(result).toContain('09:00');
      expect(result).toContain('10:00');
    });

    it('excludes slots blocked for that specific date', async () => {
      mockPrisma.doctorSchedule.findUnique.mockResolvedValue({
        isActive: true,
        startTime: '09:00',
        endTime: '10:30',
        slotDuration: 30,
        blockedSlots: [{ startTime: '09:00' }],
      });
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSlots(doctorId, monday);
      expect(result).not.toContain('09:00');
      expect(result).toContain('09:30');
    });

    it('excludes both booked and blocked slots simultaneously', async () => {
      mockPrisma.doctorSchedule.findUnique.mockResolvedValue({
        isActive: true,
        startTime: '09:00',
        endTime: '11:00',
        slotDuration: 30,
        blockedSlots: [{ startTime: '09:00' }],
      });
      mockPrisma.appointment.findMany.mockResolvedValue([{ startTime: '10:00' }]);

      const result = await service.getAvailableSlots(doctorId, monday);
      expect(result).not.toContain('09:00');
      expect(result).not.toContain('10:00');
      expect(result).toContain('09:30');
      expect(result).toContain('10:30');
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('throws NotFoundException if doctor does not exist', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
