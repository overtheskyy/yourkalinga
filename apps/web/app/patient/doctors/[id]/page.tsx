'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doctorsApi, appointmentsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, CheckCircle, Calendar, Clock, ChevronLeft, ChevronRight, Loader2, Languages } from 'lucide-react';
import { formatDate, formatTime, getInitials } from '@/lib/utils';
import type { DoctorProfile } from '@/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getNext7Days(offset = 0) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + offset * 7);
    return d;
  });
}

// Use local date parts so the displayed day and the sent ISO string always match.
function toLocalISO(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const dates = getNext7Days(weekOffset);

  useEffect(() => {
    doctorsApi.getOne(id).then((res) => setDoctor(res.data)).finally(() => setLoading(false));
  }, [id]);

  const handleDateSelect = async (date: Date) => {
    const iso = toLocalISO(date);
    setSelectedDate(iso);
    setSelectedSlot('');
    setSlotsLoading(true);
    try {
      const res = await doctorsApi.getSlots(id, iso);
      setSlots(res.data);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot) return;
    setBooking(true);
    try {
      const [h, m] = selectedSlot.split(':').map(Number);
      const endH = h + (doctor?.schedules?.[0]?.slotDuration || 30) / 60;
      const endM = m + ((doctor?.schedules?.[0]?.slotDuration || 30) % 60);
      const endTime = `${Math.floor(endH).toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

      await appointmentsApi.create({
        doctorId: id,
        date: selectedDate,
        startTime: selectedSlot,
        endTime,
        reason,
      });
      router.push('/patient/appointments');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );

  if (!doctor) return <p>Doctor not found</p>;

  return (
    <div className="space-y-5 max-w-3xl">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600">
        <ChevronLeft className="h-4 w-4" /> Back to doctors
      </button>

      {/* Doctor info */}
      <Card>
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 shrink-0">
              {doctor.avatarUrl && <AvatarImage src={doctor.avatarUrl} />}
              <AvatarFallback className="text-xl">{getInitials(doctor.firstName, doctor.lastName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">Dr. {doctor.firstName} {doctor.lastName}</h1>
                {doctor.isVerified && <CheckCircle className="h-5 w-5 text-teal-500" />}
              </div>
              <Badge className="mt-1">{doctor.specialization}</Badge>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  {doctor.rating.toFixed(1)} ({doctor.reviewCount} reviews)
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {doctor.yearsExperience} years exp.
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <Languages className="h-4 w-4" />
                  {doctor.languages?.join(', ')}
                </div>
              </div>
              {doctor.bio && <p className="mt-3 text-sm text-gray-600">{doctor.bio}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-teal-600" /> Book a Consultation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Select a date</p>
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
                const iso = toLocalISO(date);
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

          {selectedDate && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Available slots</p>
              {slotsLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[1,2,3,4].map((i) => <Skeleton key={i} className="h-10" />)}
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

          {selectedSlot && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1.5">Reason for visit (optional)</p>
              <textarea
                className="w-full rounded-lg border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={2}
                placeholder="Brief description of your concern..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400">Consultation fee</p>
              <p className="font-semibold text-teal-700">₱{doctor.consultationFee.toLocaleString()}</p>
            </div>
            <Button onClick={handleBook} disabled={!selectedDate || !selectedSlot || booking}>
              {booking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking...</> : 'Confirm booking'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      {doctor.reviews && doctor.reviews.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Patient Reviews</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {doctor.reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {review.patient.firstName} {review.patient.lastName}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-gray-500">{review.comment}</p>}
                  <p className="text-xs text-gray-400 mt-1">{formatDate(review.createdAt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
