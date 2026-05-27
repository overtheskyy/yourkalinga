'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { appointmentsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Video, X, RefreshCw, Stethoscope, AlertCircle } from 'lucide-react';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import type { Appointment } from '@/types';

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const fetchAppointments = () => {
    appointmentsApi.getPatient().then((res) => setAppointments(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelling(id);
    try {
      await appointmentsApi.cancel(id);
      fetchAppointments();
    } finally {
      setCancelling(null);
    }
  };

  const upcoming = appointments.filter(
    (a) => ['PENDING', 'CONFIRMED'].includes(a.status) && new Date(a.date) >= new Date(),
  );
  const past = appointments.filter(
    (a) => a.status === 'COMPLETED' || a.status === 'CANCELLED' || new Date(a.date) < new Date(),
  );
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-500 text-sm">Manage your consultations</p>
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
          <p className="text-gray-500 mb-3">
            {tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          </p>
          {tab === 'upcoming' && (
            <Link href="/patient/doctors">
              <Button size="sm">Book a consultation</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((appt) => (
            <Card key={appt.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                      <Stethoscope className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{appt.doctor?.specialization}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDate(appt.date)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
                        </span>
                      </div>
                      {appt.reason && (
                        <p className="text-xs text-gray-400 mt-1 italic">{appt.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getStatusColor(appt.status)}>{appt.status}</Badge>
                    {['PENDING', 'CONFIRMED'].includes(appt.status) && (
                      <div className="flex gap-1.5">
                        <Link href={`/patient/consultation/${appt.id}`}>
                          <Button size="sm" variant="outline" className="gap-1 text-teal-600 border-teal-200">
                            <Video className="h-3.5 w-3.5" /> Join
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => handleCancel(appt.id)}
                          disabled={cancelling === appt.id}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    {appt.status === 'COMPLETED' && (
                      <Link href={`/patient/records`}>
                        <Button size="sm" variant="ghost" className="text-blue-600">
                          View record
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
