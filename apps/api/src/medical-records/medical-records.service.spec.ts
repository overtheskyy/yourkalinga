import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  patientProfile: { findUnique: jest.fn() },
  doctorProfile: { findUnique: jest.fn() },
  appointment: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  medicalRecord: { findMany: jest.fn() },
};

describe('MedicalRecordsService', () => {
  let service: MedicalRecordsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalRecordsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MedicalRecordsService>(MedicalRecordsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── getPatientRecords ────────────────────────────────────────────────────────

  describe('getPatientRecords — patient views their own records', () => {
    it('throws NotFoundException if patient profile not found', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue(null);
      await expect(service.getPatientRecords('user-1')).rejects.toThrow(NotFoundException);
    });

    it('returns records scoped to the authenticated patient only', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue({ id: 'patient-1' });
      mockPrisma.medicalRecord.findMany.mockResolvedValue([]);

      await service.getPatientRecords('user-1');

      expect(mockPrisma.medicalRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: 'patient-1' },
        }),
      );
    });

    it('returns records ordered by createdAt descending (newest first)', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue({ id: 'patient-1' });
      mockPrisma.medicalRecord.findMany.mockResolvedValue([]);

      await service.getPatientRecords('user-1');

      expect(mockPrisma.medicalRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });

    it('includes consultation notes, prescriptions, and doctor info', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue({ id: 'patient-1' });
      mockPrisma.medicalRecord.findMany.mockResolvedValue([]);

      await service.getPatientRecords('user-1');

      expect(mockPrisma.medicalRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            session: expect.objectContaining({
              include: expect.objectContaining({
                notes: true,
                prescriptions: true,
                doctor: expect.any(Object),
              }),
            }),
          }),
        }),
      );
    });
  });

  // ─── getDoctorPatientRecords ──────────────────────────────────────────────────

  describe('getDoctorPatientRecords — doctor views a patient\'s records', () => {
    it('throws NotFoundException if doctor profile not found', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(null);
      await expect(service.getDoctorPatientRecords('doctor-user-1', 'patient-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if doctor has no appointment history with that patient', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doc-1' });
      mockPrisma.appointment.findFirst.mockResolvedValue(null);
      await expect(service.getDoctorPatientRecords('doctor-user-1', 'patient-1')).rejects.toThrow(ForbiddenException);
    });

    it('returns records when doctor has appointment history with the patient', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doc-1' });
      mockPrisma.appointment.findFirst.mockResolvedValue({ id: 'appt-1' });
      mockPrisma.medicalRecord.findMany.mockResolvedValue([{ id: 'record-1' }]);

      const result = await service.getDoctorPatientRecords('doctor-user-1', 'patient-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.medicalRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { patientId: 'patient-1' } }),
      );
    });
  });

  // ─── getAppointmentHistory ────────────────────────────────────────────────────

  describe('getAppointmentHistory — view appointment history by role', () => {
    it('throws NotFoundException if PATIENT role and profile not found', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue(null);
      await expect(service.getAppointmentHistory('user-1', 'PATIENT')).rejects.toThrow(NotFoundException);
    });

    it('returns patient appointments including consultation and doctor info', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue({ id: 'patient-1' });
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await service.getAppointmentHistory('user-1', 'PATIENT');

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: 'patient-1' },
          include: expect.objectContaining({
            doctor: expect.any(Object),
            consultation: expect.any(Object),
          }),
        }),
      );
    });

    it('throws NotFoundException if DOCTOR role and profile not found', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(null);
      await expect(service.getAppointmentHistory('user-1', 'DOCTOR')).rejects.toThrow(NotFoundException);
    });

    it('returns doctor appointments including patient info', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doc-1' });
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await service.getAppointmentHistory('user-1', 'DOCTOR');

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { doctorId: 'doc-1' },
          include: expect.objectContaining({
            patient: expect.any(Object),
          }),
        }),
      );
    });
  });
});
