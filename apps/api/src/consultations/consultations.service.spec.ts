import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  appointment: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  consultationSession: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  consultationNote: {
    create: jest.fn(),
  },
  prescription: {
    createMany: jest.fn(),
  },
  medicalRecord: {
    upsert: jest.fn(),
  },
};

describe('ConsultationsService', () => {
  let service: ConsultationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ConsultationsService>(ConsultationsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── startSession ─────────────────────────────────────────────────────────────

  describe('startSession — join consultation', () => {
    const appointmentId = 'appt-1';
    const doctorUserId = 'doctor-user-1';
    const patientUserId = 'patient-user-1';

    const mockAppointment = {
      id: appointmentId,
      patientId: 'patient-1',
      doctorId: 'doc-1',
      jitsiRoomId: 'yourkalinga-abc12345',
      patient: { user: { id: patientUserId } },
      doctor: { user: { id: doctorUserId } },
    };

    beforeEach(() => {
      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrisma.consultationSession.findUnique.mockResolvedValue(null);
      mockPrisma.consultationSession.create.mockResolvedValue({ id: 'session-1' });
      mockPrisma.appointment.update.mockResolvedValue({});
    });

    it('throws NotFoundException if appointment not found', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);
      await expect(service.startSession(appointmentId, doctorUserId)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if user is unrelated to the appointment', async () => {
      await expect(service.startSession(appointmentId, 'stranger')).rejects.toThrow(ForbiddenException);
    });

    it('allows the doctor to start the session', async () => {
      const session = await service.startSession(appointmentId, doctorUserId);
      expect(session).toHaveProperty('id');
    });

    it('allows the patient to start the session', async () => {
      const session = await service.startSession(appointmentId, patientUserId);
      expect(session).toHaveProperty('id');
    });

    it('creates a new session with startedAt timestamp on first call', async () => {
      await service.startSession(appointmentId, doctorUserId);
      expect(mockPrisma.consultationSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            appointmentId,
            startedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('uses the appointment jitsiRoomId for the session', async () => {
      await service.startSession(appointmentId, doctorUserId);
      expect(mockPrisma.consultationSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ jitsiRoomId: 'yourkalinga-abc12345' }),
        }),
      );
    });

    it('falls back to yourkalinga-{appointmentId slice} if jitsiRoomId is null', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({
        ...mockAppointment,
        jitsiRoomId: null,
      });

      await service.startSession(appointmentId, doctorUserId);

      const roomId = mockPrisma.consultationSession.create.mock.calls[0][0].data.jitsiRoomId;
      expect(roomId).toBe(`yourkalinga-${appointmentId.slice(0, 8)}`);
    });

    it('returns the existing session without creating a duplicate on subsequent calls', async () => {
      const existingSession = { id: 'session-existing' };
      mockPrisma.consultationSession.findUnique.mockResolvedValue(existingSession);

      const result = await service.startSession(appointmentId, doctorUserId);

      expect(mockPrisma.consultationSession.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingSession);
    });

    it('updates appointment status to CONFIRMED when session is first created', async () => {
      await service.startSession(appointmentId, doctorUserId);
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: appointmentId },
        data: { status: 'CONFIRMED' },
      });
    });

    it('does not update appointment status when session already exists', async () => {
      mockPrisma.consultationSession.findUnique.mockResolvedValue({ id: 'session-existing' });
      await service.startSession(appointmentId, doctorUserId);
      expect(mockPrisma.appointment.update).not.toHaveBeenCalled();
    });
  });

  // ─── endSession ───────────────────────────────────────────────────────────────

  describe('endSession — doctor ends the consultation', () => {
    const sessionId = 'session-1';
    const doctorUserId = 'doctor-user-1';

    const mockSession = {
      id: sessionId,
      appointmentId: 'appt-1',
      doctor: { user: { id: doctorUserId } },
      appointment: { id: 'appt-1' },
    };

    beforeEach(() => {
      mockPrisma.consultationSession.findUnique.mockResolvedValue(mockSession);
      mockPrisma.consultationSession.update.mockResolvedValue({ ...mockSession, endedAt: new Date() });
      mockPrisma.appointment.update.mockResolvedValue({});
    });

    it('throws NotFoundException if session not found', async () => {
      mockPrisma.consultationSession.findUnique.mockResolvedValue(null);
      await expect(service.endSession(sessionId, doctorUserId)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if a patient tries to end the session', async () => {
      await expect(service.endSession(sessionId, 'patient-user-1')).rejects.toThrow(ForbiddenException);
    });

    it('sets endedAt timestamp on the session', async () => {
      await service.endSession(sessionId, doctorUserId);
      expect(mockPrisma.consultationSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { endedAt: expect.any(Date) },
        }),
      );
    });

    it('sets appointment status to COMPLETED', async () => {
      await service.endSession(sessionId, doctorUserId);
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appt-1' },
        data: { status: 'COMPLETED' },
      });
    });
  });

  // ─── addNote ──────────────────────────────────────────────────────────────────

  describe('addNote — doctor adds consultation notes and prescriptions', () => {
    const appointmentId = 'appt-1';
    const doctorUserId = 'doctor-user-1';

    const mockSession = {
      id: 'session-1',
      patientId: 'patient-1',
      doctor: { user: { id: doctorUserId }, lastName: 'Reyes' },
    };

    const mockNote = { id: 'note-1' };

    beforeEach(() => {
      mockPrisma.consultationSession.findUnique.mockResolvedValue(mockSession);
      mockPrisma.consultationNote.create.mockResolvedValue(mockNote);
      mockPrisma.prescription.createMany.mockResolvedValue({ count: 0 });
      mockPrisma.appointment.findUnique.mockResolvedValue({ doctor: { lastName: 'Reyes' } });
      mockPrisma.medicalRecord.upsert.mockResolvedValue({});
    });

    it('throws NotFoundException if no session exists for the appointment', async () => {
      mockPrisma.consultationSession.findUnique.mockResolvedValue(null);
      await expect(service.addNote(appointmentId, doctorUserId, {})).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if user is not the doctor on the session', async () => {
      await expect(service.addNote(appointmentId, 'patient-user-1', {})).rejects.toThrow(ForbiddenException);
    });

    it('creates a consultation note with provided fields', async () => {
      const dto = {
        chiefComplaint: 'Chest pain',
        diagnosis: 'Hypertension',
        findings: 'Elevated BP',
        recommendations: 'Rest and medication',
      };

      await service.addNote(appointmentId, doctorUserId, dto);

      expect(mockPrisma.consultationNote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionId: 'session-1',
            chiefComplaint: 'Chest pain',
            diagnosis: 'Hypertension',
            findings: 'Elevated BP',
            recommendations: 'Rest and medication',
          }),
        }),
      );
    });

    it('converts followUpDate string to a Date object', async () => {
      await service.addNote(appointmentId, doctorUserId, { followUpDate: '2026-07-01' });
      const createData = mockPrisma.consultationNote.create.mock.calls[0][0].data;
      expect(createData.followUpDate).toBeInstanceOf(Date);
    });

    it('omits followUpDate if not provided', async () => {
      await service.addNote(appointmentId, doctorUserId, { diagnosis: 'Flu' });
      const createData = mockPrisma.consultationNote.create.mock.calls[0][0].data;
      expect(createData.followUpDate).toBeUndefined();
    });

    it('bulk-creates prescriptions when provided', async () => {
      const dto = {
        prescriptions: [
          { medication: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days' },
          { medication: 'Metoprolol', dosage: '50mg', frequency: 'Twice daily', duration: '30 days' },
        ],
      };

      await service.addNote(appointmentId, doctorUserId, dto);

      expect(mockPrisma.prescription.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ sessionId: 'session-1', medication: 'Amlodipine' }),
            expect.objectContaining({ sessionId: 'session-1', medication: 'Metoprolol' }),
          ]),
        }),
      );
    });

    it('does not call createMany if prescriptions array is empty', async () => {
      await service.addNote(appointmentId, doctorUserId, { prescriptions: [] });
      expect(mockPrisma.prescription.createMany).not.toHaveBeenCalled();
    });

    it('does not call createMany if prescriptions is not provided', async () => {
      await service.addNote(appointmentId, doctorUserId, { diagnosis: 'Cold' });
      expect(mockPrisma.prescription.createMany).not.toHaveBeenCalled();
    });

    it('upserts a MedicalRecord with recordType CONSULTATION', async () => {
      await service.addNote(appointmentId, doctorUserId, { diagnosis: 'Hypertension' });
      expect(mockPrisma.medicalRecord.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ recordType: 'CONSULTATION' }),
        }),
      );
    });

    it('scopes the medical record to the correct patient', async () => {
      await service.addNote(appointmentId, doctorUserId, { diagnosis: 'Hypertension' });
      expect(mockPrisma.medicalRecord.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ patientId: 'patient-1' }),
        }),
      );
    });

    it('returns the created consultation note', async () => {
      const result = await service.addNote(appointmentId, doctorUserId, { diagnosis: 'Flu' });
      expect(result).toHaveProperty('id', 'note-1');
    });
  });
});
