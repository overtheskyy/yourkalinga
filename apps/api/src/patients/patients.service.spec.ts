import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  patientProfile: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('PatientsService', () => {
  let service: PatientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findByUserId ─────────────────────────────────────────────────────────────

  describe('findByUserId', () => {
    it('throws NotFoundException if no profile exists for userId', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue(null);
      await expect(service.findByUserId('user-1')).rejects.toThrow(NotFoundException);
    });

    it('returns the profile when found', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue({ id: 'p1', firstName: 'Juan' });
      const result = await service.findByUserId('user-1');
      expect(result).toHaveProperty('id', 'p1');
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────────

  describe('update', () => {
    const userId = 'user-1';

    it('throws NotFoundException if patient profile not found', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue(null);
      await expect(service.update(userId, { firstName: 'Juan' })).rejects.toThrow(NotFoundException);
    });

    it('converts birthday string to a Date object before saving', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.patientProfile.update.mockResolvedValue({});

      await service.update(userId, { birthday: '1995-06-15' });

      expect(mockPrisma.patientProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ birthday: new Date('1995-06-15') }),
        }),
      );
    });

    it('does not set birthday field if none provided', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.patientProfile.update.mockResolvedValue({});

      await service.update(userId, { firstName: 'Juan' });

      const updateData = mockPrisma.patientProfile.update.mock.calls[0][0].data;
      expect(updateData.birthday).toBeUndefined();
    });

    it('saves all provided profile fields', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.patientProfile.update.mockResolvedValue({});

      const dto = {
        firstName: 'Juan',
        lastName: 'dela Cruz',
        weight: 65,
        height: 170,
        contactNumber: '09171234567',
        address: 'Manila',
        bloodType: 'O+',
        allergies: 'Penicillin',
        medications: 'None',
        medicalHistory: 'Hypertension',
      };

      await service.update(userId, dto);

      expect(mockPrisma.patientProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining(dto),
        }),
      );
    });
  });
});
