import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { RegisterRole } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwt = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    const dto = {
      email: 'patient@test.com',
      password: 'Password123!',
      firstName: 'Juan',
      lastName: 'dela Cruz',
      role: RegisterRole.PATIENT,
    };

    const mockCreatedUser = {
      id: 'user-1',
      email: dto.email,
      role: 'PATIENT',
      passwordHash: 'hashed',
      refreshToken: 'rt',
      patientProfile: { firstName: 'Juan', lastName: 'dela Cruz' },
      doctorProfile: null,
    };

    it('throws ConflictException if email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('creates a PatientProfile when role is PATIENT', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);
      mockPrisma.user.update.mockResolvedValue({});

      await service.register(dto);

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'PATIENT',
            patientProfile: { create: { firstName: 'Juan', lastName: 'dela Cruz' } },
          }),
        }),
      );
    });

    it('hashes the password — plain text is never stored', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);
      mockPrisma.user.update.mockResolvedValue({});

      await service.register(dto);

      const storedHash = mockPrisma.user.create.mock.calls[0][0].data.passwordHash;
      expect(storedHash).not.toBe(dto.password);
      expect(await bcrypt.compare(dto.password, storedHash)).toBe(true);
    });

    it('returns accessToken and refreshToken on success', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.register(dto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('strips passwordHash and refreshToken from returned user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.register(dto);

      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).not.toHaveProperty('refreshToken');
    });

    it('saves a hashed refreshToken to the DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);
      mockPrisma.user.update.mockResolvedValue({});

      await service.register(dto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { refreshToken: expect.any(String) },
        }),
      );
    });
  });

  // ─── register — DOCTOR role ───────────────────────────────────────────────────

  describe('register — DOCTOR role', () => {
    const doctorDto = {
      email: 'doctor@test.com',
      password: 'Password123!',
      firstName: 'Maria',
      lastName: 'Reyes',
      role: RegisterRole.DOCTOR,
      specialization: 'Cardiology',
    };

    const mockDoctorUser = {
      id: 'user-2',
      email: doctorDto.email,
      role: 'DOCTOR',
      passwordHash: 'hashed',
      refreshToken: 'rt',
      doctorProfile: { firstName: 'Maria', lastName: 'Reyes', specialization: 'Cardiology' },
      patientProfile: null,
    };

    it('creates a DoctorProfile (not a PatientProfile) when role is DOCTOR', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockDoctorUser);
      mockPrisma.user.update.mockResolvedValue({});

      await service.register(doctorDto);

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data).toHaveProperty('doctorProfile');
      expect(createCall.data).not.toHaveProperty('patientProfile');
    });

    it('uses the provided specialization when registering a doctor', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockDoctorUser);
      mockPrisma.user.update.mockResolvedValue({});

      await service.register(doctorDto);

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            doctorProfile: {
              create: expect.objectContaining({ specialization: 'Cardiology' }),
            },
          }),
        }),
      );
    });

    it('falls back to General Practice if specialization is not provided', async () => {
      const { specialization, ...dtoWithout } = doctorDto;
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockDoctorUser);
      mockPrisma.user.update.mockResolvedValue({});

      await service.register(dtoWithout as any);

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            doctorProfile: {
              create: expect.objectContaining({ specialization: 'General Practice' }),
            },
          }),
        }),
      );
    });

    it('strips passwordHash and refreshToken from returned doctor user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockDoctorUser);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.register(doctorDto);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).not.toHaveProperty('refreshToken');
    });
  });

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('throws UnauthorizedException if email not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'x@x.com', password: 'pass' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if password is incorrect', async () => {
      const hash = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'p@test.com', passwordHash: hash,
        role: 'PATIENT', refreshToken: null, patientProfile: {}, doctorProfile: null,
      });
      await expect(service.login({ email: 'p@test.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens and sanitized user on valid credentials', async () => {
      const hash = await bcrypt.hash('Password123!', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'p@test.com', passwordHash: hash,
        role: 'PATIENT', refreshToken: null, patientProfile: { firstName: 'Juan' }, doctorProfile: null,
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.login({ email: 'p@test.com', password: 'Password123!' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });
});
