'use client';
import { useEffect, useState } from 'react';
import { recordsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Pill, Stethoscope, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { MedicalRecord } from '@/types';

export default function PatientRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recordsApi.getMyRecords().then((res) => setRecords(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
        <p className="text-gray-500 text-sm">Your consultation history and prescriptions</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-200">
          <FileText className="mx-auto h-10 w-10 text-gray-200 mb-3" />
          <p className="text-gray-500 text-sm">No medical records yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Records will appear here after completed consultations
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.id} className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-teal-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{record.title}</CardTitle>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" /> {formatDate(record.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{record.recordType}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {record.session?.notes?.map((note) => (
                  <div key={note.id} className="rounded-lg bg-gray-50 p-3 space-y-2">
                    {note.chiefComplaint && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chief Complaint</p>
                        <p className="text-sm text-gray-700">{note.chiefComplaint}</p>
                      </div>
                    )}
                    {note.diagnosis && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Diagnosis</p>
                        <p className="text-sm text-gray-700">{note.diagnosis}</p>
                      </div>
                    )}
                    {note.recommendations && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recommendations</p>
                        <p className="text-sm text-gray-700">{note.recommendations}</p>
                      </div>
                    )}
                  </div>
                ))}

                {record.session?.prescriptions && record.session.prescriptions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-2">
                      <Pill className="h-3.5 w-3.5" /> Prescriptions
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {record.session.prescriptions.map((rx) => (
                        <div key={rx.id} className="rounded-lg border border-gray-100 bg-blue-50 p-3">
                          <p className="font-medium text-sm text-gray-900">{rx.medication}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {rx.dosage} · {rx.frequency} · {rx.duration}
                          </p>
                          {rx.instructions && (
                            <p className="text-xs text-gray-400 mt-1 italic">{rx.instructions}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {record.session?.doctor && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
                    <Stethoscope className="h-3.5 w-3.5" />
                    Dr. {record.session.doctor.firstName} {record.session.doctor.lastName} · {record.session.doctor.specialization}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
