'use client';
import { useEffect, useState } from 'react';
import { schedulesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Loader2 } from 'lucide-react';
import type { DoctorSchedule } from '@/types';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday',
};

export default function DoctorSchedulePage() {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchSchedules = () => {
    schedulesApi.getMy()
      .then((res) => setSchedules(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSchedules(); }, []);

  const getSchedule = (day: string) => schedules.find((s) => s.dayOfWeek === day);

  const handleToggle = async (day: string) => {
    const existing = getSchedule(day);
    const newIsActive = existing ? !existing.isActive : true;
    setToggling(day);
    try {
      await schedulesApi.upsert({ dayOfWeek: day, isActive: newIsActive });
      fetchSchedules();
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-gray-500 text-sm">9:00 AM – 5:00 PM · Toggle which days you're available</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-teal-600" /> Weekly Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {DAYS.map((d) => <Skeleton key={d} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {DAYS.map((day) => {
                const sched = getSchedule(day);
                const isActive = sched?.isActive ?? false;

                return (
                  <div
                    key={day}
                    className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all ${
                      isActive ? 'border-teal-200 bg-teal-50/50' : 'border-gray-100'
                    }`}
                  >
                    <span className={`font-medium text-sm ${isActive ? 'text-teal-700' : 'text-gray-400'}`}>
                      {DAY_LABELS[day]}
                    </span>
                    <div className="flex items-center gap-3">
                      {isActive
                        ? <span className="text-xs text-teal-600">9:00 AM – 5:00 PM</span>
                        : <span className="text-xs text-gray-400">Unavailable</span>
                      }
                      {toggling === day ? (
                        <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
                      ) : (
                        <button
                          onClick={() => handleToggle(day)}
                          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${isActive ? 'bg-teal-500' : 'bg-gray-200'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">Schedule notes</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-600 text-xs">
          <li>Slots are 30 minutes, from 9:00 AM to 5:00 PM</li>
          <li>Patients can only book on your active days</li>
          <li>Changes take effect immediately for new bookings</li>
        </ul>
      </div>
    </div>
  );
}
