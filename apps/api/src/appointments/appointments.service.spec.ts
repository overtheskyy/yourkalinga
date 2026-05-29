import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const mockPrisma = {
  patientProfile: { findUnique: jest.fn() },
  doctorProfile: { findUnique: jest.fn() },
  appointment: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockNotifications = { create: jest.fn() };

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ───────────────────────────────────────────────────────────────────

  describe('create — book a consultation', () => {
    const userId = 'user-1';
    const dto = { doctorId: 'doc-1', date: '2026-06-10', startTime: '09:00', endTime: '09:30' };

    beforeEach(() => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue({
        id: 'patient-1', firstName: 'Juan', lastName: 'dela Cruz',
      });
      mockPrisma.doctorProfile.findUnique.mockResolvedValue({
        id: 'doc-1', lastName: 'Reyes', user: { id: 'doctor-user-1' },
      });
      mockPrisma.appointment.findFirst.mockResolvedValue(null);
      mockPrisma.appointment.create.mockResolvedValue({
        id: 'appt-1', status: 'CONFIRMED', jitsiRoomId: 'yourkalinga-abc12345',
        patient: {}, doctor: { user: { id: 'doctor-user-1' } },
      });
    });

    it('throws NotFoundException if patient profile not found', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue(null);
      await expect(service.create(userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if doctor not found', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(null);
      await expect(service.create(userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if time slot is already booked', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue({ id: 'conflict' });
      await expect(service.create(userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('creates appointment with CONFIRMED status', async () => {
      await service.create(userId, dto);
      expect(mockPrisma.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CONFIRMED' }),
        }),
      );
    });

    it('generates Jitsi room ID in format yourkalinga-{8 hex chars}', async () => {
      await service.create(userId, dto);
      const roomId = mockPrisma.appointment.create.mock.calls[0][0].data.jitsiRoomId;
      expect(roomId).toMatch(/^yourkalinga-[a-f0-9]{8}$/);
    });

    it('each booking generates a unique Jitsi room ID', async () => {
      await service.create(userId, dto);
      await service.create(userId, dto);
      const [first, second] = mockPrisma.appointment.create.mock.calls.map(
        (c) => c[0].data.jitsiRoomId,
      );
      expect(first).not.toBe(second);
    });

    it('sends BOOKING_CONFIRMED notification to the patient', async () => {
      await service.create(userId, dto);
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId, type: 'BOOKING_CONFIRMED' }),
      );
    });

    it('sends NEW_BOOKING notification to the doctor', async () => {
      await service.create(userId, dto);
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'doctor-user-1', type: 'NEW_BOOKING' }),
      );
    });

    it('sends exactly 2 notifications per booking', async () => {
      await service.create(userId, dto);
      expect(mockNotifications.create).toHaveBeenCalledTimes(2);
    });
  });

  // ─── reschedule ───────────────────────────────────────────────────────────────

  describe('reschedule', () => {
    const apptId = 'appt-1';
    const patientUserId = 'patient-user-1';
    const doctorUserId = 'doctor-user-1';
    const rescheduleDto = { date: '2026-06-15', startTime: '10:00', endTime: '10:30' };

    const mockAppt = {
      id: apptId,
      patient: { user: { id: patientUserId } },
      doctor: { user: { id: doctorUserId } },
      date: new Date('2026-06-10'),
      startTime: '09:00',
    };

    beforeEach(() => {
      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppt);
      mockPrisma.appointment.update.mockResolvedValue({ ...mockAppt, status: 'CONFIRMED' });
    });

    it('throws NotFoundException if appointment does not exist', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);
      await expect(service.reschedule(apptId, patientUserId, rescheduleDto)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if requesting user is unrelated to the appointment', async () => {
      await expect(service.reschedule(apptId, 'stranger', rescheduleDto)).rejects.toThrow(ForbiddenException);
    });

    it('sets status back to CONFIRMED after rescheduling', async () => {
      await service.reschedule(apptId, patientUserId, rescheduleDto);
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CONFIRMED' }),
        }),
      );
    });

    it('notifies the doctor when the patient reschedules', async () => {
      await service.reschedule(apptId, patientUserId, rescheduleDto);
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: doctorUserId, type: 'RESCHEDULED' }),
      );
    });

    it('notifies the patient when the doctor reschedules', async () => {
      await service.reschedule(apptId, doctorUserId, rescheduleDto);
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: patientUserId, type: 'RESCHEDULED' }),
      );
    });
  });

  // ─── cancel ───────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    const apptId = 'appt-1';
    const patientUserId = 'patient-user-1';
    const doctorUserId = 'doctor-user-1';

    const mockAppt = {
      id: apptId,
      patient: { user: { id: patientUserId } },
      doctor: { user: { id: doctorUserId } },
      date: new Date('2026-06-10'),
      startTime: '09:00',
    };

    beforeEach(() => {
      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppt);
      mockPrisma.appointment.update.mockResolvedValue({ ...mockAppt, status: 'CANCELLED' });
    });

    it('throws NotFoundException if appointment does not exist', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);
      await expect(service.cancel(apptId, patientUserId)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if requesting user is unrelated to the appointment', async () => {
      await expect(service.cancel(apptId, 'stranger')).rejects.toThrow(ForbiddenException);
    });

    it('sets appointment status to CANCELLED', async () => {
      await service.cancel(apptId, patientUserId);
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'CANCELLED' },
        }),
      );
    });

    it('notifies the doctor when the patient cancels', async () => {
      await service.cancel(apptId, patientUserId);
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: doctorUserId, type: 'CANCELLED' }),
      );
    });

    it('notifies the patient when the doctor cancels', async () => {
      await service.cancel(apptId, doctorUserId);
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: patientUserId, type: 'CANCELLED' }),
      );
    });
  });

  // ─── findPatientAppointments ──────────────────────────────────────────────────

  describe('findPatientAppointments — appointment history', () => {
    it('throws NotFoundException if patient not found', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue(null);
      await expect(service.findPatientAppointments('user-1')).rejects.toThrow(NotFoundException);
    });

    it('returns appointments ordered by date then startTime descending', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.appointment.findMany.mockResolvedValue([]);
      await service.findPatientAppointments('user-1');
      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
        }),
      );
    });

    it('includes doctor profile, consultation notes, and prescriptions', async () => {
      mockPrisma.patientProfile.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.appointment.findMany.mockResolvedValue([]);
      await service.findPatientAppointments('user-1');
      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            doctor: true,
            consultation: { include: { notes: true, prescriptions: true } },
          }),
        }),
      );
    });
  });
});
