'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { patientsApi, recordsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, User, Pill, FileText, Calendar } from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      patientsApi.getById(id).then((r) => setPatient(r.data)),
      recordsApi.getPatientRecords(id).then((r) => setRecords(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-60 rounded-xl" />
    </div>
  );

  if (!patient) return <p>Patient not found</p>;

  return (
    <div className="space-y-5 max-w-2xl">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600">
        <ChevronLeft className="h-4 w-4" /> Back to patients
      </button>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">{getInitials(patient.firstName, patient.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{patient.firstName} {patient.lastName}</h1>
              <p className="text-sm text-gray-500">{patient.user?.email}</p>
              <div className="flex gap-3 mt-2 flex-wrap">
                {patient.bloodType && <Badge variant="secondary">{patient.bloodType}</Badge>}
                {patient.birthday && <span className="text-xs text-gray-400">Born {formatDate(patient.birthday)}</span>}
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm">
            {patient.weight && <div><span className="text-gray-400">Weight: </span>{patient.weight} kg</div>}
            {patient.height && <div><span className="text-gray-400">Height: </span>{patient.height} cm</div>}
            {patient.contactNumber && <div><span className="text-gray-400">Contact: </span>{patient.contactNumber}</div>}
            {patient.allergies && <div className="col-span-2"><span className="text-gray-400">Allergies: </span>{patient.allergies}</div>}
            {patient.medicalHistory && <div className="col-span-2"><span className="text-gray-400">History: </span>{patient.medicalHistory}</div>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-600" /> Medical Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No records yet</p>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div key={record.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{record.title}</p>
                    <span className="text-xs text-gray-400">{formatDate(record.createdAt)}</span>
                  </div>
                  {record.session?.notes?.map((note: any) => (
                    <div key={note.id} className="text-xs text-gray-600 space-y-1">
                      {note.diagnosis && <p><span className="font-medium">Dx:</span> {note.diagnosis}</p>}
                      {note.recommendations && <p><span className="font-medium">Rx plan:</span> {note.recommendations}</p>}
                    </div>
                  ))}
                  {record.session?.prescriptions?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {record.session.prescriptions.map((rx: any) => (
                        <span key={rx.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">
                          <Pill className="h-2.5 w-2.5" /> {rx.medication} {rx.dosage}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
