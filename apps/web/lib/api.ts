import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('yk_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('yk_token');
      localStorage.removeItem('yk_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Auth
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Doctors
export const doctorsApi = {
  getAll: (params?: { search?: string; specialization?: string }) =>
    api.get('/doctors', { params }),
  getOne: (id: string) => api.get(`/doctors/${id}`),
  getSlots: (id: string, date: string) => api.get(`/doctors/${id}/slots`, { params: { date } }),
  getSpecializations: () => api.get('/doctors/specializations'),
  getMyProfile: () => api.get('/doctors/me/profile'),
  updateProfile: (data: any) => api.patch('/doctors/me/profile', data),
};

// Patients
export const patientsApi = {
  getMyProfile: () => api.get('/patients/me/profile'),
  updateProfile: (data: any) => api.patch('/patients/me/profile', data),
  getById: (id: string) => api.get(`/patients/${id}`),
};

// Appointments
export const appointmentsApi = {
  create: (data: any) => api.post('/appointments', data),
  getPatient: () => api.get('/appointments/patient'),
  getDoctor: () => api.get('/appointments/doctor'),
  getOne: (id: string) => api.get(`/appointments/${id}`),
  reschedule: (id: string, data: any) => api.patch(`/appointments/${id}/reschedule`, data),
  cancel: (id: string) => api.patch(`/appointments/${id}/cancel`),
};

// Consultations
export const consultationsApi = {
  start: (appointmentId: string) => api.post(`/consultations/${appointmentId}/start`),
  end: (sessionId: string) => api.patch(`/consultations/${sessionId}/end`),
  addNote: (appointmentId: string, data: any) =>
    api.post(`/consultations/${appointmentId}/notes`, data),
  getSession: (appointmentId: string) => api.get(`/consultations/${appointmentId}`),
};

// Medical Records
export const recordsApi = {
  getMyRecords: () => api.get('/medical-records/my-records'),
  getHistory: () => api.get('/medical-records/history'),
  getPatientRecords: (patientId: string) => api.get(`/medical-records/patient/${patientId}`),
};

// Notifications
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Uploads
export const uploadsApi = {
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/uploads/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// AI
export const aiApi = {
  recommend: (symptoms: string) => api.post('/ai/recommend', { symptoms }),
};

// Schedules
export const schedulesApi = {
  getMy: () => api.get('/schedules/my'),
  upsert: (data: any) => api.post('/schedules', data),
  block: (data: any) => api.post('/schedules/block', data),
  unblock: (slotId: string) => api.delete(`/schedules/block/${slotId}`),
};
