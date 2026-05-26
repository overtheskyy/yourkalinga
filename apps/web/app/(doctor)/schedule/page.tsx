'use client';
import { useEffect, useState } from 'react';
import { schedulesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Plus, Trash2, Loader2, CheckCircle } from 'lucide-react';
import type { DoctorSchedule } from '@/types';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday',
};

export default function DoctorSchedulePage() {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const fetchSchedules = () => {
    schedulesApi.getMy().then((res) => setSchedules(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchSchedules(); }, []);

  const getSchedule = (day: string) => schedules.find((s) => s.dayOfWeek === day);

  const handleToggle = async (day: string) => {
    const existing = getSchedule(day);
    setSaving(day);
    try {
      if (existing) {
        await schedulesApi.upsert({ dayOfWeek: day, startTime: existing.startTime, endTime: existing.endTime, isActive: !existing.isActive });
      } else {
        await schedulesApi.upsert({ dayOfWeek: day, startTime: '09:00', endTime: '17:00' });
      }
      fetchSchedules();
      setSaved(day);
      setTimeout(() => setSaved(null), 2000);
    } finally {
      setSaving(null);
    }
  };

  const handleTimeChange = async (day: string, field: 'startTime' | 'endTime', value: string) => {
    const existing = getSchedule(day);
    if (!existing) return;
    setSaving(day);
    try {
      await schedulesApi.upsert({
        dayOfWeek: day,
        startTime: field === 'startTime' ? value : existing.startTime,
        endTime: field === 'endTime' ? value : existing.endTime,
        isActive: existing.isActive,
      });
      fetchSchedules();
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-gray-500 text-sm">Set your availability for patient bookings</p>
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
              {DAYS.map((d) => <Skeleton key={d} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {DAYS.map((day) => {
                const sched = getSchedule(day);
                const isActive = sched?.isActive || false;

                return (
                  <div key={day} className={`rounded-xl border-2 p-4 transition-all ${isActive ? 'border-teal-200 bg-teal-50/50' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggle(day)}
                          className={`relative h-5 w-9 rounded-full transition-colors ${isActive ? 'bg-teal-500' : 'bg-gray-200'}`}
                          disabled={saving === day}
                        >
                          <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <span className={`font-medium text-sm ${isActive ? 'text-teal-700' : 'text-gray-400'}`}>
                          {DAY_LABELS[day]}
                        </span>
                      </div>

                      {isActive && sched && (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={sched.startTime}
                            onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-400"
                          />
                          <span className="text-gray-400 text-xs">–</span>
                          <input
                            type="time"
                            value={sched.endTime}
                            onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-400"
                          />
                          {saving === day && <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-500" />}
                          {saved === day && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                        </div>
                      )}

                      {!isActive && (
                        <span className="text-xs text-gray-400">Unavailable</span>
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
          <li>Each slot is 30 minutes by default</li>
          <li>Patients can book from your active days only</li>
          <li>Changes take effect immediately for new bookings</li>
        </ul>
      </div>
    </div>
  );
}
