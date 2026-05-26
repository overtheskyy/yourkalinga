import { PrismaClient, Role, DayOfWeek } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SPECIALIZATIONS = [
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'Psychiatry',
  'OB-GYN',
  'Internal Medicine',
  'ENT',
];

const DOCTORS = [
  {
    email: 'dr.reyes@yourkalinga.com',
    firstName: 'Maria',
    lastName: 'Reyes',
    specialization: 'General Practice',
    bio: 'Board-certified general practitioner with 12 years of experience in family medicine and preventive care.',
    yearsExperience: 12,
    languages: ['English', 'Filipino'],
    consultationFee: 500,
    rating: 4.8,
    reviewCount: 124,
  },
  {
    email: 'dr.santos@yourkalinga.com',
    firstName: 'Juan',
    lastName: 'Santos',
    specialization: 'Cardiology',
    bio: 'Fellowship-trained cardiologist specializing in heart failure, hypertension, and preventive cardiology.',
    yearsExperience: 15,
    languages: ['English', 'Filipino'],
    consultationFee: 1200,
    rating: 4.9,
    reviewCount: 89,
  },
  {
    email: 'dr.garcia@yourkalinga.com',
    firstName: 'Ana',
    lastName: 'Garcia',
    specialization: 'Dermatology',
    bio: 'Specialist in medical and cosmetic dermatology with expertise in acne, eczema, and skin cancer screening.',
    yearsExperience: 8,
    languages: ['English', 'Filipino', 'Spanish'],
    consultationFee: 800,
    rating: 4.7,
    reviewCount: 67,
  },
  {
    email: 'dr.cruz@yourkalinga.com',
    firstName: 'Roberto',
    lastName: 'Cruz',
    specialization: 'Pediatrics',
    bio: 'Dedicated pediatrician with a gentle approach to child healthcare, from newborns to adolescents.',
    yearsExperience: 10,
    languages: ['English', 'Filipino'],
    consultationFee: 600,
    rating: 4.9,
    reviewCount: 201,
  },
  {
    email: 'dr.lim@yourkalinga.com',
    firstName: 'Christine',
    lastName: 'Lim',
    specialization: 'OB-GYN',
    bio: 'Compassionate OB-GYN specializing in women\'s health, prenatal care, and reproductive medicine.',
    yearsExperience: 14,
    languages: ['English', 'Filipino', 'Chinese'],
    consultationFee: 1000,
    rating: 4.8,
    reviewCount: 156,
  },
  {
    email: 'dr.dela-cruz@yourkalinga.com',
    firstName: 'Miguel',
    lastName: 'Dela Cruz',
    specialization: 'Orthopedics',
    bio: 'Sports medicine and orthopedic specialist focused on joint replacement, fractures, and sports injuries.',
    yearsExperience: 18,
    languages: ['English', 'Filipino'],
    consultationFee: 1500,
    rating: 4.7,
    reviewCount: 43,
  },
  {
    email: 'dr.tan@yourkalinga.com',
    firstName: 'Jennifer',
    lastName: 'Tan',
    specialization: 'Psychiatry',
    bio: 'Empathetic psychiatrist providing evidence-based treatment for anxiety, depression, and mood disorders.',
    yearsExperience: 9,
    languages: ['English', 'Filipino'],
    consultationFee: 1100,
    rating: 4.9,
    reviewCount: 78,
  },
  {
    email: 'dr.mendoza@yourkalinga.com',
    firstName: 'Carlos',
    lastName: 'Mendoza',
    specialization: 'Neurology',
    bio: 'Neurologist specializing in headache disorders, epilepsy, stroke prevention, and cognitive health.',
    yearsExperience: 20,
    languages: ['English', 'Filipino'],
    consultationFee: 1800,
    rating: 4.8,
    reviewCount: 62,
  },
  {
    email: 'dr.aquino@yourkalinga.com',
    firstName: 'Sophia',
    lastName: 'Aquino',
    specialization: 'Internal Medicine',
    bio: 'Board-certified internist managing complex chronic conditions including diabetes and hypertension.',
    yearsExperience: 11,
    languages: ['English', 'Filipino'],
    consultationFee: 900,
    rating: 4.6,
    reviewCount: 95,
  },
  {
    email: 'dr.villanueva@yourkalinga.com',
    firstName: 'Patrick',
    lastName: 'Villanueva',
    specialization: 'ENT',
    bio: 'Ear, nose, and throat specialist with expertise in sinusitis, hearing loss, and voice disorders.',
    yearsExperience: 13,
    languages: ['English', 'Filipino'],
    consultationFee: 950,
    rating: 4.7,
    reviewCount: 51,
  },
];

const DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

async function main() {
  console.log('🌱 Seeding YourKalinga database...');

  const hash = await bcrypt.hash('Doctor123!', 10);

  for (const doc of DOCTORS) {
    const user = await prisma.user.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        email: doc.email,
        passwordHash: hash,
        role: Role.DOCTOR,
        doctorProfile: {
          create: {
            firstName: doc.firstName,
            lastName: doc.lastName,
            bio: doc.bio,
            specialization: doc.specialization,
            yearsExperience: doc.yearsExperience,
            languages: doc.languages,
            consultationFee: doc.consultationFee,
            rating: doc.rating,
            reviewCount: doc.reviewCount,
            isVerified: true,
          },
        },
      },
      include: { doctorProfile: true },
    });

    if (user.doctorProfile) {
      for (const day of DAYS) {
        await prisma.doctorSchedule.upsert({
          where: {
            doctorId_dayOfWeek: {
              doctorId: user.doctorProfile.id,
              dayOfWeek: day,
            },
          },
          update: {},
          create: {
            doctorId: user.doctorProfile.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            slotDuration: 30,
            isActive: true,
          },
        });
      }
    }

    console.log(`  ✓ Dr. ${doc.firstName} ${doc.lastName} — ${doc.specialization}`);
  }

  // Seed a demo patient
  const patientHash = await bcrypt.hash('Patient123!', 10);
  await prisma.user.upsert({
    where: { email: 'patient@yourkalinga.com' },
    update: {},
    create: {
      email: 'patient@yourkalinga.com',
      passwordHash: patientHash,
      role: Role.PATIENT,
      patientProfile: {
        create: {
          firstName: 'Juan',
          lastName: 'dela Cruz',
          birthday: new Date('1990-05-15'),
          weight: 70,
          height: 170,
          contactNumber: '+63 912 345 6789',
          bloodType: 'O+',
          medicalHistory: 'No known chronic conditions. Seasonal allergies.',
        },
      },
    },
  });
  console.log('  ✓ Demo patient — patient@yourkalinga.com');

  console.log('\n✅ Seeding complete!');
  console.log('Doctor password: Doctor123!');
  console.log('Patient password: Patient123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
