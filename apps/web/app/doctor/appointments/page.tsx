'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { appointmentsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Video, Users } from 'lucide-react';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import type { Appointment } from '@/types';

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    appointmentsApi.getDoctor().then((res) => setAppointments(res.data)).finally(() => setLoading(false));
  }, []);

  const isUpcoming = (a: Appointment) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const apptDateStr = a.date.slice(0, 10);
    if (apptDateStr > todayStr) return true;
    if (apptDateStr < todayStr) return false;
    const [h, m] = a.startTime.split(':').map(Number);
    return h * 60 + m > now.getHours() * 60 + now.getMinutes();
  };

  const upcoming = appointments.filter(
    (a) => ['PENDING', 'CONFIRMED'].includes(a.status) && isUpcoming(a),
  );
  const past = appointments.filter(
    (a) => a.status === 'COMPLETED' || a.status === 'CANCELLED' || !isUpcoming(a),
  );
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-500 text-sm">Manage your patient consultations</p>
      </div>

      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            {t} ({t === 'upcoming' ? upcoming.length : past.length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-200">
          <Calendar className="mx-auto h-10 w-10 text-gray-200 mb-3" />
          <p className="text-gray-500 text-sm">No {tab} appointments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((appt) => (
            <Card key={appt.id}>
              <CardContent className="p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex flex-1 gap-3 md:gap-4">
                    <div className="h-11 w-11 md:h-12 md:w-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {appt.patient?.firstName} {appt.patient?.lastName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDate(appt.date)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(appt.startTime)}
                        </span>
                      </div>
                      {appt.reason && (
                        <p className="text-xs text-gray-400 mt-1 italic">{appt.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 flex-wrap">
                    <Badge className={getStatusColor(appt.status)}>{appt.status}</Badge>
                    {['PENDING', 'CONFIRMED'].includes(appt.status) && (
                      <Link href={`/doctor/consultation/${appt.id}`}>
                        <Button size="sm" variant="outline" className="gap-1 text-teal-600 border-teal-200">
                          <Video className="h-3.5 w-3.5" /> Start session
                        </Button>
                      </Link>
                    )}
                    {appt.status === 'COMPLETED' && (
                      <Link href={`/doctor/consultation/${appt.id}`}>
                        <Button size="sm" variant="ghost" className="text-blue-600">
                          View notes
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
