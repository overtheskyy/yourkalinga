'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { appointmentsApi, consultationsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Video, Plus, Trash2, CheckCircle, Loader2, Users } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import type { Appointment } from '@/types';

interface RxForm { medication: string; dosage: string; frequency: string; duration: string; instructions: string; }

const emptyRx = (): RxForm => ({ medication: '', dosage: '', frequency: '', duration: '', instructions: '' });

export default function DoctorConsultationPage() {
  const { id } = useParams<{ id: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [starting, setStarting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState({
    chiefComplaint: '', diagnosis: '', findings: '', recommendations: '', followUpDate: '',
  });
  const [prescriptions, setPrescriptions] = useState<RxForm[]>([]);

  const JITSI_DOMAIN = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';

  useEffect(() => {
    appointmentsApi.getOne(id).then((res) => {
      setAppointment(res.data);
      if (res.data.consultation) {
        const session = res.data.consultation;
        if (session.notes?.[0]) setNotes(session.notes[0]);
        if (session.prescriptions?.length) setPrescriptions(session.prescriptions);
      }
    }).finally(() => setLoading(false));
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

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await consultationsApi.addNote(id, { ...notes, prescriptions });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (!appointment) return <p>Appointment not found</p>;

  const roomId = appointment.jitsiRoomId || `yourkalinga-${id.slice(0, 8)}`;
  const patientName = `${appointment.patient?.firstName} ${appointment.patient?.lastName}`;
  const isCompleted = appointment.status === 'COMPLETED';

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultation Session</h1>
          <p className="text-gray-500 text-sm mt-0.5">{patientName} · {formatDate(appointment.date)} {formatTime(appointment.startTime)}</p>
        </div>
        <Badge variant={isCompleted ? 'success' : 'default'}>{appointment.status}</Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Video area */}
        <div className="space-y-4">
          {!joined ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-teal-100 flex items-center justify-center mb-4">
                  <Video className="h-8 w-8 text-teal-600" />
                </div>
                <h2 className="text-lg font-bold mb-2">Patient is waiting</h2>
                <p className="text-gray-500 text-sm mb-5">
                  {patientName} is in the consultation room.
                </p>
                {!isCompleted && (
                  <Button size="lg" onClick={handleJoin} disabled={starting} className="gap-2">
                    <Video className="h-5 w-5" />
                    {starting ? 'Starting...' : 'Start consultation'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gray-900 text-white py-3 px-5">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  Live · {patientName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <iframe
                  src={`https://${JITSI_DOMAIN}/${roomId}#config.prejoinPageEnabled=false&userInfo.displayName=Doctor`}
                  width="100%"
                  height="400"
                  allow="camera; microphone; display-capture; fullscreen"
                  className="border-0 min-h-[280px]"
                  style={{ height: 'clamp(280px, 50vh, 400px)' }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Notes form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consultation Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Chief Complaint</Label>
              <Textarea
                placeholder="Patient's main concern..."
                value={notes.chiefComplaint}
                onChange={(e) => setNotes({ ...notes, chiefComplaint: e.target.value })}
                rows={2}
                disabled={isCompleted}
              />
            </div>
            <div>
              <Label>Diagnosis</Label>
              <Input
                placeholder="Clinical diagnosis"
                value={notes.diagnosis}
                onChange={(e) => setNotes({ ...notes, diagnosis: e.target.value })}
                disabled={isCompleted}
              />
            </div>
            <div>
              <Label>Findings & Recommendations</Label>
              <Textarea
                placeholder="Clinical findings and treatment recommendations..."
                value={notes.recommendations}
                onChange={(e) => setNotes({ ...notes, recommendations: e.target.value })}
                rows={3}
                disabled={isCompleted}
              />
            </div>
            <div>
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                value={notes.followUpDate}
                onChange={(e) => setNotes({ ...notes, followUpDate: e.target.value })}
                disabled={isCompleted}
              />
            </div>

            {/* Prescriptions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Prescriptions</Label>
                {!isCompleted && (
                  <Button size="sm" variant="ghost" onClick={() => setPrescriptions([...prescriptions, emptyRx()])} className="text-teal-600 gap-1 h-7">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {prescriptions.map((rx, i) => (
                  <div key={i} className="rounded-lg border border-gray-100 p-3 space-y-2 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Rx {i + 1}</span>
                      {!isCompleted && (
                        <button onClick={() => setPrescriptions(prescriptions.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <Input placeholder="Medication" value={rx.medication} onChange={(e) => { const p = [...prescriptions]; p[i].medication = e.target.value; setPrescriptions(p); }} disabled={isCompleted} className="text-xs h-8" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      <Input placeholder="Dosage" value={rx.dosage} onChange={(e) => { const p = [...prescriptions]; p[i].dosage = e.target.value; setPrescriptions(p); }} disabled={isCompleted} className="text-xs h-8" />
                      <Input placeholder="Frequency" value={rx.frequency} onChange={(e) => { const p = [...prescriptions]; p[i].frequency = e.target.value; setPrescriptions(p); }} disabled={isCompleted} className="text-xs h-8" />
                      <Input placeholder="Duration" value={rx.duration} onChange={(e) => { const p = [...prescriptions]; p[i].duration = e.target.value; setPrescriptions(p); }} disabled={isCompleted} className="text-xs h-8" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!isCompleted && (
              <Button onClick={handleSaveNotes} disabled={saving} className="w-full gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : null}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save consultation notes'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
