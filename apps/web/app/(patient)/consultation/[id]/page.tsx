'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { appointmentsApi, consultationsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, AlertCircle, Clock, Stethoscope } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import type { Appointment } from '@/types';

export default function PatientConsultationPage() {
  const { id } = useParams<{ id: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [starting, setStarting] = useState(false);

  const JITSI_DOMAIN = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';

  useEffect(() => {
    appointmentsApi.getOne(id).then((res) => setAppointment(res.data)).finally(() => setLoading(false));
  }, [id]);

  const handleJoin = async () => {
    setStarting(true);
    try {
      await consultationsApi.start(id);
      setJoined(true);
    } finally {
      setStarting(false);
    }
  };

  if (loading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (!appointment) return <p>Appointment not found</p>;

  const roomId = appointment.jitsiRoomId || `yourkalinga-${id.slice(0, 8)}`;
  const jitsiUrl = `https://${JITSI_DOMAIN}/${roomId}`;

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Consultation Room</h1>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold">Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}</p>
              <p className="text-sm text-gray-500">{appointment.doctor?.specialization}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDate(appointment.date)} · {formatTime(appointment.startTime)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!joined ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto h-20 w-20 rounded-2xl bg-teal-100 flex items-center justify-center mb-4">
              <Video className="h-10 w-10 text-teal-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Ready to join?</h2>
            <p className="text-gray-500 text-sm mb-6">
              Your consultation room is ready. Click below to join the secure video call with your doctor.
            </p>
            {['PENDING', 'CONFIRMED'].includes(appointment.status) ? (
              <Button size="lg" onClick={handleJoin} disabled={starting} className="gap-2">
                <Video className="h-5 w-5" />
                {starting ? 'Starting session...' : 'Join consultation'}
              </Button>
            ) : (
              <div className="flex items-center gap-2 justify-center text-gray-500">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                This appointment is {appointment.status.toLowerCase()}.
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-900 text-white py-3 px-5">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Live Consultation · Powered by Jitsi Meet
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              src={`${jitsiUrl}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&userInfo.displayName=Patient`}
              width="100%"
              height="540"
              allow="camera; microphone; display-capture; fullscreen"
              className="border-0"
            />
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">Tips for a smooth consultation:</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-600">
          <li>Ensure you're in a quiet, well-lit location</li>
          <li>Have your medical history and current medications ready</li>
          <li>Test your camera and microphone before joining</li>
        </ul>
      </div>
    </div>
  );
}
