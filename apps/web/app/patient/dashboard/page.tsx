'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { appointmentsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Stethoscope, FileText, ArrowRight, Video } from 'lucide-react';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import type { Appointment } from '@/types';

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const profile = user?.patientProfile;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentsApi.getPatient().then((res) => {
      setAppointments(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const upcoming = appointments.filter(
    (a) => ['PENDING', 'CONFIRMED'].includes(a.status) && new Date(a.date) >= new Date(),
  );
  const past = appointments.filter((a) => a.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-teal-500 p-6 text-white">
        <p className="text-teal-100 text-sm mb-1">Good day,</p>
        <h1 className="text-2xl font-bold mb-1">{profile?.firstName} {profile?.lastName}</h1>
        <p className="text-teal-100 text-sm">
          {upcoming.length > 0
            ? `You have ${upcoming.length} upcoming appointment${upcoming.length > 1 ? 's' : ''}`
            : "We've got you. Your health, your kalinga."}
        </p>
        <Link href="/patient/doctors" className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30 transition-colors">
          See a doctor now <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Upcoming', value: upcoming.length, icon: Calendar, color: 'text-teal-600' },
          { label: 'Completed', value: past.length, icon: FileText, color: 'text-blue-600' },
          { label: 'Total visits', value: appointments.length, icon: Stethoscope, color: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-xl bg-gray-50 p-2.5 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? '—' : value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Upcoming Appointments</CardTitle>
          <Link href="/patient/appointments">
            <Button variant="ghost" size="sm" className="text-teal-600">View all</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="mx-auto h-10 w-10 text-gray-200 mb-3" />
              <p className="text-gray-500 text-sm mb-3">No upcoming appointments yet</p>
              <Link href="/patient/doctors">
                <Button size="sm">Book your first consultation</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((appt) => (
                <div key={appt.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4 hover:border-teal-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                      <Stethoscope className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(appt.date)} · {formatTime(appt.startTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(appt.status)}>{appt.status}</Badge>
                    <Link href={`/patient/consultation/${appt.id}`}>
                      <Button size="sm" variant="ghost" className="text-teal-600 gap-1">
                        <Video className="h-3.5 w-3.5" /> Join
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
