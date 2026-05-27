'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { appointmentsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Calendar } from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';
import type { Appointment } from '@/types';

export default function DoctorPatientsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentsApi.getDoctor().then((res) => setAppointments(res.data)).finally(() => setLoading(false));
  }, []);

  // Deduplicate patients, keep the most recent appointment
  const patientMap = new Map<string, { patient: any; lastVisit: string; visitCount: number }>();
  for (const appt of appointments) {
    if (!appt.patient) continue;
    const existing = patientMap.get(appt.patientId);
    if (!existing || new Date(appt.date) > new Date(existing.lastVisit)) {
      patientMap.set(appt.patientId, {
        patient: appt.patient,
        lastVisit: appt.date,
        visitCount: (existing?.visitCount || 0) + 1,
      });
    } else {
      existing.visitCount++;
    }
  }
  const patients = Array.from(patientMap.values());

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>
        <p className="text-gray-500 text-sm">{patients.length} patients seen</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-200">
          <Users className="mx-auto h-10 w-10 text-gray-200 mb-3" />
          <p className="text-gray-500 text-sm">No patients yet</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map(({ patient, lastVisit, visitCount }) => (
            <Link key={patient.id} href={`/doctor/patients/${patient.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{getInitials(patient.firstName, patient.lastName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {visitCount} visit{visitCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Last visit: {formatDate(lastVisit)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
