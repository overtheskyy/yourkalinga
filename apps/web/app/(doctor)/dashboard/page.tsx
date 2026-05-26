'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { appointmentsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Video, Users, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import type { Appointment } from '@/types';

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const profile = user?.doctorProfile;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentsApi.getDoctor().then((res) => setAppointments(res.data)).finally(() => setLoading(false));
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAppts = appointments.filter((a) => {
    const d = new Date(a.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime() && ['PENDING', 'CONFIRMED'].includes(a.status);
  });

  const upcoming = appointments.filter((a) =>
    ['PENDING', 'CONFIRMED'].includes(a.status) && new Date(a.date) >= new Date(),
  );
  const completed = appointments.filter((a) => a.status === 'COMPLETED');
  const uniquePatients = new Set(appointments.map((a) => a.patientId)).size;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-700 to-teal-600 p-6 text-white">
        <p className="text-teal-200 text-sm mb-1">Welcome back, Doctor</p>
        <h1 className="text-2xl font-bold">Dr. {profile?.firstName} {profile?.lastName}</h1>
        <p className="text-teal-200 text-sm mt-1">{profile?.specialization}</p>
        {todayAppts.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm">{todayAppts.length} consultation{todayAppts.length > 1 ? 's' : ''} today</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Today's appointments", value: todayAppts.length, icon: Calendar, color: 'text-teal-600' },
          { label: 'Upcoming', value: upcoming.length, icon: Clock, color: 'text-blue-600' },
          { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Total patients', value: uniquePatients, icon: Users, color: 'text-purple-600' },
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

      {/* Today's schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Today's Schedule</CardTitle>
          <Link href="/doctor/appointments">
            <Button variant="ghost" size="sm" className="text-teal-600">View all</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : todayAppts.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="mx-auto h-10 w-10 text-gray-200 mb-3" />
              <p className="text-gray-500 text-sm">No appointments today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppts.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4 hover:border-teal-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {appt.patient?.firstName} {appt.patient?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{formatTime(appt.startTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(appt.status)}>{appt.status}</Badge>
                    <Link href={`/doctor/consultation/${appt.id}`}>
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
