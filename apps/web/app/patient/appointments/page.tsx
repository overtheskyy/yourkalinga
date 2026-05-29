'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { appointmentsApi, doctorsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Video, X, Stethoscope, Loader2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import type { Appointment } from '@/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getNext7Days(offset = 0) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + offset);
    return d;
  });
}

function RescheduleModal({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [saving, setSaving] = useState(false);
  const dates = getNext7Days(weekOffset * 7);

  const handleDateSelect = async (date: Date) => {
    const iso = date.toISOString().split('T')[0];
    setSelectedDate(iso);
    setSelectedSlot('');
    setSlotsLoading(true);
    try {
      const res = await doctorsApi.getSlots(appointment.doctorId, iso);
      setSlots(res.data);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot) return;
    setSaving(true);
    try {
      const slotDuration = 30;
      const [h, m] = selectedSlot.split(':').map(Number);
      const totalEnd = h * 60 + m + slotDuration;
      const endTime = `${Math.floor(totalEnd / 60).toString().padStart(2, '0')}:${(totalEnd % 60).toString().padStart(2, '0')}`;
      await appointmentsApi.reschedule(appointment.id, {
        date: selectedDate,
        startTime: selectedSlot,
        endTime,
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Reschedule failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Reschedule Appointment</h2>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <span className="font-medium">Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}</span>
            <span className="text-gray-400 mx-1">·</span>
            Currently {formatDate(appointment.date)} at {formatTime(appointment.startTime)}
          </div>

          {/* Date picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Select a new date</p>
              <div className="flex gap-1">
                <button
                  onClick={() => { setWeekOffset((w) => Math.max(0, w - 1)); setSelectedDate(''); setSlots([]); }}
                  disabled={weekOffset === 0}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setWeekOffset((w) => w + 1); setSelectedDate(''); setSlots([]); }}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dates.map((date) => {
                const iso = date.toISOString().split('T')[0];
                const dayName = DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
                return (
                  <button
                    key={iso}
                    onClick={() => handleDateSelect(date)}
                    className={`shrink-0 rounded-xl border-2 px-3 py-2 text-center transition-all ${
                      selectedDate === iso
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <p className="text-xs text-gray-500">{dayName.slice(0, 3)}</p>
                    <p className="text-lg font-bold">{date.getDate()}</p>
                    <p className="text-[10px] text-gray-400">{date.toLocaleString('default', { month: 'short' })}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots */}
          {selectedDate && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Available slots</p>
              {slotsLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10" />)}
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 text-center">
                  No available slots for this date
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-lg border py-2 text-sm transition-all ${
                        selectedSlot === slot
                          ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium'
                          : 'border-gray-100 hover:border-teal-200 text-gray-700'
                      }`}
                    >
                      {formatTime(slot)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedSlot || saving}
          >
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Confirm reschedule'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
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
    (a) => ['PENDING', 'CONFIRMED', 'RESCHEDULED'].includes(a.status) && new Date(a.date) >= new Date(),
  );
  const past = appointments.filter(
    (a) => a.status === 'COMPLETED' || a.status === 'CANCELLED' || new Date(a.date) < new Date(),
  );
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="space-y-5">
      {rescheduling && (
        <RescheduleModal
          appointment={rescheduling}
          onClose={() => setRescheduling(null)}
          onSuccess={() => { setRescheduling(null); fetchAppointments(); }}
        />
      )}

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
              <CardContent className="p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex flex-1 gap-3 md:gap-4">
                    <div className="h-11 w-11 md:h-12 md:w-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                      <Stethoscope className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{appt.doctor?.specialization}</p>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1">
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
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 flex-wrap">
                    <Badge className={getStatusColor(appt.status)}>{appt.status}</Badge>
                    {appt.status === 'RESCHEDULED' && (
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 rounded-lg px-2 py-1">
                          <AlertTriangle className="h-3 w-3" />
                          Schedule changed — please reschedule
                        </div>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => setRescheduling(appt)}
                          >
                            Reschedule
                          </Button>
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
                      </div>
                    )}
                    {['PENDING', 'CONFIRMED'].includes(appt.status) && (
                      <div className="flex gap-1.5">
                        <Link href={`/patient/consultation/${appt.id}`}>
                          <Button size="sm" variant="outline" className="gap-1 text-teal-600 border-teal-200">
                            <Video className="h-3.5 w-3.5" /> Join
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => setRescheduling(appt)}
                        >
                          Reschedule
                        </Button>
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
                      <Link href="/patient/records">
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
