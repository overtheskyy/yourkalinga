import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
      include: { user: { select: { email: true, id: true } } },
    });
    if (!profile) throw new NotFoundException('Patient profile not found');
    return profile;
  }

  async findById(id: string) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });
    if (!profile) throw new NotFoundException('Patient not found');
    return profile;
  }

  async update(userId: string, dto: UpdatePatientDto) {
    const profile = await this.prisma.patientProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Patient profile not found');

    return this.prisma.patientProfile.update({
      where: { userId },
      data: {
        ...dto,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      },
    });
  }
}
