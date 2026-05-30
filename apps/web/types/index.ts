export type Role = 'PATIENT' | 'DOCTOR';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface User {
  id: string;
  email: string;
  role: Role;
  doctorProfile?: DoctorProfile;
  patientProfile?: PatientProfile;
  createdAt: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  bio?: string;
  specialization: string;
  licenseNumber?: string;
  yearsExperience: number;
  languages: string[];
  consultationFee: number;
  avatarUrl?: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  schedules?: DoctorSchedule[];
  reviews?: DoctorReview[];
}

export interface PatientProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  birthday?: string;
  weight?: number;
  height?: number;
  avatarUrl?: string;
  contactNumber?: string;
  address?: string;
  bloodType?: string;
  allergies?: string;
  medications?: string;
  medicalHistory?: string;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason?: string;
  jitsiRoomId?: string;
  patient?: PatientProfile;
  doctor?: DoctorProfile;
  consultation?: ConsultationSession;
  createdAt: string;
}

export interface ConsultationSession {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  startedAt?: string;
  endedAt?: string;
  jitsiRoomId: string;
  notes?: ConsultationNote[];
  prescriptions?: Prescription[];
  doctor?: { firstName: string; lastName: string; specialization: string; avatarUrl?: string };
  appointment?: { date: string; startTime: string };
}

export interface ConsultationNote {
  id: string;
  sessionId: string;
  chiefComplaint?: string;
  diagnosis?: string;
  findings?: string;
  recommendations?: string;
  followUpDate?: string;
  createdAt: string;
}

export interface Prescription {
  id: string;
  sessionId: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  sessionId?: string;
  title: string;
  description?: string;
  fileUrl?: string;
  recordType: string;
  session?: ConsultationSession;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  appointmentId?: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface DoctorReview {
  id: string;
  rating: number;
  comment?: string;
  patient: { firstName: string; lastName: string; avatarUrl?: string };
  createdAt: string;
}
